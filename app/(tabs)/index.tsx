import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getMeasurements, getProfile } from '@/lib/storage';
import { type Measurement, type UserProfile } from '@/types/health';
import BellCurveGauge, { type Zone } from '@/components/BellCurveGauge';

// ─── Per-metric config ────────────────────────────────────────────────────────

interface MetricConfig {
  id: 'heartRate' | 'hrv' | 'stressIndex';
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  unit: string;
  rangeMin: number;
  rangeMax: number;
  peakAt: number;
  sigma: number;
  zones: Zone[];
  edgeLabels: [string, string, string];
}

const METRICS: MetricConfig[] = [
  {
    id: 'heartRate', icon: 'heart', label: 'Heart Rate', unit: 'BPM',
    rangeMin: 30, rangeMax: 150, peakAt: 72, sigma: 16,
    zones: [
      { min: 0,   max: 50,  color: Colors.low,      label: 'Low' },
      { min: 50,  max: 60,  color: Colors.elevated,  label: 'Low-Normal' },
      { min: 60,  max: 100, color: Colors.normal,    label: 'Normal' },
      { min: 100, max: 120, color: Colors.elevated,  label: 'Elevated' },
      { min: 120, max: 999, color: Colors.high,      label: 'High' },
    ],
    edgeLabels: ['30', '60–100', '150+'],
  },
  {
    id: 'hrv', icon: 'pulse-outline', label: 'HRV (RMSSD)', unit: 'MS',
    rangeMin: 0, rangeMax: 100, peakAt: 55, sigma: 20,
    zones: [
      { min: 0,   max: 20,  color: Colors.high,      label: 'Low (High Stress)' },
      { min: 20,  max: 40,  color: Colors.elevated,  label: 'Moderate' },
      { min: 40,  max: 999, color: Colors.normal,    label: 'Good' },
    ],
    edgeLabels: ['0', '> 40 ms', '100+'],
  },
  {
    id: 'stressIndex', icon: 'flash-outline', label: 'Stress Index', unit: '/100',
    rangeMin: 0, rangeMax: 100, peakAt: 18, sigma: 18,
    zones: [
      { min: 0,   max: 30,  color: Colors.normal,    label: 'Low' },
      { min: 30,  max: 50,  color: Colors.elevated,  label: 'Moderate' },
      { min: 50,  max: 70,  color: Colors.high,      label: 'High' },
      { min: 70,  max: 999, color: Colors.high,      label: 'Very High' },
    ],
    edgeLabels: ['0', '< 30', '100'],
  },
];

// ─── Zone colour lookup ───────────────────────────────────────────────────────

