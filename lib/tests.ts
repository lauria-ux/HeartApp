/**
 * Health self-assessment tests.
 * These are wellness tools only — not clinical diagnostic instruments.
 */

export interface TestOption {
  label: string;
  value: number; // added to total score
}

export interface TestQuestion {
  text: string;
  options: TestOption[];
}

export interface TestTier {
  upTo: number;           // inclusive upper bound; last tier catches remainder
  label: string;
  icon: string;           // Ionicons name
  color: string;
  description: string;
  tips: string[];
}

export interface HealthTest {
  id: string;
  title: string;
  subtitle: string;
  icon: string;           // Ionicons name
  color: string;
  estimatedMinutes: number;
  disclaimer: string;
  questions: TestQuestion[];
  tiers: TestTier[];      // ordered low-score → high-score
}

export const HEALTH_TESTS: HealthTest[] = [
  // ─── 1. Cardiac Risk Screener ───────────────────────────────────────────────
  {
    id: 'cardiac-risk',
    title: 'Cardiac Risk Screener',
    subtitle: 'Identify lifestyle factors that affect heart health',
    icon: 'heart-circle-outline',
    color: '#EF4444',
    estimatedMinutes: 2,
    disclaimer:
      'This screener identifies lifestyle risk factors only and is not a medical diagnosis. If you have concerns about your heart health, consult a qualified healthcare professional.',
    questions: [
      {
        text: 'How often do you do at least 30 minutes of aerobic exercise (brisk walking, cycling, swimming)?',
        options: [
          { label: '5 or more times a week', value: 0 },
          { label: '3–4 times a week', value: 1 },
          { label: '1–2 times a week', value: 2 },
          { label: 'Rarely or never', value: 3 },
        ],
      },
      {
        text: 'Do you currently smoke or use tobacco products?',
        options: [
          { label: 'Never smoked', value: 0 },
          { label: 'Quit more than a year ago', value: 1 },
          { label: 'Quit within the past year', value: 2 },
          { label: 'Yes, I currently smoke', value: 3 },
        ],
      },
      {
        text: 'How would you describe your typical diet?',
        options: [
          { label: 'Mostly whole foods, vegetables, and lean protein', value: 0 },
          { label: 'Balanced — healthy and processed foods mixed', value: 1 },
          { label: 'Mainly processed or high in salt and sugar', value: 2 },
          { label: 'Poor — little variety, high in saturated fat', value: 3 },
        ],
      },
      {
        text: 'Do you know your blood pressure status?',
        options: [
          { label: 'Normal (below 120/80 mmHg)', value: 0 },
          { label: 'Slightly elevated / pre-hypertension', value: 1 },
          { label: 'High, or treated with medication', value: 2 },
          { label: "I don't know", value: 2 },
        ],
      },
      {
        text: 'Does any close blood relative (parent or sibling) have heart disease diagnosed before age 60?',
        options: [
          { label: 'No known family history', value: 0 },
          { label: 'Some distant relatives affected', value: 1 },
          { label: 'Yes — a parent or sibling', value: 3 },
        ],
      },
    ],
    tiers: [
      {
        upTo: 4,
        label: 'Low Risk Profile',
        icon: 'checkmark-circle',
        color: '#22C55E',
        description:
          'Your responses suggest a favourable cardiovascular risk profile. Keep up your healthy habits — consistency is what makes the biggest difference over time.',
        tips: [
          'Maintain at least 150 minutes of moderate aerobic activity per week.',
          'Keep monitoring your blood pressure annually even if it is currently normal.',
          'A Mediterranean-style diet continues to show the strongest evidence for heart protection.',
        ],
      },
      {
        upTo: 9,
        label: 'Moderate Risk Factors',
        icon: 'alert-circle',
        color: '#F59E0B',
        description:
          'Your responses highlight some areas that could increase cardiovascular risk over time. Targeted lifestyle changes now can significantly reduce future risk.',
        tips: [
          'Aim to add one more exercise session per week and gradually increase duration.',
          'Reducing processed foods and increasing fibre intake can lower blood pressure within weeks.',
          'Consider scheduling a GP check-up to establish a blood pressure and cholesterol baseline.',
        ],
      },
      {
        upTo: 99,
        label: 'Multiple Risk Factors',
        icon: 'warning',
        color: '#EF4444',
        description:
          'Several cardiovascular risk factors are present. This does not mean you will develop heart disease, but professional guidance can help you manage and reduce these risks effectively.',
        tips: [
          'Schedule a cardiovascular health review with your doctor — a blood panel and blood pressure check are a good starting point.',
          'Even small, sustainable changes (5 minutes more walking each day) compound significantly over months.',
          'If you smoke, cessation support programmes double the success rate compared with willpower alone.',
        ],
      },
    ],
  },

  // ─── 2. Fitness Level Estimate ──────────────────────────────────────────────
  {
    id: 'fitness-level',
    title: 'Fitness Level Estimate',
    subtitle: 'Get a sense of your current aerobic capacity',
    icon: 'bicycle-outline',
    color: '#22C55E',
    estimatedMinutes: 1,
    disclaimer:
      'This is a self-reported estimate, not a clinical fitness assessment. Results depend on honest self-reporting and should be interpreted alongside other health data.',
    questions: [
      {
        text: 'How many days per week do you typically do 30 or more minutes of moderate cardio?',
        options: [
          { label: '5 or more days', value: 0 },
          { label: '3–4 days', value: 1 },
          { label: '1–2 days', value: 2 },
          { label: 'Rarely or never', value: 3 },
        ],
      },
      {
        text: 'How do you feel after climbing two full flights of stairs at a normal pace?',
        options: [
          { label: 'Barely notice it', value: 0 },
          { label: 'Slightly out of breath, recover in seconds', value: 1 },
          { label: 'Noticeably out of breath, need a moment', value: 2 },
          { label: 'Very out of breath, need to stop', value: 3 },
        ],
      },
      {
        text: 'How far can you comfortably walk or jog without stopping?',
        options: [
          { label: 'More than 5 km', value: 0 },
          { label: '2–5 km', value: 1 },
          { label: '500 m – 2 km', value: 2 },
          { label: 'Less than 500 m', value: 3 },
        ],
      },
      {
        text: 'How often do you do strength or resistance training?',
        options: [
          { label: '2 or more times per week', value: 0 },
          { label: 'About once a week', value: 1 },
          { label: 'Rarely', value: 2 },
          { label: 'Never', value: 3 },
        ],
      },
    ],
    tiers: [
      {
        upTo: 3,
        label: 'Good Fitness Base',
        icon: 'trophy',
        color: '#22C55E',
        description:
          'Your responses indicate a solid aerobic fitness base. You are likely in the top tier for long-term cardiovascular resilience.',
        tips: [
          'Add high-intensity intervals (HIIT) once a week to continue progressing.',
          'Focus on mobility and flexibility to support longevity in your training.',
          'Track your resting heart rate — a downward trend over weeks is a reliable sign of improving fitness.',
        ],
      },
      {
        upTo: 7,
        label: 'Moderate Fitness',
        icon: 'trending-up',
        color: '#F59E0B',
        description:
          'You have a decent activity foundation with clear room to grow. Gradual, consistent improvements will yield meaningful gains in cardiovascular health.',
        tips: [
          'Try adding one extra 30-minute walk per week — it is one of the most evidence-backed health habits.',
          'Start strength training twice a week if you are not already — it improves metabolic health independently of cardio.',
          'Use your HRV readings in Cardia to find your optimal days for harder efforts.',
        ],
      },
      {
        upTo: 12,
        label: 'Low Activity Level',
        icon: 'leaf',
        color: '#EF4444',
        description:
          'Your current activity level is below recommended guidelines. The good news: even modest increases in movement produce rapid and significant improvements in cardiovascular health.',
        tips: [
          'Start with 10-minute walks daily — research shows short bouts of activity accumulate genuine benefit.',
          'Take the stairs instead of lifts wherever possible; it adds up more than you would expect.',
          'Consider speaking with a physiotherapist or personal trainer for a beginner-friendly programme.',
        ],
      },
    ],
  },

  // ─── 3. Wellbeing Check ─────────────────────────────────────────────────────
  {
    id: 'wellbeing',
    title: 'Mental Wellbeing Check',
    subtitle: 'A brief snapshot of your emotional health',
    icon: 'happy-outline',
    color: '#8B5CF6',
    estimatedMinutes: 2,
    disclaimer:
      'This check is a wellness tool only and is not a clinical screening instrument for any mental health condition. If you are experiencing significant distress, please speak with a qualified healthcare or mental health professional.',
    questions: [
      {
        text: 'Over the past two weeks: how often have you felt nervous, anxious, or on edge?',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        text: 'Over the past two weeks: how often have you been unable to stop or control worrying?',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        text: 'Over the past two weeks: how often have you felt down, depressed, or hopeless?',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        text: 'Over the past two weeks: how often have you had little interest or pleasure in things you normally enjoy?',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        text: 'Overall, how would you rate your mental wellbeing right now?',
        options: [
          { label: 'Excellent', value: 0 },
          { label: 'Good', value: 1 },
          { label: 'Fair', value: 2 },
          { label: 'Poor', value: 3 },
        ],
      },
    ],
    tiers: [
      {
        upTo: 4,
        label: 'Positive Wellbeing',
        icon: 'sunny',
        color: '#22C55E',
        description:
          'Your responses suggest your mental wellbeing is in a good place. Regular check-ins — even when things feel fine — help you notice early shifts before they become harder to manage.',
        tips: [
          'Protect your sleep — it is the single most impactful lever for sustained emotional resilience.',
          'Regular physical activity has been shown to be as effective as medication for mild-to-moderate mood symptoms.',
          'Maintain meaningful social connection — even brief positive interactions are protective.',
        ],
      },
      {
        upTo: 9,
        label: 'Some Emotional Strain',
        icon: 'partly-sunny',
        color: '#F59E0B',
        description:
          'Your responses suggest some emotional difficulty. This is common and manageable. Intentional recovery habits can make a meaningful difference.',
        tips: [
          'Schedule at least one activity per day purely for enjoyment — this is not optional, it is therapeutic.',
          'Try 5 minutes of slow breathing (4 seconds in, 6 seconds out) before sleep — it directly lowers stress markers.',
          'Talking to someone you trust, or a counsellor, can help you gain perspective and practical strategies.',
        ],
      },
      {
        upTo: 99,
        label: 'Significant Difficulty',
        icon: 'cloudy',
        color: '#EF4444',
        description:
          'Your responses indicate significant emotional difficulty across multiple areas. You deserve support — these feelings are valid and there are people trained to help.',
        tips: [
          'Consider speaking with your GP as a first step — they can refer you to appropriate mental health support.',
          'If you are in distress now, many countries have free crisis lines available 24/7.',
          'In the meantime, try to maintain basic self-care: regular meals, adequate sleep, and brief time outside each day.',
        ],
      },
    ],
  },

  // ─── 4. Sleep Quality ───────────────────────────────────────────────────────
  {
    id: 'sleep-quality',
    title: 'Sleep Quality Check',
    subtitle: 'Evaluate your sleep habits and recovery',
    icon: 'moon-outline',
    color: '#06B6D4',
    estimatedMinutes: 1,
    disclaimer:
      'This check assesses self-reported sleep habits and is not a diagnostic tool for sleep disorders. Persistent sleep problems should be discussed with a healthcare professional.',
    questions: [
      {
        text: 'How many hours of sleep do you typically get on weeknights?',
        options: [
          { label: '7–9 hours', value: 0 },
          { label: '6–7 hours', value: 1 },
          { label: '5–6 hours', value: 2 },
          { label: 'Fewer than 5 or more than 10 hours', value: 3 },
        ],
      },
      {
        text: 'How often do you wake up feeling genuinely refreshed?',
        options: [
          { label: 'Almost every morning', value: 0 },
          { label: 'Most mornings', value: 1 },
          { label: 'Some mornings', value: 2 },
          { label: 'Rarely or never', value: 3 },
        ],
      },
      {
        text: 'How often do you have difficulty falling or staying asleep?',
        options: [
          { label: 'Rarely or never', value: 0 },
          { label: 'Sometimes (1–2 nights a week)', value: 1 },
          { label: 'Often (3–4 nights a week)', value: 2 },
          { label: 'Almost every night', value: 3 },
        ],
      },
      {
        text: 'How consistent is your sleep schedule (bed and wake time)?',
        options: [
          { label: 'Very consistent — same time every day', value: 0 },
          { label: 'Mostly consistent, with occasional variation', value: 1 },
          { label: 'Variable — shifts by 1–2 hours frequently', value: 2 },
          { label: 'Very irregular — no consistent schedule', value: 3 },
        ],
      },
    ],
    tiers: [
      {
        upTo: 3,
        label: 'Good Sleep Habits',
        icon: 'moon',
        color: '#06B6D4',
        description:
          'Your sleep habits appear to be supporting good recovery. Quality sleep is one of the most powerful levers for cardiovascular and cognitive health.',
        tips: [
          'Keep your sleep schedule consistent even on weekends — social jet lag erodes sleep quality over time.',
          'Use your Cardia HRV readings to confirm your sleep is delivering real recovery.',
          'A cool, dark room (around 18°C / 65°F) is consistently associated with deeper sleep.',
        ],
      },
      {
        upTo: 7,
        label: 'Room for Improvement',
        icon: 'partly-sunny',
        color: '#F59E0B',
        description:
          'Your sleep habits have some weaknesses that may be limiting your recovery and affecting your daytime energy and heart health.',
        tips: [
          'Set a fixed wake time and stick to it — this is the most effective single sleep intervention.',
          'Avoid screens for 30 minutes before bed; blue light delays melatonin production by up to 90 minutes.',
          'Avoid caffeine after 2 PM — its half-life is 5–7 hours, meaning half is still active at midnight.',
        ],
      },
      {
        upTo: 12,
        label: 'Poor Sleep Pattern',
        icon: 'cloudy-night',
        color: '#EF4444',
        description:
          'Your sleep pattern is significantly disrupted. Chronic poor sleep raises cardiovascular risk, impairs immune function, and accelerates cognitive decline.',
        tips: [
          'Consider seeing a GP if poor sleep has persisted for more than three months — treatable conditions like sleep apnoea are often undiagnosed.',
          'Start a simple sleep log for one week: record bedtime, wake time, and how rested you feel.',
          'Progressive muscle relaxation before bed is evidence-based for reducing sleep onset time and night-waking.',
        ],
      },
    ],
  },

  // ─── 5. Stress & Recovery ───────────────────────────────────────────────────
  {
    id: 'stress-recovery',
    title: 'Stress & Recovery Balance',
    subtitle: 'How well are you managing daily stress?',
    icon: 'leaf-outline',
    color: '#F59E0B',
    estimatedMinutes: 2,
    disclaimer:
      'This assessment reflects self-reported stress perception. It is not a diagnostic tool. If you are experiencing burnout or chronic stress affecting daily function, please seek professional support.',
    questions: [
      {
        text: 'How often do you feel overwhelmed by your daily demands or responsibilities?',
        options: [
          { label: 'Rarely', value: 0 },
          { label: 'Sometimes', value: 1 },
          { label: 'Often', value: 2 },
          { label: 'Almost always', value: 3 },
        ],
      },
      {
        text: 'How regularly do you have time to genuinely relax and switch off?',
        options: [
          { label: 'Daily', value: 0 },
          { label: 'Several times a week', value: 1 },
          { label: 'Rarely', value: 2 },
          { label: 'Almost never', value: 3 },
        ],
      },
      {
        text: 'Do you actively engage in stress-relieving activities (exercise, nature, creative pursuits, socialising)?',
        options: [
          { label: 'Daily', value: 0 },
          { label: 'A few times a week', value: 1 },
          { label: 'Once a week or less', value: 2 },
          { label: 'Rarely', value: 3 },
        ],
      },
      {
        text: 'How would you describe your overall work-life balance?',
        options: [
          { label: 'Well-balanced', value: 0 },
          { label: 'Mostly balanced', value: 1 },
          { label: 'Somewhat imbalanced', value: 2 },
          { label: 'Heavily imbalanced', value: 3 },
        ],
      },
      {
        text: 'How often do you feel fully recovered and ready for the day after sleeping?',
        options: [
          { label: 'Almost always', value: 0 },
          { label: 'Usually', value: 1 },
          { label: 'Sometimes', value: 2 },
          { label: 'Rarely', value: 3 },
        ],
      },
    ],
    tiers: [
      {
        upTo: 4,
        label: 'Well Managed',
        icon: 'checkmark-circle',
        color: '#22C55E',
        description:
          'Your stress and recovery balance looks healthy. You have good habits in place and your body is likely recovering well between demands.',
        tips: [
          'Use your Cardia Stress Index trend to confirm your body is matching how you feel.',
          'Protect your recovery habits — they are what makes you resilient when stress does spike.',
          'Regular HRV measurement in the morning gives you early warning when stress is accumulating before you consciously feel it.',
        ],
      },
      {
        upTo: 9,
        label: 'Moderate Load',
        icon: 'alert-circle',
        color: '#F59E0B',
        description:
          'You are carrying a moderate stress load with some recovery habits in place, but there are gaps worth closing. Sustained moderate stress without adequate recovery still accumulates over time.',
        tips: [
          'Identify one daily recovery activity you can protect — even 20 minutes of something genuinely restorative.',
          'The 4-7-8 breathing technique (inhale 4s, hold 7s, exhale 8s) activates the parasympathetic nervous system within minutes.',
          'Look at your Cardia 7-day Stress Index average — if it is trending up, prioritise recovery before intensity.',
        ],
      },
      {
        upTo: 15,
        label: 'High Stress Load',
        icon: 'warning',
        color: '#EF4444',
        description:
          'Your stress load is high and recovery appears insufficient. Chronic stress at this level has measurable effects on cardiovascular health, immune function, and cognitive performance.',
        tips: [
          'Consider speaking with your GP or a therapist — chronic stress is a medical concern, not just a lifestyle inconvenience.',
          'Set one firm boundary this week: one thing you will stop doing, reduce, or delegate.',
          'Even a 20-minute walk daily is enough to measurably lower cortisol and improve HRV within two weeks.',
        ],
      },
    ],
  },
];
