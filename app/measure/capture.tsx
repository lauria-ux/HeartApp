import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  useCameraDevice,
  useFrameOutput,
  useCameraPermission,
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-worklets';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { analysePPGBuffer, type PPGSample } from '@/lib/ppg';
import type { MeasurementMode, CameraFacing } from '@/types/health';

// ─── Constants ─────────────────────────────────────────────────────────────

const QUICK_DURATION_S = 30;
const PRECISE_DURATION_S = 60;
const WAVEFORM_HISTORY = 120; // last 4s at 30fps visible in waveform
const ANALYSIS_INTERVAL_MS = 3000; // re-analyse every 3s
const SAMPLE_EVERY_N_PIXELS = 80; // skip pixels in Y-plane for performance

// ─── Helpers ───────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const WAVEFORM_W = SCREEN_W - Spacing.md * 2 - 32; // card padding
const WAVEFORM_H = 64;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, facing } = useLocalSearchParams<{
    mode: MeasurementMode;
    facing: CameraFacing;
  }>();

  const isRear = facing !== 'front';
  const durationS = mode === 'precise' ? PRECISE_DURATION_S : QUICK_DURATION_S;

  // ── Camera ──
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraPosition = isRear ? 'back' : 'front';
  const device = useCameraDevice(cameraPosition);

  // ── State ──
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrv, setHrv] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0–1
  const [timeLeft, setTimeLeft] = useState(durationS);
  const [waveform, setWaveform] = useState<number[]>([]); // normalised 0–1
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // ── Refs (survive re-renders without triggering them) ──
  const samplesRef = useRef<PPGSample[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastAnalysisRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNavigatedRef = useRef(false);

  // ── Permission check ──
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (!granted) setPermissionDenied(true);
        else setIsCapturing(true);
      });
    } else {
      setIsCapturing(true);
    }
  }, [hasPermission, requestPermission]);

  // ── Countdown timer ──
  useEffect(() => {
    if (!isCapturing) return;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, durationS - elapsed);
      setTimeLeft(Math.ceil(remaining));
      setProgress(clamp(elapsed / durationS, 0, 1));

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        finishMeasurement();
      }
    }, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCapturing, durationS]);

  // ── Navigate to results with collected data ──
  const finishMeasurement = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    const result = analysePPGBuffer(samplesRef.current);
    router.replace({
      pathname: '/measure/results',
      params: {
        mode,
        facing,
        heartRate: result?.heartRate ?? 0,
        hrv: result?.hrv ?? 0,
        stressIndex: result?.stressIndex ?? 0,
        healthIndex: result?.healthIndex ?? 0,
        rrIntervals: JSON.stringify(result?.rrIntervals ?? []),
        confidence: result?.confidence ?? 0,
        // Always pass real values — results screen gates display by mode
      },
    });
  }, [mode, facing, router]);

  // ── Frame data receiver (JS thread) ──
  const onFrameData = useCallback(
    (avgLuminance: number, timestamp: number) => {
      const sample: PPGSample = { value: avgLuminance, timestamp };
      samplesRef.current.push(sample);

      // Keep only last 90s of samples
      if (samplesRef.current.length > 90 * 30) {
        samplesRef.current = samplesRef.current.slice(-90 * 30);
      }

      // Update waveform display (last WAVEFORM_HISTORY samples)
      const recent = samplesRef.current.slice(-WAVEFORM_HISTORY);
      if (recent.length > 10) {
        const vals = recent.map((s) => s.value);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min;
        const normalised =
          range > 0 ? vals.map((v) => (v - min) / range) : vals.map(() => 0.5);
        setWaveform(normalised);
      }

      // Run full analysis every ANALYSIS_INTERVAL_MS
      const now = Date.now();
      if (now - lastAnalysisRef.current > ANALYSIS_INTERVAL_MS) {
        lastAnalysisRef.current = now;
        const result = analysePPGBuffer(samplesRef.current);
        if (result) {
          setBpm(result.heartRate);
          setHrv(result.hrv);
        }
      }
    },
    [],
  );

  // ── Frame processor (runs on camera thread as a worklet) ──
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      try {
        // YUV format: plane[0] is the Y (luminance) plane — full W×H resolution.
        // Luminance changes with blood-flow-modulated light reflected off the finger.
        const planes = frame.getPlanes();
        if (planes.length === 0) {
          frame.dispose();
          return;
        }

        const yPlane = planes[0];
        const buffer = yPlane.getPixelBuffer();
        const data = new Uint8Array(buffer);

        // Sample every Nth byte for performance (still hundreds of samples per frame)
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += SAMPLE_EVERY_N_PIXELS) {
          total += data[i];
          count++;
        }

        const avgY = count > 0 ? total / count : 0;
        runOnJS(onFrameData)(avgY, frame.timestamp * 1000);
      } finally {
        // MUST dispose to prevent camera pipeline stall
        frame.dispose();
      }
    },
  });

  // ── Cancel ──
  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  // ─── Render: permission denied ──
  const safeStyle = { paddingTop: insets.top, paddingBottom: insets.bottom };

  if (permissionDenied) {
    return (
      <View style={[styles.container, safeStyle]}>
        <View style={styles.centred}>
          <Ionicons name="camera-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permText}>
            Please enable camera access in Settings to use the heart rate monitor.
          </Text>
        </View>
        <TouchableOpacity style={styles.cancelBtnFull} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render: no device ──
  if (!device) {
    return (
      <View style={[styles.container, safeStyle]}>
        <View style={styles.centred}>
          <Text style={styles.permText}>Camera device not found.</Text>
        </View>
      </View>
    );
  }

  // ─── Render: main capture UI ──
  return (
    <View style={[styles.container, safeStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Measuring</Text>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {mode === 'precise' ? 'Precise' : 'Quick'}
          </Text>
        </View>
      </View>

      {/* Camera preview */}
      <View style={styles.cameraWrap}>
        {isCapturing && (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isCapturing}
            outputs={[frameOutput]}
            constraints={[{ fps: 30 }]}
            // Torch on for rear camera (finger PPG needs flash for clean signal)
            torchMode={isRear ? 'on' : 'off'}
          />
        )}

        {/* Finger overlay guide (rear only) */}
        {isRear && (
          <View style={styles.fingerGuide}>
            <View style={styles.fingerCircle}>
              <Ionicons name="finger-print-outline" size={48} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.fingerHint}>Keep finger steady</Text>
          </View>
        )}

        {/* Progress ring overlay */}
        <View style={styles.progressOverlay}>
          <Text style={styles.timeLeft}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Waveform */}
      <View style={styles.waveformCard}>
        <Text style={styles.waveformLabel}>PPG Signal</Text>
        <View style={styles.waveformArea}>
          {waveform.length > 0 ? (
            waveform.map((v, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: Math.max(2, v * WAVEFORM_H),
                    opacity: 0.4 + v * 0.6,
                  },
                ]}
              />
            ))
          ) : (
            <Text style={styles.waveformWaiting}>
              {isRear
                ? 'Place finger over camera lens…'
                : 'Position face in frame…'}
            </Text>
          )}
        </View>
      </View>

      {/* Live metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Heart Rate</Text>
          <Text style={styles.metricValue}>
            {bpm !== null ? bpm : '—'}
          </Text>
          <Text style={styles.metricUnit}>bpm</Text>
        </View>

        {mode === 'precise' && (
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>HRV</Text>
            <Text style={styles.metricValue}>
              {hrv !== null ? hrv : '—'}
            </Text>
            <Text style={styles.metricUnit}>ms</Text>
          </View>
        )}
      </View>

      {/* Tip */}
      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
        <Text style={styles.tipText}>
          {isRear
            ? 'Hold still. Breathe slowly. Don\'t press too hard.'
            : 'Keep your face centred. Stay in good lighting.'}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  cancelBtn: { paddingVertical: 4, paddingRight: Spacing.sm },
  cancelText: { fontSize: FontSize.base, color: Colors.textSecondary },
  title: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  modeBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBadgeText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600' },

  // Camera
  cameraWrap: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    minHeight: 200,
    maxHeight: 280,
  },
  fingerGuide: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  fingerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerHint: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  progressOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  timeLeft: { fontSize: FontSize.sm, color: '#fff', fontWeight: '700' },

  // Progress bar
  progressBar: {
    height: 3,
    backgroundColor: Colors.card,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },

  // Waveform
  waveformCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  waveformLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  waveformArea: {
    height: WAVEFORM_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    overflow: 'hidden',
  },
  waveBar: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    minWidth: 2,
  },
  waveformWaiting: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlignVertical: 'center',
    lineHeight: WAVEFORM_H,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: FontSize.display,
    fontWeight: '800',
    color: Colors.accent,
    lineHeight: FontSize.display + 4,
  },
  metricUnit: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Tip
  tip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },

  // Permission denied
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  permTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  permText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  cancelBtnFull: {
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cancelBtnText: { fontSize: FontSize.base, color: Colors.text, fontWeight: '600' },
});
