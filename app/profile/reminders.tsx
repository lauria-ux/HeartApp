/**
 * Reminders screen — lets the user configure a daily measurement reminder.
 * Preference is saved to the user profile in AsyncStorage.
 * (Actual notification scheduling requires expo-notifications to be set up.)
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import DrumPicker from '@/components/DrumPicker';

const REMINDER_KEY = 'hh:reminder_prefs';

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_PREFS: ReminderPrefs = { enabled: false, hour: 8, minute: 0 };

function formatHour(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}

function formatMinute(m: number): string {
  return m.toString().padStart(2, '0');
}

export default function RemindersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(REMINDER_KEY).then((raw) => {
      if (raw) setPrefs(JSON.parse(raw));
    });
  }, []);

  const update = (patch: Partial<ReminderPrefs>) =>
    setPrefs((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(prefs));
      if (prefs.enabled) {
        Alert.alert(
          'Reminder saved',
          `You'll be reminded to measure at ${formatHour(prefs.hour)}:${formatMinute(prefs.minute)} each day.\n\nNote: Push notifications require the app to be set up for your device. Make sure notifications are allowed in iOS Settings.`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        router.back();
      }
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveLink, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toggle card */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications-outline" size={18} color={Colors.accent} />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Daily measurement reminder</Text>
              <Text style={styles.toggleSub}>Reminds you to take a reading each day</Text>
            </View>
          </View>
          <Switch
            value={prefs.enabled}
            onValueChange={(v) => update({ enabled: v })}
            trackColor={{ false: Colors.border, true: Colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Time picker — only visible when enabled */}
      {prefs.enabled && (
        <>
          <Text style={styles.sectionLabel}>Reminder time</Text>
          <View style={styles.card}>
            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerColLabel}>Hour</Text>
                <DrumPicker
                  values={HOURS}
                  selectedValue={prefs.hour}
                  onChange={(h) => update({ hour: h })}
                  renderValue={formatHour}
                  width={130}
                />
              </View>

              <View style={styles.colon}>
                <Text style={styles.colonText}>:</Text>
              </View>

              <View style={styles.pickerCol}>
                <Text style={styles.pickerColLabel}>Minute</Text>
                <DrumPicker
                  values={MINUTES}
                  selectedValue={prefs.minute}
                  onChange={(m) => update({ minute: m })}
                  renderValue={formatMinute}
                  width={100}
                />
              </View>
            </View>

            <View style={styles.previewRow}>
              <Ionicons name="time-outline" size={15} color={Colors.accent} />
              <Text style={styles.previewText}>
                Daily reminder at {formatHour(prefs.hour)}:{formatMinute(prefs.minute)}
              </Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.disclaimer}>
        Reminder notifications require permission in your device settings.
        Go to Settings → Cardia → Notifications to enable them.
      </Text>
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
    marginBottom: Spacing.lg,
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

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  toggleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  toggleSub:   { fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 16 },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: 0,
  },
  pickerCol: { alignItems: 'center', gap: Spacing.sm },
  pickerColLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  colon: { width: 24, alignItems: 'center', paddingBottom: 8 },
  colonText: { fontSize: 32, color: Colors.textTertiary, fontWeight: '300' },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.accentDim,
  },
  previewText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
  },

  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 17,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

