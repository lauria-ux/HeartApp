import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import type { MeasurementMode, CameraFacing } from '@/types/health';

export default function MeasureSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<MeasurementMode>('quick');
  const [facing, setFacing] = useState<CameraFacing>('rear');

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Measurement</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Mode */}
      <Text style={styles.sectionLabel}>Mode</Text>
      <View style={styles.segmentContainer}>
        {(['quick', 'precise'] as MeasurementMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.segment, mode === m && styles.segmentActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
              {m === 'quick' ? '⚡  Quick  (~30s)' : '🎯  Precise  (~60s)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.modeHint}>
        {mode === 'quick'
          ? 'Measures heart rate. Good for a fast daily check-in.'
          : 'Measures heart rate + HRV + Stress Index. Requires a steady 60 seconds.'}
      </Text>

      {/* Camera */}
      <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Camera</Text>
      <View style={styles.cameraRow}>
        <TouchableOpacity
          style={[styles.cameraCard, facing === 'rear' && styles.cameraCardActive]}
          onPress={() => setFacing('rear')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="camera-outline"
            size={32}
            color={facing === 'rear' ? Colors.accent : Colors.textSecondary}
          />
          <Text style={[styles.cameraLabel, facing === 'rear' && styles.cameraLabelActive]}>
            Rear
          </Text>
          <Text style={styles.cameraDesc}>Finger on lens</Text>
          <Text style={styles.cameraAccuracy}>More accurate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cameraCard, facing === 'front' && styles.cameraCardActive]}
          onPress={() => setFacing('front')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person-outline"
            size={32}
            color={facing === 'front' ? Colors.accent : Colors.textSecondary}
          />
          <Text style={[styles.cameraLabel, facing === 'front' && styles.cameraLabelActive]}>
            Front
          </Text>
          <Text style={styles.cameraDesc}>Face scan</Text>
          <Text style={styles.cameraAccuracy}>Hands-free</Text>
        </TouchableOpacity>
      </View>

      {/* Tip */}
      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
        <Text style={styles.tipText}>
          {facing === 'rear'
            ? 'Cover the rear camera and flash gently with your fingertip. Apply light, steady pressure and breathe normally.'
            : 'Position your face clearly in the frame. Stay still, keep good lighting, and breathe normally.'}
        </Text>
      </View>

      {/* Start */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() =>
          router.push({ pathname: '/measure/capture', params: { mode, facing } })
        }
        activeOpacity={0.85}
      >
        <Ionicons name="heart" size={18} color="#fff" style={{ marginRight: Spacing.sm }} />
        <Text style={styles.startText}>Start Measurement</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    marginBottom: Spacing.xl,
  },
  cancelBtn: { paddingVertical: 4, paddingRight: Spacing.sm },
  cancelText: { fontSize: FontSize.base, color: Colors.textSecondary },
  title: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  headerSpacer: { width: 60 },
  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  segmentActive: { backgroundColor: Colors.surface },
  segmentText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  segmentTextActive: { color: Colors.text, fontWeight: '600' },
  modeHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  cameraRow: { flexDirection: 'row', gap: Spacing.sm },
  cameraCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cameraCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  cameraLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  cameraLabelActive: { color: Colors.accent },
  cameraDesc: { fontSize: FontSize.xs, color: Colors.textTertiary },
  cameraAccuracy: { fontSize: FontSize.xs, color: Colors.textTertiary },
  tip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    marginTop: 'auto',
  },
  startText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
