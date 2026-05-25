import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import {
  getMeasurements,
  deleteMeasurement,
} from '@/lib/storage';
import {
  CONTEXT_TAG_LABELS,
  getHRStatus,
  getHRVStatus,
  getStressStatus,
  type Measurement,
} from '@/types/health';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  low: Colors.low,
  normal: Colors.normal,
  elevated: Colors.elevated,
  high: Colors.high,
} as const;

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Group measurements by calendar day label */
function groupByDay(
  measurements: Measurement[],
): { day: string; items: Measurement[] }[] {
  const groups: { day: string; items: Measurement[] }[] = [];
  for (const m of measurements) {
    const day = formatDate(m.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.items.push(m);
    } else {
      groups.push({ day, items: [m] });
    }
  }
  return groups;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricChip({
  label,
  value,
  unit,
  statusColor,
}: {
  label: string;
  value: string;
  unit: string;
  statusColor?: string;
}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
      <View style={styles.chipBottom}>
        {statusColor && <View style={[styles.chipDot, { backgroundColor: statusColor }]} />}
        <Text style={styles.chipUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function MeasurementCard({
  item,
  onDelete,
}: {
  item: Measurement;
  onDelete: (id: string) => void;
}) {
  const hrColor = STATUS_COLORS[getHRStatus(item.heartRate)];
  const hasHRV = item.hrv > 0;
  const hrvColor = hasHRV ? STATUS_COLORS[getHRVStatus(item.hrv)] : undefined;
  const stressColor = hasHRV ? STATUS_COLORS[getStressStatus(item.stressIndex)] : undefined;

  const handleDelete = () => {
    Alert.alert(
      'Delete Measurement',
      'Remove this entry from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Row 1: time + mode + delete */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              {item.mode === 'precise' ? 'Precise' : 'Quick'}
            </Text>
          </View>
          {item.contextTag && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>
                {CONTEXT_TAG_LABELS[item.contextTag]}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Row 2: metrics */}
      <View style={styles.metricsRow}>
        <MetricChip
          label="HR"
          value={item.heartRate.toString()}
          unit="bpm"
          statusColor={hrColor}
        />
        <View style={styles.divider} />
        <MetricChip
          label="HRV"
          value={hasHRV ? item.hrv.toString() : '—'}
          unit="ms"
          statusColor={hrvColor}
        />
        <View style={styles.divider} />
        <MetricChip
          label="Stress"
          value={hasHRV ? item.stressIndex.toString() : '—'}
          unit="/100"
          statusColor={stressColor}
        />
        <View style={styles.divider} />
        <MetricChip
          label="Score"
          value={item.healthIndex.toFixed(1)}
          unit="/10"
        />
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type ListItem =
  | { type: 'header'; day: string }
  | { type: 'measurement'; data: Measurement };

export default function HistoryScreen() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getMeasurements();
    setMeasurements(data);
  }, []);

  // Reload every time this tab comes into focus (after saving a measurement)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMeasurement(id);
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  // Flatten into header + item rows for FlatList
  const listData: ListItem[] = groupByDay(measurements).flatMap((group) => [
    { type: 'header' as const, day: group.day },
    ...group.items.map((data) => ({ type: 'measurement' as const, data })),
  ]);

  if (measurements.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your measurement log</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={36} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No measurements yet</Text>
          <Text style={styles.emptyText}>
            Take your first measurement from the Home tab.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          {measurements.length} measurement{measurements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === 'header' ? `h-${item.day}` : `m-${item.data.id}-${i}`
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.dayHeader}>{item.day}</Text>;
          }
          return (
            <MeasurementCard item={item.data} onDelete={handleDelete} />
          );
        }}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  pageHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Day header
  dayHeader: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  cardTime: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  modeBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  modeBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  tagBadge: {
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  chipLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  chipBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipUnit: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },

  // List
  list: {
    paddingBottom: Spacing.xxl,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
