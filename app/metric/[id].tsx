/**
 * Metric detail screen — shows a trend chart + stats for one metric.
 * Navigated to from the home screen metric cards.
 * Route: /metric/heartRate  /metric/hrv  /metric/stressIndex
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getMeasurements } from '@/lib/storage';
import { type Measurement } from '@/types/health';
import BellCurveGauge, { type Zone } from '@/components/BellCurveGauge';

// ─── Metric config ────────────────────────────────────────────────────────────

type MetricId = 'heartRate' | 'hrv' | 'stressIndex';

interface MetricConfig {
  label: string;
  unit: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
  rangeMin: number;
  rangeMax: number;
  peakAt: number;
  sigma: number;
  zones: Zone[];
  edgeLabels: [string, string, string];
  goodDirection: 'mid' | 'high' | 'low'; // what direction is "better"
}

const CONFIGS: Record<MetricId, MetricConfig> = {
  heartRate: {
    label: 'Heart Rate',
    unit: 'bpm',
    icon: 'heart',
    description: 'Resting heart rate reflects how hard your heart works at rest. A lower rate generally means a more efficient heart.',
    rangeMin: 30,
    rangeMax: 150,
    peakAt: 72,
    sigma: 16,
    zones: [
      { min: 0,   max: 50,  color: Colors.low,     label: 'Low' },
      { min: 50,  max: 60,  color: Colors.elevated, label: 'Low-Normal' },
      { min: 60,  max: 100, color: Colors.normal,   label: 'Normal' },
      { min: 100, max: 120, color: Colors.elevated,  label: 'Elevated' },
      { min: 120, max: 999, color: Colors.high,     label: 'High' },
    ],
    edgeLabels: ['30', '60–100 bpm', '150+'],
    goodDirection: 'mid',
  },
  hrv: {
    label: 'HRV (RMSSD)',
    unit: 'ms',
    icon: 'pulse-outline',
    description: 'Heart Rate Variability reflects your autonomic nervous system balance. Higher HRV is associated with better recovery, lower stress and cardiovascular fitness.',
    rangeMin: 0,
    rangeMax: 100,
    peakAt: 55,
    sigma: 20,
    zones: [
      { min: 0,   max: 20,  color: Colors.high,    label: 'Low (High Stress)' },
      { min: 20,  max: 40,  color: Colors.elevated, label: 'Moderate' },
      { min: 40,  max: 999, color: Colors.normal,  label: 'Good' },
    ],
    edgeLabels: ['0', '> 40 ms', '100+'],
    goodDirection: 'high',
  },
  stressIndex: {
    label: 'Stress Index',
    unit: '/100',
    icon: 'flash-outline',
    description: 'Derived from HRV, this index estimates physiological stress load. Lower scores indicate better autonomic recovery and resilience.',
    rangeMin: 0,
    rangeMax: 100,
    peakAt: 18,
    sigma: 18,
    zones: [
      { min: 0,   max: 30,  color: Colors.normal,  label: 'Low' },
      { min: 30,  max: 50,  color: Colors.elevated, label: 'Moderate' },
      { min: 50,  max: 999, color: Colors.high,    label: 'High' },
    ],
    edgeLabels: ['0', '< 30', '100'],
    goodDirection: 'low',
  },
};

// ─── Trend chart (pure RN, no SVG library) ────────────────────────────────────

const CHART_W = Dimensions.get('window').width - Spacing.md * 2 - Spacing.md * 2;
const CHART_H = 140;
const DOT_R   = 4;

interface ChartPoint { value: number; timestamp: number }

function TrendChart({ data, zones, rangeMin, rangeMax }: {
  data: ChartPoint[];
  zones: Zone[];
  rangeMin: number;
  rangeMax: number;
}) {
  if (data.length === 0) return null;

  const span  = Math.max(1, rangeMax - rangeMin);
  const toY   = (v: number) =>
    CHART_H - DOT_R - ((Math.min(rangeMax, Math.max(rangeMin, v)) - rangeMin) / span) * (CHART_H - DOT_R * 2);
  const toX   = (i: number) =>
    data.length === 1 ? CHART_W / 2 : (i / (data.length - 1)) * (CHART_W - DOT_R * 2) + DOT_R;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value), value: d.value, ts: d.timestamp }));

  return (
    <View style={{ height: CHART_H, position: 'relative' }}>
      {/* Horizontal reference lines */}
      {zones.map((z, i) => {
        if (i === 0) return null;
        const y = toY(z.min);
        if (y < 0 || y > CHART_H) return null;
        return (
          <View
            key={z.min}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: y,
              height: 1,
              backgroundColor: z.color + '40',
            }}
          />
        );
      })}

      {/* Connecting lines */}
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const dx   = next.x - p.x;
        const dy   = next.y - p.y;
        const len  = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const mx   = (p.x + next.x) / 2;
        const my   = (p.y + next.y) / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: mx - len / 2,
              top: my - 1,
              width: len,
              height: 2,
              backgroundColor: Colors.accent,
              opacity: 0.6,
              borderRadius: 1,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Dots */}
      {points.map((p, i) => {
        const zone = zones.find((z) => p.value >= z.min && p.value < z.max) ?? zones[zones.length - 1];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x - DOT_R,
              top:  p.y - DOT_R,
              width:  DOT_R * 2,
              height: DOT_R * 2,
              borderRadius: DOT_R,
              backgroundColor: zone.color,
              borderWidth: 2,
              borderColor: '#fff',
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, unit, color }: {
  label: string; value: string; unit: string; color?: string;
}) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.pillLabel}>{label}</Text>
      <Text style={[statStyles.pillValue, color ? { color } : {}]}>{value}</Text>
      <Text style={statStyles.pillUnit}>{unit}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadow.sm,
  },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  pillUnit:  { fontSize: FontSize.xs, color: Colors.textTertiary },
});

