/**
 * Settings screen — accessible from the gear icon on the home page.
 * Replaces the profile tab for account + app configuration.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getProfile } from '@/lib/storage';
import type { UserProfile } from '@/types/health';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.accent} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

function profileSummary(profile: UserProfile | null): { name: string; sub: string } {
  if (!profile?.name) return { name: 'Not set up', sub: 'Tap to add your details' };
  let sub = '';
  if (profile.dateOfBirth) {
    const age = Math.floor((Date.now() - profile.dateOfBirth) / (1000 * 60 * 60 * 24 * 365.25));
    sub += `${age} yrs`;
  }
  if (profile.biologicalSex) {
    const sexLabel = profile.biologicalSex === 'male' ? 'Male'
      : profile.biologicalSex === 'female' ? 'Female' : 'Other';
    sub += (sub ? ' · ' : '') + sexLabel;
  }
  return { name: profile.name, sub: sub || 'Profile saved' };
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile);
    }, []),
  );

  const { name, sub } = profileSummary(profile);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/profile/personal-info')}
          activeOpacity={0.82}
        >
          <View style={styles.avatar}>
            {profile?.name ? (
              <Text style={styles.avatarInitial}>
                {profile.name.trim().charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person-outline" size={28} color={Colors.textTertiary} />
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileSub}>{sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="person-circle-outline"
            label="Personal Information"
            subtitle="Name, age, sex, body metrics"
            onPress={() => router.push('/profile/personal-info')}
          />
          <SettingsRow
            icon="notifications-outline"
            label="Reminders"
            subtitle="Daily measurement reminders"
            onPress={() => router.push('/profile/reminders')}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Cardia is not a medical device and is not intended for the diagnosis or treatment of any medical condition.
          Always consult a qualified healthcare professional for medical advice.
        </Text>

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
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, textAlign: 'center' },

  scroll: { paddingHorizontal: Spacing.md },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarInitial: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.accent },
  profileText: { flex: 1, gap: 2 },
  profileName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  profileSub:  { fontSize: FontSize.xs, color: Colors.textTertiary },

  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIconWrap: {
    width: 34, height: 34, borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTextWrap: { flex: 1, gap: 1 },
  rowLabel: { fontSize: FontSize.base, color: Colors.text, fontWeight: '500' },
  rowSub:   { fontSize: FontSize.xs, color: Colors.textTertiary },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  infoLabel: { fontSize: FontSize.base, color: Colors.text },
  infoValue: { fontSize: FontSize.sm, color: Colors.textTertiary },

  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: Spacing.sm,
  },
});
