/**
 * Heart Age screen.
 * Estimates a "cardiovascular age" from the user's chronological age,
 * resting heart rate, and HRV — purely indicative, not a medical diagnostic.
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
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { getProfile, getMeasurements } from '@/lib/storage';

// ─── Heart Age calculation ────────────────────────────────────────────────────

function estimateHeartAge(
  chronologicalAge: number,
  avgHR: number,
  avgHRV: number,
): { heartAge: number; factors: { label: string; delta: number; explanation: string }[] } {
  const factors: { label: string; delta: number; explanation: string }[] = [];
  let delta = 0;

  // Heart rate contribution
  if (avgHR < 60) {
    const d = -3;
    delta += d;
    factors.push({ label: 'Resting HR', delta: d, explanation: `${Math.round(avgHR)} bpm — athletic range` });
  } else if (avgHR <= 80) {
    factors.push({ label: 'Resting HR', delta: 0, explanation: `${Math.round(avgHR)} bpm — healthy range` });
  } else if (avgHR <= 100) {
    const d = +4;
    delta += d;
    factors.push({ label: 'Resting HR', delta: d, explanation: `${Math.round(avgHR)} bpm — elevated` });
  } else {
    const d = +8;
    delta += d;
    factors.push({ label: 'Resting HR', delta: d, explanation: `${Math.round(avgHR)} bpm — high` });
  }

  // HRV contribution
  if (avgHRV >= 50) {
    const d = -3;
    delta += d;
    factors.push({ label: 'HRV (RMSSD)', delta: d, explanation: `${Math.round(avgHRV)} ms — excellent` });
  } else if (avgHRV >= 30) {
    factors.push({ label: 'HRV (RMSSD)', delta: 0, explanation: `${Math.round(avgHRV)} ms — normal` });
  } else if (avgHRV >= 20) {
    const d = +3;
    delta += d;
    factors.push({ label: 'HRV (RMSSD)', delta: d, explanation: `${Math.round(avgHRV)} ms — below normal` });
  } else {
    const d = +5;
    delta += d;
    factors.push({ label: 'HRV (RMSSD)', delta: d, explanation: `${Math.round(avgHRV)} ms — low` });
  }

  return { heartAge: Math.max(18, chronologicalAge + delta), factors };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HeartAgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [age, setAge]           = useState<number | null>(null);
  const [heartAge, setHeartAge] = useState<number | null>(null);
  const [factors, setFactors]   = useState<{ label: string; delta: number; explanation: string }[]>([]);
  const [avgHR, setAvgHR]       = useState<number | null>(null);
  const [avgHRV, setAvgHRV]     = useState<number | null>(null);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getMeasurements()]).then(([profile, measurements]) => {
      // Chronological age
      let chrono: number | null = null;
      if (profile?.dateOfBirth) {
        const msAge = Date.now() - profile.dateOfBirth;
        chrono = Math.floor(msAge / (1000 * 60 * 60 * 24 * 365.25));
      }
      setAge(chrono);

      // Averages — last 20 readings
      const recent = measurements.slice(0, 20);
      const hrVals  = recent.map((m) => m.heartRate).filter((v) => v > 0);
      const hrvVals = recent.map((m) => m.hrv).filter((v) => v > 0);

      const aHR  = hrVals.length  ? hrVals.reduce((s, v)  => s + v, 0)  / hrVals.length  : null;
      const aHRV = hrvVals.length ? hrvVals.reduce((s, v) => s + v, 0) / hrvVals.length : null;

      setAvgHR(aHR);
      setAvgHRV(aHRV);

      if (chrono && aHR && aHRV) {
        const result = estimateHeartAge(chrono, aHR, aHRV);
        setHeartAge(result.heartAge);
        setFactors(result.factors);
      }

      setReady(true);
    });
  }, []);

  const missingProfile = ready && age === null;
  const missingData    = ready && age !== null && (avgHR === null || avgHRV === null);
  const diff           = heartAge !== null && age !== null ? heartAge - age : null;

  const diffLabel  = diff === null ? '' : diff === 0 ? 'Same as your age' : diff > 0 ? `${diff} years older` : `${Math.abs(diff)} years younger`;
  const diffColor  = diff === null ? Colors.text : diff <= -2 ? Colors.normal : diff <= 2 ? Colors.elevated : Colors.high;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Heart Age</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Result card */}
        <View style={styles.resultCard}>
          <Ionicons name="heart" size={32} color={heartAge !== null ? diffColor : Colors.textTertiary} />
          <Text style={styles.resultLabel}>Estimated Heart Age</Text>

          {heartAge !== null ? (
            <>
              <Text style={[styles.resultValue, { color: diffColor }]}>{heartAge}</Text>
              <Text style={styles.resultUnit}>years</Text>
              <View style={[styles.diffBadge, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel} · Chronological age: {age}</Text>
              </View>
            </>
          ) : missingProfile ? (
            <View style={styles.missingBox}>
              <Text style={styles.missingText}>Set your birth year in Personal Information to calculate Heart Age.</Text>
              <TouchableOpacity
                style={styles.setUpBtn}
                onPress={() => router.push('/profile/personal-info')}
              >
                <Text style={styles.setUpBtnText}>Go to Personal Information</Text>
              </TouchableOpacity>
            </View>
          ) : missingData ? (
            <View style={styles.missingBox}>
              <Text style={styles.missingText}>Take at least one precise measurement (for HRV data) to calculate your Heart Age.</Text>
            </View>
          ) : (
            <Text style={styles.missingText}>Loading…</Text>
          )}
        </View>

        {/* Factor breakdown */}
        {factors.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>What influenced this estimate</Text>
            <View style={styles.factorsCard}>
              {factors.map((f, i) => (
                <View key={f.label} style={[styles.factorRow, i < factors.length - 1 && styles.factorRowBorder]}>
                  <View style={styles.factorLeft}>
                    <Text style={styles.factorName}>{f.label}</Text>
                    <Text style={styles.factorExplanation}>{f.explanation}</Text>
                  </View>
                  <Text style={[
                    styles.factorDelta,
                    { color: f.delta < 0 ? Colors.normal : f.delta > 0 ? Colors.high : Colors.textSecondary },
                  ]}>
                    {f.delta === 0 ? '±0' : f.delta > 0 ? `+${f.delta}` : `${f.delta}`} yrs
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textTertiary} />
          <Text style={styles.disclaimerText}>
            Heart Age is a simplified wellness estimate based on resting HR and HRV. It is not a medical diagnostic tool. Consult your doctor for a clinical cardiovascular assessment.
          </Text>
        </View>

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
  title: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },

  scroll: { paddingHorizontal: Spacing.md },

  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  resultLabel: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  resultValue: { fontSize: 72, fontWeight: '800', lineHeight: 78 },
  resultUnit:  { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: -8 },
  diffBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  diffText: { fontSize: FontSize.xs, fontWeight: '700' },

  missingBox: { gap: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm },
  missingText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  setUpBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  setUpBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },

  factorsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  factorRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  factorRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  factorLeft: { flex: 1, gap: 2 },
  factorName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  factorExplanation: { fontSize: FontSize.xs, color: Colors.textTertiary },
  factorDelta: { fontSize: FontSize.sm, fontWeight: '700', minWidth: 52, textAlign: 'right' },

  disclaimerCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 17 },
});
