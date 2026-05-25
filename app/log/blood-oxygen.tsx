import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getSpO2Status } from '@/types/health';
import { saveSpO2Log } from '@/lib/storage';
import DrumPicker from '@/components/DrumPicker';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPO2_MIN    = 70;
const SPO2_MAX    = 100;
const SPO2_VALUES = Array.from({ length: SPO2_MAX - SPO2_MIN + 1 }, (_, i) => SPO2_MIN + i);

const STATUS_CONFIG = {
  low:      { label: 'Critical — seek medical advice', color: Colors.high },
  elevated: { label: 'Below normal — consult a doctor',  color: Colors.elevated },
  normal:   { label: 'Normal',                          color: Colors.normal },
  high:     { label: 'Critical — seek medical advice', color: Colors.high },
} as const;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LogBloodOxygenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [spo2, setSpo2]   = useState(98);
  const [saving, setSaving] = useState(false);

  const status = getSpO2Status(spo2);
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[status];

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSpO2Log({
        id: `spo2-${Date.now()}`,
        timestamp: Date.now(),
        spo2,
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
        <Text style={styles.title}>Blood Oxygen  SpO₂</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Instruction */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
        <Text style={styles.infoText}>
          Enter your reading from a pulse oximeter. Camera-based SpO₂ requires an infrared sensor — not available on standard phones.
        </Text>
      </View>

      {/* Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>SpO₂ %</Text>

        <DrumPicker
          values={SPO2_VALUES}
          selectedValue={spo2}
          onChange={setSpo2}
          suffix="%"
          width={160}
        />

        {/* Status badge */}
        <View style={[styles.statusBadge, { borderColor: statusColor + '60', backgroundColor: statusColor + '12' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Reference card */}
        <View style={styles.refCard}>
          {[
            { label: 'Normal',       range: '95–100%', color: Colors.normal },
            { label: 'Below normal', range: '90–94%',  color: Colors.elevated },
            { label: 'Low (hypoxia)',range: '< 90%',   color: Colors.high },
          ].map((row) => (
            <View key={row.label} style={styles.refRow}>
              <View style={[styles.refDot, { backgroundColor: row.color }]} />
              <Text style={styles.refLabel}>{row.label}</Text>
              <Text style={styles.refRange}>{row.range}</Text>
            </View>
          ))}
          <View style={styles.refDisclaimer}>
            <Text style={styles.refDisclaimerText}>
              SpO₂ below 90% requires immediate medical attention. This app is not a medical device.
            </Text>
          </View>
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        <Ionicons name="checkmark-circle" size={18} color="#fff" />
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Log Blood Oxygen'}</Text>
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
  pickerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.sm, fontWeight: '700' },

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
  refDisclaimer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  refDisclaimerText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },

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
