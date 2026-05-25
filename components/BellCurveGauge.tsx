/**
 * BellCurveGauge
 *
 * Renders a population-style bell curve whose bars are coloured by health
 * zone.  A needle marks where the user's reading sits relative to the curve.
 * The shape is a Gaussian centred on the optimal value; zones are coloured
 * independently of the curve height so the user can see at a glance whether
 * their reading is in the green, amber or red region.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Zone {
  min: number;
  max: number;
  color: string;
  label: string;
}

export interface BellCurveGaugeProps {
  /** Current reading.  Ignored when hasData = false. */
  value: number;
  /** Whether a real reading exists. */
  hasData: boolean;
  /** Left edge of the visual range. */
  rangeMin: number;
  /** Right edge of the visual range. */
  rangeMax: number;
  /** Value where the bell curve peaks (centre of optimal range). */
  peakAt: number;
  /** Standard deviation controlling how wide the bell is. */
  sigma: number;
  /** Coloured zone segments, sorted by min ascending. */
  zones: Zone[];
  /** Labels shown at left edge, centre and right edge. */
  edgeLabels: [string, string, string];
}

// ─── Component ───────────────────────────────────────────────────────────────

const BARS      = 40;   // number of vertical bars
const MAX_H     = 52;   // tallest bar height (px)
const MIN_H     = 6;    // shortest bar height (px)
const GAP       = 2;    // gap between bars (px)

export default function BellCurveGauge({
  value,
  hasData,
  rangeMin,
  rangeMax,
  peakAt,
  sigma,
  zones,
  edgeLabels,
}: BellCurveGaugeProps) {

  // ── Build bar descriptors ──
  const bars = Array.from({ length: BARS }, (_, i) => {
    const ratio  = i / (BARS - 1);
    const barVal = rangeMin + ratio * (rangeMax - rangeMin);

    // Gaussian height
    const bell   = Math.exp(-((barVal - peakAt) ** 2) / (2 * sigma ** 2));
    const height = MIN_H + bell * (MAX_H - MIN_H);

    // Zone colour — pick the zone whose range contains barVal
    const zone  = zones.find((z) => barVal >= z.min && barVal < z.max) ?? zones[zones.length - 1];
    const color = zone.color;

    return { height, color };
  });

  // ── Needle position (0–1 of total bar area width) ──
  const needleRatio = hasData
    ? Math.max(0, Math.min(1, (value - rangeMin) / (rangeMax - rangeMin)))
    : null;

  // ── Active zone label ──
  const activeZone = hasData
    ? zones.find((z) => value >= z.min && value < z.max) ?? zones[zones.length - 1]
    : null;

  return (
    <View>
      {/* Bar chart + needle */}
      <View style={styles.chartWrap}>
        {/* Bars */}
        <View style={styles.barsRow}>
          {bars.map((bar, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: bar.height,
                  backgroundColor: bar.color,
                  opacity: hasData ? 1 : 0.25,
                },
              ]}
            />
          ))}
        </View>

        {/* Vertical needle */}
        {needleRatio !== null && (
          <View
            style={[styles.needle, { left: `${needleRatio * 100}%` as any }]}
            pointerEvents="none"
          >
            <View style={styles.needleLine} />
            <View style={styles.needleDot} />
          </View>
        )}
      </View>

      {/* Zone label + edge labels */}
      <View style={styles.labelsRow}>
        <Text style={styles.edgeLabel}>{edgeLabels[0]}</Text>

        {activeZone ? (
          <View style={[styles.zoneChip, { backgroundColor: activeZone.color + '20', borderColor: activeZone.color + '50' }]}>
            <View style={[styles.zoneDot, { backgroundColor: activeZone.color }]} />
            <Text style={[styles.zoneChipText, { color: activeZone.color }]}>
              {activeZone.label}
            </Text>
          </View>
        ) : (
          <Text style={styles.edgeLabel}>{edgeLabels[1]}</Text>
        )}

        <Text style={styles.edgeLabel}>{edgeLabels[2]}</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chartWrap: {
    height: MAX_H + 8,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: GAP,
    height: MAX_H,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
  },

  // Needle
  needle: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    transform: [{ translateX: -6 }],
  },
  needleLine: {
    width: 2,
    height: MAX_H + 6,
    backgroundColor: Colors.text,
    borderRadius: 1,
    opacity: 0.8,
  },
  needleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.text,
    position: 'absolute',
    bottom: -4,
    left: -4,
  },

  // Labels
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  edgeLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    minWidth: 28,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneChipText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
