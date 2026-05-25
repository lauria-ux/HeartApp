/**
 * DrumPicker
 *
 * A native-feeling drum-roll / slot-machine style number picker.
 * Built with FlatList + snapToInterval — no external dependencies.
 *
 * Usage:
 *   <DrumPicker values={range(60, 250)} selectedValue={120} onChange={v => set(v)} />
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H   = 54;   // height of each drum item
const VISIBLE  = 5;    // number of items visible at once (must be odd)
const PADDING  = ITEM_H * Math.floor(VISIBLE / 2); // top/bottom blank space

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrumPickerProps {
  /** The full list of selectable numbers, in order. */
  values: number[];
  /** Currently selected value — must be in the `values` array. */
  selectedValue: number;
  /** Called when the user settles on a new value. */
  onChange: (value: number) => void;
  /** Custom render function for each value. If omitted, renders the raw number. */
  renderValue?: (value: number) => string;
  /** Optional suffix appended after each number (e.g. "%" or " ms"). Ignored when renderValue is provided. */
  suffix?: string;
  /** Width of the picker column. Defaults to 120. */
  width?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrumPicker({
  values,
  selectedValue,
  onChange,
  renderValue,
  suffix = '',
  width = 120,
}: DrumPickerProps) {
  const flatRef = useRef<FlatList>(null);
  const initialIndex = Math.max(0, values.indexOf(selectedValue));
  const [localIndex, setLocalIndex] = useState(initialIndex);

  // Scroll to initial position once the list has rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      flatRef.current?.scrollToOffset({
        offset: initialIndex * ITEM_H,
        animated: false,
      });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollEnd = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      setLocalIndex(clamped);
      onChange(values[clamped]);
    },
    [values, onChange],
  );

  return (
    <View style={[styles.wrapper, { width }]}>
      {/* Center highlight band */}
      <View style={styles.highlight} pointerEvents="none" />

      {/* Top fade */}
      <View style={styles.fadeTop} pointerEvents="none" />
      {/* Bottom fade */}
      <View style={styles.fadeBottom} pointerEvents="none" />

      <FlatList
        ref={flatRef}
        data={values}
        keyExtractor={(v) => String(v)}
        extraData={localIndex}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PADDING }}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        renderItem={({ item, index }) => {
          const isSelected = index === localIndex;
          return (
            <View style={styles.item}>
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {renderValue ? renderValue(item) : `${item}${suffix}`}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    height: ITEM_H * VISIBLE,
    overflow: 'hidden',
    position: 'relative',
  },

  // Highlight strip at the center slot
  highlight: {
    position: 'absolute',
    top: PADDING,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: Colors.accentDim,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.accent + '50',
    zIndex: 1,
  },

  // Solid fade overlays — semi-transparent blocks that dim outer items
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PADDING,
    backgroundColor: Colors.background,
    opacity: 0.72,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PADDING,
    backgroundColor: Colors.background,
    opacity: 0.72,
    zIndex: 2,
  },

  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: FontSize.xl,
    fontWeight: '400',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  itemTextSelected: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
});
