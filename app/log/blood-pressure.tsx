import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getBPStatus } from '@/types/health';
import { saveBPLog } from '@/lib/storage';
import DrumPicker from '@/components/DrumPicker';

// ─── Constants ────────────────────────────────────────────────────────────────

const SYS_MIN = 60;
const SYS_MAX = 250;
const DIA_MIN = 40;
const DIA_MAX = 180;

const SYS_VALUES = Array.from({ length: SYS_MAX - SYS_MIN + 1 }, (_, i) => SYS_MIN + i);
const DIA_VALUES = Array.from({ length: DIA_MAX - DIA_MIN + 1 }, (_, i) => DIA_MIN + i);

const STATUS_CONFIG = {
  low:      { label: 'Low',      color: Colors.low },
  normal:   { label: 'Normal',   color: Colors.normal },
  elevated: { label: 'Elevated', color: Colors.elevated },
  high:     { label: 'High',     color: Colors.high },
} as const;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LogBloodPressureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [systolic, setSystolic]   = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [saving, setSaving]       = useState(false);

  const status = getBPStatus(systolic, diastolic);
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[status];

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBPLog({
        id: `bp-${Date.now()}`,
        timestamp: Date.now(),
        systolic,
        diastolic,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save the log. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Blood Pressure</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Instruction */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
        <Text style={styles.infoText}>
          Enter your reading from a blood pressure cuff. Scroll each column to set the value.
        </Text>
      </View>

      {/* Picker area */}
      <View style={styles.pickerSection}>
        {/* Labels */}
        <View style={styles.pickerLabels}>
          <Text style={styles.pickerLabel}>SYSTOLIC</Text>
          <Text style={styles.pickerSep}> </Text>
          <Text style={styles.pickerLabel}>DIASTOLIC</Text>
        </View>

        {/* Drums */}
        <View style={styles.pickerRow}>
          <DrumPicker
            values={SYS_VALUES}
            selectedValue={systolic}
            onChange={setSystolic}
            width={130}
          />

          <View style={styles.slashWrap}>
            <Text style={styles.slash}>/</Text>
            <Text style={styles.slashUnit}>mmHg</Text>
          </View>

          <DrumPicker
            values={DIA_VALUES}
            selectedValue={diastolic}
            onChange={setDiastolic}
            width={130}
          />
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { borderColor: statusColor + '60', backgroundColor: statusColor + '12' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Reference table */}
        <View style={styles.refCard}>
          {[
            { label: 'Normal',       range: '< 120 / < 80',    color: Colors.normal },
            { label: 'Elevated',     range: '120–129 / < 80',  color: Colors.elevated },
            { label: 'High (HT1)',   range: '130–139 / 80–89', color: Colors.high },
            { label: 'High (HT2)',   range: '≥ 140 / ≥ 90',    color: Colors.high },
          ].map((row) => (
            <View key={row.label} style={styles.refRow}>
              <View style={[styles.refDot, { backgroundColor: row.color }]} />
              <Text style={styles.refLabel}>{row.label}</Text>
              <Text style={styles.refRange}>{row.range}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        <Ionicons name="checkmark-circle" size={18} color="#fff" />
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Log Blood Pressure'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    marginBottom: Spacing.md,
  },
  cancelBtn: { paddingVertical: 4, paddingRight: Spacing.sm },
  cancelText: { fontSize: FontSize.base, color: Colors.textSecondary },
  title: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  headerSpacer: { width: 60 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  pickerSection: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.lg,
  },

  pickerLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  pickerLabel: {
    width: 130,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerSep: { width: 48 },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  slashWrap: {
    width: 48,
    alignItems: 'center',
    gap: 4,
  },
  slash: {
    fontSize: 40,
    fontWeight: '200',
    color: Colors.textTertiary,
    lineHeight: 46,
  },
  slashUnit: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: '600',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.base, fontWeight: '700' },

  refCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  refDot:   { width: 8, height: 8, borderRadius: 4 },
  refLabel: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  refRange: { fontSize: FontSize.xs, color: Colors.textTertiary },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
