/**
 * Personal Information screen.
 * Saves name, date of birth, biological sex, height, weight to AsyncStorage.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getProfile, saveProfile } from '@/lib/storage';
import type { UserProfile } from '@/types/health';

type Sex = 'male' | 'female' | 'other';

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.inputRow}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          returnKeyType="done"
        />
        {suffix && <Text style={fieldStyles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  suffix: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
});

// ─── Sex selector ─────────────────────────────────────────────────────────────

function SexSelector({ value, onChange }: { value: Sex | null; onChange: (s: Sex) => void }) {
  const options: { key: Sex; label: string }[] = [
    { key: 'male',   label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'other',  label: 'Other' },
  ];
  return (
    <View style={sexStyles.wrap}>
      <Text style={sexStyles.label}>Biological Sex</Text>
      <View style={sexStyles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[sexStyles.btn, value === opt.key && sexStyles.btnActive]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[sexStyles.btnText, value === opt.key && sexStyles.btnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const sexStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  btnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnTextActive: { color: '#fff' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName]         = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [sex, setSex]           = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [saving, setSaving]     = useState(false);

  // Load existing profile on mount
  useEffect(() => {
    getProfile().then((p) => {
      if (!p) return;
      if (p.name)       setName(p.name);
      if (p.dateOfBirth) {
        const year = new Date(p.dateOfBirth).getFullYear();
        setBirthYear(String(year));
      }
      if (p.biologicalSex) setSex(p.biologicalSex as Sex);
      if (p.heightCm)   setHeightCm(String(p.heightCm));
      if (p.weightKg)   setWeightKg(String(p.weightKg));
    });
  }, []);

  const handleSave = async () => {
    // Validate birth year
    const yearNum = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    if (birthYear && (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear)) {
      Alert.alert('Invalid birth year', `Please enter a year between 1900 and ${currentYear}.`);
      return;
    }

    setSaving(true);
    try {
      const profile: UserProfile = {
        name: name.trim() || undefined,
        dateOfBirth: birthYear ? new Date(yearNum, 0, 1).getTime() : undefined,
        biologicalSex: sex ?? undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
      };
      await saveProfile(profile);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Information</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveLink, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            <View style={styles.divider} />
            <Field
              label="Birth Year"
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder={String(new Date().getFullYear() - 30)}
              keyboardType="numeric"
            />
            <View style={styles.divider} />
            <SexSelector value={sex} onChange={setSex} />
          </View>

          <Text style={styles.sectionLabel}>Body Measurements (optional)</Text>
          <View style={styles.card}>
            <Field
              label="Height"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="170"
              keyboardType="numeric"
              suffix="cm"
            />
            <View style={styles.divider} />
            <Field
              label="Weight"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="70"
              keyboardType="numeric"
              suffix="kg"
            />
          </View>

          <Text style={styles.disclaimer}>
            This data is stored only on your device and is never shared. Your birth year and sex help calculate your Heart Age estimate.
          </Text>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  title: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  saveLink: { fontSize: FontSize.base, color: Colors.accent, fontWeight: '700' },

  scroll: { paddingHorizontal: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 17,
    marginTop: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
});
