/**
 * Chronic Stress Index screen.
 * Shows average stress index over 7- and 30-day windows,
 * and a simple trend bar chart of daily averages.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getMeasurements } from '@/lib/storage';
import type { Measurement } from '@/types/health';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stressColor(val: number): string {
  if (val < 30) return Colors.normal;
  if (val < 50) return Colors.elevated;
  return Colors.high;
}

function stressLabel(val: number): string {
  if (val < 30) return 'Low';
  if (val < 50) return 'Moderate';
  if (val < 70) return 'High';
  return 'Very High';
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupByDay(measurements: Measurement[]): { day: string; avg: number; ts: number }[] {
  const map = new Map<string, { sum: number; count: number; ts: number }>();
  for (const m of measurements) {
    if (m.stressIndex <= 0) continue;
    const key = dayKey(m.timestamp);
    const existing = map.get(key) ?? { sum: 0, count: 0, ts: m.timestamp };
    map.set(key, {
      sum:   existing.sum + m.stressIndex,
      count: existing.count + 1,
      ts:    existing.ts,
    });
  }
  return Array.from(map.entries())
    .map(([day, { sum, count, ts }]) => ({ day, avg: sum / count, ts }))
    .sort((a, b) => a.ts - b.ts);
}

const CHART_W = Dimensions.get('window').width - Spacing.md * 2 - Spacing.md * 2;
const BAR_MAX_H = 100;

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, count }: { label: string; value: number | null; count: number }) {
  const color = value !== null ? stressColor(value) : Colors.textTertiary;
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      {value !== null ? (
        <>
          <Text style={[statStyles.value, { color }]}>{Math.round(value)}</Text>
          <View style={[statStyles.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
            <Text style={[statStyles.badgeText, { color }]}>{stressLabel(value)}</Text>
          </View>
        </>
      ) : (
        <Text style={statStyles.empty}>No data</Text>
      )}
      <Text style={statStyles.countLabel}>{count} measurement{count !== 1 ? 's' : ''}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  label: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: 44, fontWeight: '800', lineHeight: 50 },
  badge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  empty: { fontSize: FontSize.base, color: Colors.textTertiary, marginVertical: Spacing.sm },
  countLabel: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChronicStressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dailyData, setDailyData] = useState<{ day: string; avg: number; ts: number }[]>([]);
  const [avg7,  setAvg7]          = useState<number | null>(null);
  const [avg30, setAvg30]         = useState<number | null>(null);
  const [count7,  setCount7]      = useState(0);
  const [count30, setCount30]     = useState(0);
  const [ready, setReady]         = useState(false);

  useEffect(() => {
    getMeasurements().then((measurements) => {
      const now = Date.now();
      const ms7  = 7  * 24 * 60 * 60 * 1000;
      const ms30 = 30 * 24 * 60 * 60 * 1000;

      const in7  = measurements.filter((m) => m.stressIndex > 0 && now - m.timestamp <= ms7);
      const in30 = measurements.filter((m) => m.stressIndex > 0 && now - m.timestamp <= ms30);

      const calc = (arr: Measurement[]) =>
        arr.length ? arr.reduce((s, m) => s + m.stressIndex, 0) / arr.length : null;

      setAvg7(calc(in7));
      setAvg30(calc(in30));
      setCount7(in7.length);
      setCount30(in30.length);
      setDailyData(groupByDay(in30));
      setReady(true);
    });
  }, []);

  const maxAvg = dailyData.length ? Math.max(...dailyData.map((d) => d.avg), 1) : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Chronic Stress Index</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard label="7-day avg"  value={avg7}  count={count7} />
          <StatCard label="30-day avg" value={avg30} count={count30} />
        </View>

        {/* Trend chart */}
        {dailyData.length > 1 ? (
          <>
            <Text style={styles.sectionLabel}>Daily average · Last 30 days</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartArea}>
                {/* Zone reference lines */}
                {[30, 50, 70].map((thresh) => {
                  const y = BAR_MAX_H - (thresh / 100) * BAR_MAX_H;
                  return (
                    <View
                      key={thresh}
                      style={[styles.refLine, { top: y }]}
                    />
                  );
                })}

                {/* Bars */}
                <View style={styles.barsRow}>
                  {dailyData.slice(-14).map((d, i) => {
                    const barH = Math.max(4, (d.avg / Math.max(maxAvg, 100)) * BAR_MAX_H);
                    return (
                      <View key={d.day} style={styles.barWrap}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barH,
                              backgroundColor: stressColor(d.avg),
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* X-axis labels */}
              <View style={styles.xLabels}>
                {dailyData.slice(-14).map((d, i) => {
                  const isFirst = i === 0;
                  const isLast  = i === Math.min(dailyData.length, 14) - 1;
                  if (!isFirst && !isLast && i !== Math.floor(Math.min(dailyData.length, 14) / 2)) return <View key={d.day} style={{ flex: 1 }} />;
                  return (
                    <Text key={d.day} style={styles.xLabel}>
                      {new Date(d.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  );
                })}
              </View>
            </View>
          </>
        ) : ready && dailyData.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="trending-up-outline" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No stress data yet</Text>
            <Text style={styles.emptyText}>
              Take measurements in Precise mode to record your Stress Index. The 30-day trend will appear here.
            </Text>
          </View>
        ) : null}

        {/* Zones legend */}
        <Text style={styles.sectionLabel}>Reference zones</Text>
        <View style={styles.legendCard}>
          {[
            { label: 'Low',       range: '0–29',   color: Colors.normal },
            { label: 'Moderate',  range: '30–49',  color: Colors.elevated },
            { label: 'High',      range: '50–69',  color: Colors.high },
            { label: 'Very High', range: '70–100', color: Colors.high },
          ].map((z, i, arr) => (
            <View key={z.label} style={[styles.legendRow, i < arr.length - 1 && styles.legendRowBorder]}>
              <View style={[styles.legendDot, { backgroundColor: z.color }]} />
              <Text style={styles.legendLabel}>{z.label}</Text>
              <Text style={styles.legendRange}>{z.range}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textTertiary} />
          <Text style={styles.disclaimerText}>
            The Stress Index is derived from HRV and reflects autonomic nervous system load. High scores indicate physiological stress — not necessarily emotional stress. This is a wellness metric, not a clinical diagnostic.
          </Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  title: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },

  scroll: { paddingHorizontal: Spacing.md },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },

  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },

  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  chartArea: {
    height: BAR_MAX_H,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  refLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_H,
    gap: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX_H },
  bar: { width: '100%', borderRadius: 3 },

  xLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  xLabel:  { fontSize: 9, color: Colors.textTertiary },

  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textSecondary },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },

  legendCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  legendRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  legendRange: { fontSize: FontSize.xs, color: Colors.textTertiary },

  disclaimerCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 17 },
});
