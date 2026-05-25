import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  accent,
}: {
  icon: IoniconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIconWrap, accent && styles.rowIconWrapAccent]}>
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
  if (!profile || !profile.name) return { name: 'Set up your profile', sub: 'Age & sex help calculate Heart Age' };
  let sub = '';
  if (profile.dateOfBirth) {
    const age = Math.floor((Date.now() - profile.dateOfBirth) / (1000 * 60 * 60 * 24 * 365.25));
    sub += `${age} yrs`;
  }
  if (profile.biologicalSex) {
    const sexLabel = profile.biologicalSex === 'male' ? 'Male' : profile.biologicalSex === 'female' ? 'Female' : 'Other';
    sub += (sub ? ' · ' : '') + sexLabel;
  }
  return { name: profile.name, sub: sub || 'Profile set up' };
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile);
    }, []),
  );

  const { name, sub } = profileSummary(profile);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Account & manual logs</Text>
        </View>

        {/* Avatar / profile summary */}
        <TouchableOpacity
          style={styles.avatarBlock}
          onPress={() => router.push('/profile/personal-info')}
          activeOpacity={0.82}
        >
          <View style={styles.avatar}>
            {profile?.name ? (
              <Text style={styles.avatarInitial}>
                {profile.name.trim().charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={36} color={Colors.textTertiary} />
            )}
          </View>
          <View style={styles.avatarText}>
            <Text style={styles.avatarName}>{name}</Text>
            <Text style={styles.avatarSub}>{sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Manual logs section */}
        <Text style={styles.sectionLabel}>Manual Logs</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="water-outline"
            label="Log Blood Pressure"
            subtitle="Enter a cuff reading"
            onPress={() => router.push('/log/blood-pressure')}
          />
          <SettingsRow
            icon="pulse-outline"
            label="Log Blood Oxygen (SpO₂)"
            subtitle="Enter an oximeter reading"
            onPress={() => router.push('/log/blood-oxygen')}
          />
        </View>

        {/* Analysis section */}
        <Text style={styles.sectionLabel}>Analysis</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="heart-outline"
            label="Heart Age"
            subtitle="Estimated from HR & HRV"
            onPress={() => router.push('/profile/heart-age')}
          />
          <SettingsRow
            icon="trending-up-outline"
            label="Chronic Stress Index"
            subtitle="30-day stress trend"
            onPress={() => router.push('/profile/chronic-stress')}
          />
        </View>

        {/* Settings section */}
        <Text style={styles.sectionLabel}>Settings</Text>
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

        <Text style={styles.disclaimer}>
          This app is not a medical device and is not intended for diagnosis or treatment
          of any medical condition. Always consult a healthcare professional.
        </Text>

        <View style={{ height: Spacing.xxl + 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  header: {
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

  // Avatar block
  avatarBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarInitial: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.accent,
  },
  avatarText: { flex: 1, gap: 2 },
  avatarName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  avatarSub:  { fontSize: FontSize.xs, color: Colors.textTertiary },

  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconWrapAccent: {
    backgroundColor: Colors.accent,
  },
  rowTextWrap: { flex: 1, gap: 1 },
  rowLabel: { fontSize: FontSize.base, color: Colors.text, fontWeight: '500' },
  rowSub:   { fontSize: FontSize.xs, color: Colors.textTertiary },

  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
});
