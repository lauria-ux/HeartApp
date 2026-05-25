import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import {
  CONTEXT_TAG_LABELS,
  getHRStatus,
  getHRVStatus,
  getStressStatus,
  type ContextTag,
  type HealthStatus,
} from '@/types/health';
import { saveMeasurement } from '@/lib/storage';

// ─── Types ─────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MetricExplanation {
  icon: IoniconName;
  title: string;
  value: string;
  unit: string;
  status: HealthStatus;
  normalRange: string;
  explanation: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<HealthStatus, string> = {
  low: Colors.low,
  normal: Colors.normal,
  elevated: Colors.elevated,
  high: Colors.high,
};

const STATUS_LABELS: Record<HealthStatus, string> = {
  low: 'Low',
  normal: 'Normal',
  elevated: 'Elevated',
  high: 'High',
};

const HR_EXPLANATIONS: Record<HealthStatus, string> = {
  low: 'Your resting heart rate is below 60 bpm. This can be normal for athletes, but if you feel dizzy or faint, consult a healthcare professional.',
  normal: 'Your resting heart rate is within the healthy range of 60–100 bpm, indicating good cardiovascular function.',
  elevated: 'Your heart rate is slightly above the typical resting range. This can result from exercise, caffeine, stress, or emotion.',
  high: 'Your heart rate is above 100 bpm. This is normal immediately after exercise, but if you\'re at rest, consider speaking with a doctor.',
};

const HRV_EXPLANATIONS: Record<HealthStatus, string> = {
  low: 'HRV above 40 ms suggests good heart rate variability, reflecting strong parasympathetic (rest-and-digest) activity.',
  normal: 'HRV above 40 ms suggests good heart rate variability, reflecting strong parasympathetic (rest-and-digest) activity.',
  elevated: 'Your HRV is moderate (20–40 ms). Stress, sleep, hydration, and fitness all influence HRV.',
  high: 'Your HRV is low (under 20 ms), which may reflect accumulated stress, poor sleep, or intense exercise. Consider rest and recovery.',
};

const STRESS_EXPLANATIONS: Record<HealthStatus, string> = {
  low: 'Your stress level appears low, indicating your autonomic nervous system is well-recovered.',
  normal: 'Your stress level appears low, indicating your autonomic nervous system is well-recovered.',
  elevated: 'A moderate stress level. Common during daily life — physical, mental, or emotional demands all contribute.',
  high: 'Your physiological stress markers are elevated. Rest, breathing exercises, or a short walk can help recovery.',
};

const TAGS = Object.entries(CONTEXT_TAG_LABELS) as [ContextTag, string][];