function zoneForValue(zones: Zone[], value: number) {
  return zones.find((z) => value >= z.min && value < z.max);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function computeHeartAge(
  measurements: Measurement[],
  profile: UserProfile | null,
): { age: number; chronoAge: number } | null {
  if (!profile?.dateOfBirth) return null;
  const chronoAge = Math.floor((Date.now() - profile.dateOfBirth) / (1000 * 60 * 60 * 24 * 365.25));
  const recent = measurements.slice(0, 20);
  const hrVals  = recent.map((m) => m.heartRate).filter((v) => v > 0);
  const hrvVals = recent.map((m) => m.hrv).filter((v) => v > 0);
  if (!hrVals.length || !hrvVals.length) return null;

  const avgHR  = hrVals.reduce((s, v) => s + v, 0) / hrVals.length;
  const avgHRV = hrvVals.reduce((s, v) => s + v, 0) / hrvVals.length;

  let delta = 0;
  if (avgHR < 60)       delta -= 3;
  else if (avgHR > 100) delta += 8;
  else if (avgHR > 80)  delta += 4;

  if (avgHRV >= 50)     delta -= 3;
  else if (avgHRV < 20) delta += 5;
  else if (avgHRV < 30) delta += 3;

  return { age: Math.max(18, chronoAge + delta), chronoAge };
}

function computeStress7(measurements: Measurement[]): number | null {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const vals = measurements
    .filter((m) => m.timestamp >= cutoff && m.stressIndex > 0)
    .map((m) => m.stressIndex);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

// ─── Health Score card ────────────────────────────────────────────────────────

function HealthScoreCard({ score, hasData }: { score: number; hasData: boolean }) {
  const pct = Math.round(score * 10);
  return (
    <View style={scoreStyles.card}>
      <Text style={scoreStyles.label}>Health Score</Text>
      <View style={scoreStyles.valueRow}>
        <Text style={scoreStyles.value}>{hasData ? pct : '—'}</Text>
        {hasData && <Text style={scoreStyles.max}>/100</Text>}
      </View>
      {!hasData && (
        <Text style={scoreStyles.hint}>Take a measurement to see your score</Text>
      )}
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  label: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  value: { fontSize: 64, fontWeight: '800', color: '#fff', lineHeight: 68 },
  max:   { fontSize: FontSize.xl, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  hint:  { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
});

// ─── Quick-log row ────────────────────────────────────────────────────────────

function QuickLogRow() {
  const router = useRouter();
  return (
    <View style={quickStyles.row}>
      <TouchableOpacity
        style={quickStyles.btn}
        onPress={() => router.push('/log/blood-pressure')}
        activeOpacity={0.82}
      >
        <View style={quickStyles.iconWrap}>
          <Ionicons name="water-outline" size={18} color={Colors.accent} />
        </View>
        <View>
          <Text style={quickStyles.btnLabel}>Blood Pressure</Text>
          <Text style={quickStyles.btnSub}>Log a cuff reading</Text>
        </View>
        <Ionicons name="add-circle-outline" size={18} color={Colors.accent} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <TouchableOpacity
        style={quickStyles.btn}
        onPress={() => router.push('/log/blood-oxygen')}
        activeOpacity={0.82}
      >
        <View style={quickStyles.iconWrap}>
          <Ionicons name="pulse-outline" size={18} color={Colors.accent} />
        </View>
        <View>
          <Text style={quickStyles.btnLabel}>Blood Oxygen</Text>
          <Text style={quickStyles.btnSub}>SpO₂ from oximeter</Text>
        </View>
        <Ionicons name="add-circle-outline" size={18} color={Colors.accent} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
    </View>
  );
}

const quickStyles = StyleSheet.create({
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  btnLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  btnSub:   { fontSize: FontSize.xs, color: Colors.textTertiary },
});

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ config, value, hasData, hasAnyData }: { config: MetricConfig; value: number; hasData: boolean; hasAnyData: boolean }) {
  const router = useRouter();

  const zone      = hasData && value > 0 ? zoneForValue(config.zones, value) : undefined;
  const zoneColor = zone?.color ?? Colors.text;
  const zoneName  = zone?.label ?? '';

  return (
    <TouchableOpacity
      style={metricStyles.card}
      onPress={() => router.push(`/metric/${config.id}`)}
      activeOpacity={0.82}
    >
      <View style={metricStyles.header}>
        <View style={metricStyles.iconWrap}>
          <Ionicons name={config.icon} size={16} color={Colors.accent} />
        </View>
        <Text style={metricStyles.label}>{config.label}</Text>
        <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
      </View>

      <View style={metricStyles.valueRow}>
        {/* Value coloured by zone — matches the WellnessRow pattern */}
        <Text style={[metricStyles.value, hasData && { color: zoneColor }]}>
          {hasData ? value : '—'}
        </Text>
        {hasData && <Text style={[metricStyles.unit, { color: zoneColor }]}> {config.unit}</Text>}
      </View>

      {/* Small zone label — only when there's a reading */}
      {zone && (
        <Text style={[metricStyles.zoneLabel, { color: zoneColor }]}>
          {'● '}{zoneName}
        </Text>
      )}

      <BellCurveGauge
        value={value} hasData={hasData}
        rangeMin={config.rangeMin} rangeMax={config.rangeMax}
        peakAt={config.peakAt} sigma={config.sigma}
        zones={config.zones} edgeLabels={config.edgeLabels}
      />
      {!hasData && (
        <Text style={metricStyles.tapHint}>
          {hasAnyData ? 'No reading today — tap to view history' : "Tap to view history once you've measured"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: 4,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    flex: 1, fontSize: FontSize.sm, fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  value: { fontSize: 40, fontWeight: '700', color: Colors.text, lineHeight: 44 },
  unit:  { fontSize: FontSize.base, fontWeight: '500', color: Colors.textSecondary },
  zoneLabel: {
    fontSize: FontSize.xs, fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  tapHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm },
});

// ─── Wellness row (Heart Age + Chronic Stress) ────────────────────────────────

function WellnessRow({
  heartAgeData,
  stressAvg7,
}: {
  heartAgeData: { age: number; chronoAge: number } | null;
  stressAvg7: number | null;
}) {
  const router = useRouter();

  const haDiff  = heartAgeData ? heartAgeData.age - heartAgeData.chronoAge : null;
  const haColor = haDiff == null ? Colors.textTertiary
    : haDiff <= -1 ? Colors.normal
    : haDiff <= 2  ? Colors.elevated
    : Colors.high;

  const stressColor = stressAvg7 == null ? Colors.textTertiary
    : stressAvg7 < 30 ? Colors.normal
    : stressAvg7 < 50 ? Colors.elevated
    : Colors.high;
  const stressLabel = stressAvg7 == null ? '—'
    : stressAvg7 < 30 ? 'Low'
    : stressAvg7 < 50 ? 'Moderate'
    : 'High';

  return (
    <View style={wellStyles.row}>
      {/* Heart Age */}
      <TouchableOpacity
        style={wellStyles.card}
        onPress={() => router.push('/profile/heart-age')}
        activeOpacity={0.82}
      >
        <View style={wellStyles.cardHeader}>
          <Ionicons name="heart-outline" size={14} color={Colors.accent} />
          <Text style={wellStyles.cardLabel}>Heart Age</Text>
        </View>
        {heartAgeData ? (
          <>
            <Text style={[wellStyles.cardValue, { color: haColor }]}>{heartAgeData.age}</Text>
            <Text style={wellStyles.cardUnit}>years</Text>
            <Text style={[wellStyles.cardDiff, { color: haColor }]}>
              {haDiff === 0 ? '±0 vs your age' : haDiff! > 0 ? `+${haDiff} yrs` : `${haDiff} yrs`}
            </Text>
          </>
        ) : (
          <Text style={wellStyles.cardEmpty}>Set up profile &amp; measure to see</Text>
        )}
      </TouchableOpacity>

      {/* Chronic Stress */}
      <TouchableOpacity
        style={wellStyles.card}
        onPress={() => router.push('/profile/chronic-stress')}
        activeOpacity={0.82}
      >
        <View style={wellStyles.cardHeader}>
          <Ionicons name="trending-up-outline" size={14} color={Colors.accent} />
          <Text style={wellStyles.cardLabel}>Stress Trend</Text>
        </View>
        {stressAvg7 != null ? (
          <>
            <Text style={[wellStyles.cardValue, { color: stressColor }]}>{Math.round(stressAvg7)}</Text>
            <Text style={wellStyles.cardUnit}>/100</Text>
            <Text style={[wellStyles.cardDiff, { color: stressColor }]}>{stressLabel} · 7-day avg</Text>
          </>
        ) : (
          <Text style={wellStyles.cardEmpty}>No data yet</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const wellStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  cardValue: { fontSize: 36, fontWeight: '800', lineHeight: 40 },
  cardUnit:  { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: -2 },
  cardDiff:  { fontSize: FontSize.xs, fontWeight: '600', marginTop: 4 },
  cardEmpty: {
    fontSize: FontSize.xs, color: Colors.textTertiary,
    lineHeight: 16, marginTop: Spacing.sm,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [latest, setLatest]         = useState<Measurement | null>(null);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [heartAgeData, setHeartAge] = useState<{ age: number; chronoAge: number } | null>(null);
  const [stressAvg7, setStress7]    = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getMeasurements(), getProfile()]).then(([measurements, profile]) => {
        const todayMeasurement = measurements.find((m) => isToday(m.timestamp)) ?? null;
        setLatest(todayMeasurement);
        setHasAnyData(measurements.length > 0);
        setHeartAge(computeHeartAge(measurements, profile));
        setStress7(computeStress7(measurements));
      });
    }, []),
  );

  const hasData = latest !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.date}>{formatDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Health Score */}
        <HealthScoreCard score={latest?.healthIndex ?? 0} hasData={hasData} />

        {/* Quick-log row */}
        <Text style={styles.sectionLabel}>Manual Logs</Text>
        <QuickLogRow />

        {/* Metric cards */}
        <Text style={styles.sectionLabel}>Today's Readings</Text>
        {METRICS.map((cfg) => {
          const raw  = hasData ? (latest![cfg.id] as number) : 0;
          const show = hasData && raw > 0;
          return <MetricCard key={cfg.id} config={cfg} value={raw} hasData={show} hasAnyData={hasAnyData} />;
        })}

        {/* Wellness row */}
        <Text style={styles.sectionLabel}>Wellness Insights</Text>
        <WellnessRow heartAgeData={heartAgeData} stressAvg7={stressAvg7} />

        {hasData && (
          <Text style={styles.lastMeasured}>
            Last measured{' '}
            {new Date(latest!.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' · '}
            {latest!.mode === 'precise' ? 'Precise' : 'Quick'} mode
          </Text>
        )}

        <View style={{ height: Spacing.xxl + 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, lineHeight: 36 },
  date: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  gearBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },

  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },

  lastMeasured: {
    fontSize: FontSize.xs, color: Colors.textTertiary,
    textAlign: 'center', marginTop: Spacing.sm,
  },
});