// ─── Date tick labels ─────────────────────────────────────────────────────────

function DateTicks({ data }: { data: ChartPoint[] }) {
  if (data.length < 2) return null;
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const first  = data[0];
  const last   = data[data.length - 1];
  const mid    = data.length > 2 ? data[Math.floor(data.length / 2)] : null;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
      <Text style={{ fontSize: 10, color: Colors.textTertiary }}>{fmt(first.timestamp)}</Text>
      {mid && <Text style={{ fontSize: 10, color: Colors.textTertiary }}>{fmt(mid.timestamp)}</Text>}
      <Text style={{ fontSize: 10, color: Colors.textTertiary }}>{fmt(last.timestamp)}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MetricDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const metricId = (id ?? 'heartRate') as MetricId;
  const config = CONFIGS[metricId] ?? CONFIGS.heartRate;

  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeasurements().then((measurements) => {
      const points = measurements
        .map((m: Measurement) => ({
          value: m[metricId] as number,
          timestamp: m.timestamp,
        }))
        .filter((p) => p.value > 0)
        .reverse(); // oldest first for chart
      setData(points);
      setLoading(false);
    });
  }, [metricId]);

  const latest = data.length > 0 ? data[data.length - 1].value : null;
  const avg    = data.length > 0 ? Math.round(data.reduce((s, p) => s + p.value, 0) / data.length) : 0;
  const min    = data.length > 0 ? Math.min(...data.map((p) => p.value)) : 0;
  const max    = data.length > 0 ? Math.max(...data.map((p) => p.value)) : 0;

  const activeZone = latest != null
    ? config.zones.find((z) => latest >= z.min && latest < z.max) ?? config.zones[config.zones.length - 1]
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.title}>{config.label}</Text>
          {activeZone && (
            <View style={[styles.statusBadge, { backgroundColor: activeZone.color + '18', borderColor: activeZone.color + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: activeZone.color }]} />
              <Text style={[styles.statusText, { color: activeZone.color }]}>{activeZone.label}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Current value */}
        {latest != null && (
          <View style={styles.currentCard}>
            <Ionicons name={config.icon} size={20} color={Colors.accent} />
            <Text style={styles.currentLabel}>Latest reading</Text>
            <Text style={styles.currentValue}>{latest}</Text>
            <Text style={styles.currentUnit}>{config.unit}</Text>
          </View>
        )}

        {/* Trend chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Trend · Last {data.length} measurement{data.length !== 1 ? 's' : ''}
          </Text>

          {loading ? (
            <Text style={styles.emptyText}>Loading…</Text>
          ) : data.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="bar-chart-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No data yet — take your first measurement</Text>
            </View>
          ) : (
            <View style={styles.chartCard}>
              <TrendChart
                data={data}
                zones={config.zones}
                rangeMin={config.rangeMin}
                rangeMax={config.rangeMax}
              />
              <DateTicks data={data} />
            </View>
          )}
        </View>

        {/* Stats row */}
        {data.length > 0 && (
          <View style={styles.statsRow}>
            <StatPill label="Avg" value={avg.toString()} unit={config.unit} />
            <StatPill label="Min" value={min.toString()} unit={config.unit} />
            <StatPill label="Max" value={max.toString()} unit={config.unit} />
          </View>
        )}

        {/* Bell curve gauge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Population reference</Text>
          <View style={styles.gaugeCard}>
            <BellCurveGauge
              value={latest ?? 0}
              hasData={latest != null}
              rangeMin={config.rangeMin}
              rangeMax={config.rangeMax}
              peakAt={config.peakAt}
              sigma={config.sigma}
              zones={config.zones}
              edgeLabels={config.edgeLabels}
            />
          </View>
        </View>

        {/* Reading history log */}
        {data.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reading history</Text>
            <View style={styles.historyCard}>
              {[...data].reverse().slice(0, 30).map((point, i, arr) => {
                const zone = config.zones.find((z) => point.value >= z.min && point.value < z.max)
                  ?? config.zones[config.zones.length - 1];
                const d = new Date(point.timestamp);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <View
                    key={i}
                    style={[styles.historyRow, i < arr.length - 1 && styles.historyRowBorder]}
                  >
                    <View style={styles.historyDateCol}>
                      <Text style={styles.historyDate}>{dateStr}</Text>
                      <Text style={styles.historyTime}>{timeStr}</Text>
                    </View>
                    <Text style={styles.historyValue}>{point.value}</Text>
                    <Text style={styles.historyUnit}>{config.unit}</Text>
                    <View style={[styles.historyZone, { backgroundColor: zone.color + '1A', borderColor: zone.color + '50' }]}>
                      <View style={[styles.historyZoneDot, { backgroundColor: zone.color }]} />
                      <Text style={[styles.historyZoneText, { color: zone.color }]}>{zone.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this metric</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{config.description}</Text>
            <Text style={styles.disclaimer}>
              This app is a wellness tool, not a medical device. Consult a healthcare professional for medical advice.
            </Text>
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },

  // Current value
  currentCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  currentLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  currentValue: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', marginLeft: 'auto' },
  currentUnit:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },

  // Sections
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  // Chart
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Gauge
  gaugeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },

  // History list
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyDateCol: { flex: 1 },
  historyDate: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text },
  historyTime: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
  historyValue: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, minWidth: 36, textAlign: 'right' },
  historyUnit:  { fontSize: FontSize.xs, color: Colors.textTertiary, width: 28 },
  historyZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyZoneDot: { width: 5, height: 5, borderRadius: 3 },
  historyZoneText: { fontSize: 10, fontWeight: '700' },

  // Description
  descCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  descText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
});