// ─── Component ─────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode: string;
    facing: string;
    heartRate: string;
    hrv: string;
    stressIndex: string;
    healthIndex: string;
    rrIntervals: string;
    confidence: string;
  }>();

  const isPrecise = params.mode === 'precise';
  const heartRate = parseInt(params.heartRate ?? '0', 10);
  const hrv = parseInt(params.hrv ?? '0', 10);
  const stressIndex = parseInt(params.stressIndex ?? '0', 10);
  const healthIndex = parseFloat(params.healthIndex ?? '0');
  const confidence = parseFloat(params.confidence ?? '0');
  const rrIntervals: number[] = params.rrIntervals
    ? JSON.parse(params.rrIntervals)
    : [];

  const hasData = heartRate > 0;

  const [selectedTag, setSelectedTag] = useState<ContextTag | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Build metric cards ──
  // Show HRV + stress whenever we have a valid reading regardless of mode.
  // Precise (60 s) gives more accurate HRV; Quick (30 s) is still useful.
  const hasHRV = hasData && hrv > 0;
  const hrStatus = hasData ? getHRStatus(heartRate) : 'normal';
  const hrvStatus = hasHRV ? getHRVStatus(hrv) : 'normal';
  const stressStatus = hasHRV ? getStressStatus(stressIndex) : 'normal';

  const metrics: MetricExplanation[] = [
    {
      icon: 'heart-outline',
      title: 'Heart Rate',
      value: hasData ? heartRate.toString() : '—',
      unit: 'bpm',
      status: hrStatus,
      normalRange: '60–100 bpm',
      explanation: hasData ? HR_EXPLANATIONS[hrStatus] : 'No reading captured.',
    },
    {
      icon: 'pulse-outline' as IoniconName,
      title: 'HRV (RMSSD)',
      value: hasHRV ? hrv.toString() : '—',
      unit: 'ms',
      status: hrvStatus,
      normalRange: '> 40 ms',
      explanation: hasHRV
        ? HRV_EXPLANATIONS[hrvStatus] + (!isPrecise ? ' For a more accurate reading, try Precise mode (60 s).' : '')
        : 'No reading captured.',
    },
    {
      icon: 'flash-outline' as IoniconName,
      title: 'Stress Index',
      value: hasHRV ? stressIndex.toString() : '—',
      unit: '/100',
      status: stressStatus,
      normalRange: '< 30',
      explanation: hasHRV ? STRESS_EXPLANATIONS[stressStatus] : 'No reading captured.',
    },
  ];

  // ── Save measurement ──
  const handleSave = async () => {
    if (!hasData || saved) return;

    await saveMeasurement({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      heartRate,
      hrv,
      stressIndex,
      healthIndex,
      mode: params.mode as 'quick' | 'precise',
      cameraFacing: params.facing as 'rear' | 'front',
      contextTag: selectedTag ?? undefined,
      rrIntervals,
    });

    setSaved(true);
    router.dismissAll();
  };

  const handleDiscard = () => router.dismissAll();

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.subtitle}>Measurement complete</Text>
        </View>

        {/* Health Index card */}
        <View style={styles.indexCard}>
          {hasData ? (
            <>
              <Text style={styles.indexLabel}>Health Index</Text>
              <Text style={styles.indexValue}>{healthIndex.toFixed(1)}</Text>
              <Text style={styles.indexOutOf}>out of 10</Text>
              {confidence < 0.6 && (
                <View style={styles.lowConfidenceBanner}>
                  <Ionicons name="warning-outline" size={14} color={Colors.elevated} />
                  <Text style={styles.lowConfidenceText}>
                    Signal quality was low — try again with a steadier hold.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={36} color={Colors.textTertiary} />
              <Text style={styles.indexNoData}>No signal captured</Text>
              <Text style={styles.indexNoDataSub}>
                The signal was too noisy or the measurement was too short.
                Please try again.
              </Text>
            </>
          )}
        </View>

        {/* Individual metrics */}
        {metrics.map((m) => (
          <View key={m.title} style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={styles.metricIconWrap}>
                <Ionicons name={m.icon} size={18} color={Colors.accent} />
              </View>
              <View style={styles.metricTitleBlock}>
                <Text style={styles.metricTitle}>{m.title}</Text>
                <Text style={styles.metricRange}>Normal: {m.normalRange}</Text>
              </View>
              <View style={styles.metricValueBlock}>
                <Text style={[styles.metricValue, hasData && { color: STATUS_COLORS[m.status] }]}>
                  {m.value}
                </Text>
                <Text style={styles.metricUnit}>{m.unit}</Text>
              </View>
            </View>
            {hasData && (
              <>
                <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[m.status] }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[m.status] }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLORS[m.status] }]}>
                    {STATUS_LABELS[m.status]}
                  </Text>
                </View>
                <Text style={styles.metricExplanation}>{m.explanation}</Text>
              </>
            )}
          </View>
        ))}

        {/* Context tag */}
        <Text style={styles.sectionLabel}>When did you measure?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          {TAGS.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tagPill,
                selectedTag === key && styles.tagPillActive,
              ]}
              onPress={() => setSelectedTag(selectedTag === key ? null : key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTag === key && styles.tagTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This is a general wellness indicator, not a medical measurement.
          Results should not be used for diagnosis or treatment decisions.
        </Text>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.discardBtn}
          onPress={handleDiscard}
          activeOpacity={0.75}
        >
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasData && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={hasData ? 0.85 : 1}
        >
          <Text style={styles.saveText}>Save Result</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 2 },

  // Index card
  indexCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  indexLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  indexValue: {
    fontSize: FontSize.display,
    fontWeight: '800',
    color: Colors.accent,
    lineHeight: FontSize.display + 8,
  },
  indexOutOf: { fontSize: FontSize.sm, color: Colors.textTertiary },
  indexNoData: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.sm },
  indexNoDataSub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  lowConfidenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
  },
  lowConfidenceText: { fontSize: FontSize.xs, color: Colors.elevated, flex: 1, lineHeight: 16 },

  // Metric cards
  metricCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitleBlock: { flex: 1 },
  metricTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  metricRange: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  metricValueBlock: { alignItems: 'flex-end' },
  metricValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  metricUnit: { fontSize: FontSize.xs, color: Colors.textTertiary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  metricExplanation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Tags
  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  tagRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  tagPill: {
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagPillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  tagText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  tagTextActive: { color: Colors.accent, fontWeight: '600' },

  // Disclaimer
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.xl,
  },
  bottomPad: { height: Spacing.xxl },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discardText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
