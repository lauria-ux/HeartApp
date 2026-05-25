/**
 * Health self-assessment test screen.
 * Stepped question UI → scored result with tips.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { HEALTH_TESTS, type HealthTest, type TestTier } from '@/lib/tests';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({
  test,
  score,
  maxScore,
  tier,
  onDone,
}: {
  test: HealthTest;
  score: number;
  maxScore: number;
  tier: TestTier;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[resStyles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={resStyles.scroll}
      >
        {/* Hero band */}
        <View style={[resStyles.hero, { backgroundColor: tier.color }]}>
          <View style={resStyles.heroIcon}>
            <Ionicons name={tier.icon as IoniconName} size={40} color="#fff" />
          </View>
          <Text style={resStyles.heroLabel}>{tier.label}</Text>
          <View style={resStyles.scorePill}>
            <Text style={[resStyles.scoreText, { color: tier.color }]}>
              Score {score} / {maxScore}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={resStyles.body}>
          <Text style={resStyles.testName}>{test.title}</Text>
          <Text style={resStyles.description}>{tier.description}</Text>

          {/* Tips */}
          <Text style={resStyles.tipsHeading}>What to focus on</Text>
          {tier.tips.map((tip, i) => (
            <View key={i} style={resStyles.tipRow}>
              <View style={[resStyles.tipDot, { backgroundColor: tier.color }]}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
              <Text style={resStyles.tipText}>{tip}</Text>
            </View>
          ))}

          {/* Disclaimer */}
          <Text style={resStyles.disclaimer}>{test.disclaimer}</Text>
        </View>
      </ScrollView>

      {/* Done button */}
      <View style={[resStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[resStyles.doneBtn, { backgroundColor: tier.color }]}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={resStyles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const resStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xl },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: FontSize.xl, fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  scorePill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 4,
  },
  scoreText: { fontSize: FontSize.sm, fontWeight: '700' },

  body: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  testName: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  description: {
    fontSize: FontSize.base,
    color: Colors.text,
    lineHeight: 24,
  },
  tipsHeading: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 4,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  tipDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 17,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  doneBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: FontSize.base, fontWeight: '700', color: '#fff',
  },
});

// ─── Quiz screen ──────────────────────────────────────────────────────────────

export default function TestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const test = HEALTH_TESTS.find((t) => t.id === id);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [pending, setPending] = useState<number | null>(null);

  // Slide animation between questions
  const slideX = useRef(new Animated.Value(0)).current;
  const fadeA = useRef(new Animated.Value(1)).current;

  if (!test) return null;

  const totalQuestions = test.questions.length;
  const isResult = step >= totalQuestions;
  const totalScore = answers.reduce((s, v) => s + v, 0);
  const maxScore = test.questions.reduce(
    (s, q) => s + Math.max(...q.options.map((o) => o.value)),
    0,
  );
  const tier = test.tiers.find((t) => totalScore <= t.upTo) ?? test.tiers[test.tiers.length - 1];

  const progress = step / totalQuestions;

  const handleNext = () => {
    if (pending === null) return;
    const newAnswers = [...answers, pending];

    // Animate out
    Animated.parallel([
      Animated.timing(slideX, { toValue: -24, duration: 140, useNativeDriver: true }),
      Animated.timing(fadeA, { toValue: 0,   duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setAnswers(newAnswers);
      setPending(null);
      setStep(step + 1);
      slideX.setValue(24);
      // Animate in
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeA, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  if (isResult) {
    return (
      <ResultScreen
        test={test}
        score={totalScore}
        maxScore={maxScore}
        tier={tier}
        onDone={() => router.back()}
      />
    );
  }

  const question = test.questions[step];

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{test.title}</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>{step + 1}/{totalQuestions}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: test.color,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      {/* Question */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateX: slideX }], opacity: fadeA }}>
          {/* Category badge */}
          <View style={[styles.catBadge, { backgroundColor: test.color + '18' }]}>
            <Ionicons name={test.icon as IoniconName} size={14} color={test.color} />
            <Text style={[styles.catBadgeText, { color: test.color }]}>{test.subtitle}</Text>
          </View>

          <Text style={styles.questionText}>{question.text}</Text>

          {/* Options */}
          <View style={styles.options}>
            {question.options.map((opt, i) => {
              const isSelected = pending === opt.value && answers.length === step;

              // Edge case: two options might share the same value — use index to track
              const isSelectedByIndex = pending !== null && question.options[pending] === opt;

              // Use index-based selection to handle duplicate values
              const selectedIdx = pending as number | null;
              const thisSelected = selectedIdx === i;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.option,
                    thisSelected && {
                      borderColor: test.color,
                      backgroundColor: test.color + '10',
                    },
                  ]}
                  onPress={() => setPending(i)}
                  activeOpacity={0.78}
                >
                  <View
                    style={[
                      styles.radio,
                      thisSelected && { borderColor: test.color },
                    ]}
                  >
                    {thisSelected && (
                      <View style={[styles.radioFill, { backgroundColor: test.color }]} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      thisSelected && { color: Colors.text, fontWeight: '600' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Next / Results button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            pending !== null
              ? { backgroundColor: test.color }
              : styles.nextBtnDisabled,
          ]}
          onPress={() => {
            if (pending === null) return;
            const val = question.options[pending].value;
            const newAnswers = [...answers, val];

            Animated.parallel([
              Animated.timing(slideX, { toValue: -24, duration: 140, useNativeDriver: true }),
              Animated.timing(fadeA, { toValue: 0,   duration: 100, useNativeDriver: true }),
            ]).start(() => {
              setAnswers(newAnswers);
              setPending(null);
              setStep(step + 1);
              slideX.setValue(24);
              Animated.parallel([
                Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeA, { toValue: 1, duration: 180, useNativeDriver: true }),
              ]).start();
            });
          }}
          activeOpacity={pending !== null ? 0.85 : 1}
        >
          <Text
            style={[
              styles.nextBtnText,
              pending === null && { color: Colors.textTertiary },
            ]}
          >
            {step === totalQuestions - 1 ? 'See Results' : 'Next'}
          </Text>
          {pending !== null && (
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.base, fontWeight: '600', color: Colors.text,
  },
  stepBadge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    flexShrink: 0,
  },
  stepText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: { height: 3, borderRadius: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },

  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  catBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },

  questionText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
    marginBottom: Spacing.lg,
  },

  options: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
  optionText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: 16,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surface,
  },
  nextBtnText: {
    fontSize: FontSize.base, fontWeight: '700', color: '#fff',
  },
});
