/**
 * Articles data — science-backed health education content.
 * Each article has a short excerpt (shown in the card) and full body sections
 * (rendered in the detail screen).
 */

export type ArticleCategory =
  | 'HRV'
  | 'Heart Rate'
  | 'Stress'
  | 'Cardiology'
  | 'Technology'
  | 'Fitness';

export interface ArticleSection {
  heading?: string;
  body: string;
}

export interface Article {
  id: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  readMinutes: number;
  /** Hex accent colour for the category band */
  color: string;
  /** Ionicons icon name shown as decorative element */
  icon: string;
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  {
    id: 'hrv-explained',
    category: 'HRV',
    title: 'Heart Rate Variability: What It Is and Why It Matters',
    excerpt:
      'HRV is one of the most powerful biomarkers available — a window into how well your autonomic nervous system adapts to stress, recovery, and daily life.',
    readMinutes: 5,
    color: '#0EA5E9',
    icon: 'pulse-outline',
    sections: [
      {
        heading: 'What is HRV?',
        body: 'Heart Rate Variability (HRV) is the variation in time between consecutive heartbeats. Even at a resting rate of 60 bpm, the interval between beats is not exactly one second — it fluctuates by milliseconds. This variability is normal, healthy, and meaningful.\n\nThe metric most commonly used to quantify HRV is RMSSD (Root Mean Square of Successive Differences), which captures beat-to-beat changes. This is what Cardia measures.',
      },
      {
        heading: 'The autonomic nervous system connection',
        body: 'HRV reflects the balance between the two branches of the autonomic nervous system (ANS):\n\n• The sympathetic branch ("fight or flight") speeds the heart and reduces HRV.\n• The parasympathetic branch ("rest and digest"), acting through the vagus nerve, slows the heart and increases HRV.\n\nA high HRV generally means your parasympathetic system is dominant — a sign of good recovery, low physiological stress, and cardiovascular resilience.',
      },
      {
        heading: 'What is a good HRV?',
        body: 'HRV is highly individual. Values range from below 20 ms (low, often seen in high-stress or poor recovery) to over 80 ms (high, common in well-trained athletes).\n\nRather than comparing your score to a population average, track your personal baseline over days and weeks. A sustained drop in HRV often signals that your body is under unusual load — whether from illness, poor sleep, overtraining, or emotional stress.',
      },
      {
        heading: 'How to improve HRV',
        body: 'HRV responds to lifestyle over weeks and months, not overnight:\n\n• Consistent, quality sleep is the single biggest driver.\n• Regular aerobic exercise raises your resting parasympathetic tone.\n• Stress management — breathwork, meditation, or simply adequate rest — reduces chronic sympathetic activation.\n• Alcohol, caffeine late in the day, and illness will temporarily suppress HRV.',
      },
      {
        heading: 'Disclaimer',
        body: 'HRV measured by a smartphone camera (PPG) is an estimate. Camera-based measurements are affected by lighting, movement, and skin tone. Use trends over time, not individual readings, for meaningful insights. This app is a wellness tool — consult a physician for medical guidance.',
      },
    ],
  },

  {
    id: 'stress-index',
    category: 'Stress',
    title: 'The Stress Index: Reading Your Body\'s Alarm System',
    excerpt:
      'The Stress Index translates your HRV data into an intuitive 0–100 score, giving you a snapshot of how hard your autonomic nervous system is working at any moment.',
    readMinutes: 4,
    color: '#F59E0B',
    icon: 'thunderstorm-outline',
    sections: [
      {
        heading: 'Where does the Stress Index come from?',
        body: 'The Stress Index used in Cardia is inspired by the Baevsky Stress Index — a method developed in Soviet space medicine to monitor cosmonaut cardiovascular health. It quantifies the degree of strain on the body\'s regulatory mechanisms by analysing the statistical distribution of RR intervals (the time between heartbeats).',
      },
      {
        heading: 'How is it calculated?',
        body: 'Cardia derives the Stress Index from your RMSSD (HRV). In short:\n\n• High HRV → low stress index (autonomic system is flexible and relaxed).\n• Low HRV → high stress index (autonomic system is working hard, likely under load).\n\nThe scale runs from 0 to 100. Scores below 30 are associated with low physiological stress; scores above 50 suggest the body is under significant strain.',
      },
      {
        heading: 'What causes a high Stress Index?',
        body: 'A high score does not always mean emotional stress. Physiological stressors include:\n\n• Intense exercise or athletic training\n• Sleep deprivation or poor sleep quality\n• Illness or infection (often the first sign before other symptoms)\n• Alcohol or stimulant consumption\n• Emotional stress, anxiety, or overwork\n\nA single elevated reading is rarely concerning. A pattern of consistently high scores over days warrants attention and recovery focus.',
      },
      {
        heading: 'Using the Stress Index wisely',
        body: 'Measure at the same time each day — ideally in the morning before getting out of bed — for the most comparable readings. Morning measurements capture your baseline recovery state, minimising the influence of recent activity or meals.',
      },
      {
        heading: 'Disclaimer',
        body: 'The Stress Index is an estimation based on photoplethysmography and is not a clinical diagnostic. Do not use it to self-diagnose stress disorders or cardiovascular conditions.',
      },
    ],
  },

  {
    id: 'resting-heart-rate',
    category: 'Heart Rate',
    title: 'Resting Heart Rate: The Simplest Vital Sign',
    excerpt:
      'Your resting heart rate tells a surprisingly rich story about your cardiovascular fitness, recovery, and long-term health risk — and it takes under a minute to measure.',
    readMinutes: 3,
    color: '#EF4444',
    icon: 'heart-outline',
    sections: [
      {
        heading: 'What is resting heart rate?',
        body: 'Resting heart rate (RHR) is the number of times your heart beats per minute when you are at rest — sitting quietly or lying down, not having exercised recently. For adults, a normal range is 60–100 bpm, but most healthy adults fall between 60 and 80 bpm.',
      },
      {
        heading: 'What does it tell you?',
        body: 'A lower resting heart rate generally reflects greater cardiovascular efficiency. The heart is a muscle: with regular aerobic training, it becomes stronger and pumps more blood per beat, so it needs to beat less frequently.\n\nHighly trained endurance athletes commonly have RHRs of 40–50 bpm. Bradycardia (below 60 bpm) in non-athletes may indicate a conduction abnormality and should be evaluated by a doctor.',
      },
      {
        heading: 'High resting heart rate: when to pay attention',
        body: 'A consistently elevated RHR (above 90–100 bpm at rest) is associated with increased cardiovascular risk over the long term. Short-term elevations are usually benign:\n\n• After caffeine, alcohol, or stimulants\n• Dehydration\n• Stress or anxiety\n• Fever or illness\n• Overtraining without adequate recovery\n\nIf your resting heart rate is persistently above 100 bpm without obvious cause, consult a healthcare professional.',
      },
      {
        heading: 'How to get an accurate reading',
        body: 'For the most accurate measurement:\n• Measure first thing in the morning, before leaving bed.\n• Avoid caffeine and heavy meals for at least an hour beforehand.\n• Sit or lie still for at least 5 minutes before measuring.\n• Measure at the same time each day to track trends reliably.',
      },
    ],
  },

  {
    id: 'how-ppg-works',
    category: 'Technology',
    title: 'How Your Camera Measures Your Heart Rate',
    excerpt:
      'Photoplethysmography (PPG) uses light to detect blood volume changes in your fingertip — turning your phone\'s camera and flash into a surprisingly capable heart rate sensor.',
    readMinutes: 4,
    color: '#06B6D4',
    icon: 'phone-portrait-outline',
    sections: [
      {
        heading: 'The principle: light and blood',
        body: 'Each heartbeat pushes a pulse of blood through your capillaries. This momentary increase in blood volume slightly changes the amount of light absorbed by your tissue.\n\nPPG (photoplethysmography) detects this change optically. The phone\'s flashlight provides a steady light source; the camera sensor measures how much of that light is reflected back from the fingertip placed over the lens. The rhythmic variation in reflected light corresponds directly to your heartbeat.',
      },
      {
        heading: 'From light to heartbeat',
        body: 'Cardia reads the luminance (brightness) values from the camera\'s image sensor at roughly 30 frames per second. Each frame\'s average brightness represents one sample of the blood volume pulse.\n\nThe raw signal is noisy — breathing, small movements, and ambient light all introduce variation. The app applies:\n\n1. Moving average smoothing to reduce high-frequency noise.\n2. Detrending to remove slow drift.\n3. Peak detection to identify individual heartbeats.\n4. RR interval filtering to reject physiologically impossible values.',
      },
      {
        heading: 'Calculating HRV from PPG',
        body: 'Once beat peaks are identified, the time intervals between consecutive peaks (RR intervals) are extracted. From these intervals, RMSSD is calculated — the root mean square of successive differences between adjacent RR intervals. This is a standard HRV metric used in clinical research and is well-validated against ECG-derived RMSSD.',
      },
      {
        heading: 'Accuracy and limitations',
        body: 'Camera-based PPG is a valid wellness tool but is less accurate than a medical ECG or a dedicated optical sensor (like those in medical pulse oximeters or most fitness wearables).\n\nAccuracy is affected by:\n• Finger placement and pressure on the lens\n• Ambient light — measure in consistent, moderate lighting\n• Movement — stay still during measurement\n• Skin tone and thickness\n\nFor wellness tracking, camera PPG is useful for trends. Do not use it for clinical decisions.',
      },
    ],
  },

  {
    id: 'hrv-fitness',
    category: 'Fitness',
    title: 'HRV as a Training and Recovery Compass',
    excerpt:
      'Elite athletes and coaches use HRV to dial in training load and prevent overtraining. You can use the same principle to make smarter daily decisions about effort and rest.',
    readMinutes: 5,
    color: '#22C55E',
    icon: 'barbell-outline',
    sections: [
      {
        heading: 'The HRV–training connection',
        body: 'Exercise is a stressor. Every training session creates micro-damage in muscle and taxes the cardiovascular and nervous systems. Recovery is when adaptation — fitness — actually happens.\n\nHRV is particularly sensitive to this recovery process. After a hard training session, HRV typically drops as the sympathetic nervous system remains activated to drive repair. As recovery completes, HRV rebounds, often exceeding pre-training levels — a sign of positive adaptation.',
      },
      {
        heading: 'Reading daily HRV for training decisions',
        body: 'The approach used by many coaches:\n\n• Establish a 7–14 day rolling baseline HRV.\n• If today\'s morning HRV is near or above your baseline: proceed with planned hard training.\n• If HRV is 5–10% below baseline: opt for a moderate session or active recovery.\n• If HRV is more than 10% below baseline: rest or light movement only.\n\nThis is not a rigid rule — context matters. But HRV adds objective data to the subjective "how do I feel today?" question.',
      },
      {
        heading: 'Overtraining syndrome',
        body: 'Overtraining syndrome occurs when cumulative training stress consistently exceeds recovery capacity. Symptoms include persistent fatigue, declining performance, mood disturbances, and elevated resting heart rate.\n\nHRV often provides an early warning: a sustained suppression of HRV over days or weeks, without corresponding illness, is a red flag for accumulated fatigue. Addressing it early — with rest and reduced load — prevents more serious overtraining.',
      },
      {
        heading: 'Non-athletes benefit too',
        body: 'You do not need to be an athlete to benefit from HRV tracking. Work stress, poor sleep, and sedentary periods all suppress HRV in the same way. Tracking HRV can help anyone identify when they are chronically under-recovered and need to prioritise rest, regardless of whether their "training" is CrossFit or a long work week.',
      },
    ],
  },

  {
    id: 'autonomic-nervous-system',
    category: 'Cardiology',
    title: 'The Autonomic Nervous System and Heart Health',
    excerpt:
      'The autonomic nervous system silently regulates every heartbeat, blood pressure change, and vascular adjustment. Understanding it unlocks why HRV is such a powerful health marker.',
    readMinutes: 6,
    color: '#8B5CF6',
    icon: 'body-outline',
    sections: [
      {
        heading: 'Two systems, one balance',
        body: 'The autonomic nervous system (ANS) operates below conscious awareness, controlling vital functions including heart rate, blood pressure, digestion, and breathing. It has two main divisions:\n\n• The sympathetic nervous system prepares the body for action — accelerating heart rate, increasing blood pressure, diverting blood to muscles. This is the classical "fight or flight" response.\n• The parasympathetic nervous system promotes rest and recovery — slowing heart rate, lowering blood pressure, supporting digestion. Its primary cardiac messenger is the vagus nerve.',
      },
      {
        heading: 'The vagus nerve: a key player',
        body: 'The vagus nerve is the longest cranial nerve, running from the brainstem through the neck and chest to the abdomen. Its cardiac branch releases acetylcholine onto the heart\'s sinoatrial node, slowing the heart rate.\n\nVagal tone — the baseline level of parasympathetic activity — is the primary driver of resting HRV. People with high vagal tone tend to have higher HRV, lower resting heart rates, better cardiovascular health, and greater stress resilience.',
      },
      {
        heading: 'Autonomic imbalance and disease',
        body: 'Chronically elevated sympathetic activity and reduced vagal tone are associated with:\n\n• Hypertension and increased cardiovascular event risk\n• Type 2 diabetes and metabolic syndrome\n• Anxiety disorders and depression\n• Inflammatory conditions\n\nThis is why HRV — as an indirect measure of vagal tone — is a meaningful long-term health biomarker, not merely a fitness metric.',
      },
      {
        heading: 'Improving autonomic balance',
        body: 'The most evidence-based interventions for improving vagal tone and HRV:\n\n• Aerobic exercise: Even moderate-intensity exercise significantly raises vagal tone over weeks.\n• Slow, deep breathing: Breathing at approximately 5–6 breaths per minute (resonance frequency breathing) strongly activates the parasympathetic system.\n• Cold exposure: Cold showers and cold water immersion acutely and chronically raise vagal tone.\n• Mindfulness and meditation: Reduce chronic sympathetic activation.\n• Omega-3 fatty acids: Associated with higher HRV in multiple studies.',
      },
      {
        heading: 'Note on Cardia measurements',
        body: 'Cardia estimates ANS balance through RMSSD and the Stress Index derived from camera PPG. These are wellness estimations. Clinical assessment of autonomic function involves specialised testing performed by cardiologists and neurologists.',
      },
    ],
  },
];

/** Unique categories across all articles, in display order */
export const ALL_CATEGORIES: ArticleCategory[] = [
  'HRV',
  'Heart Rate',
  'Stress',
  'Cardiology',
  'Technology',
  'Fitness',
];

/** Map from category to its accent color */
export const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  HRV: '#0EA5E9',        // sky-500 — matches accent
  'Heart Rate': '#EF4444', // red-500
  Stress: '#F59E0B',      // amber-500
  Cardiology: '#8B5CF6',  // violet-500 — visual variety
  Technology: '#06B6D4',  // cyan-500
  Fitness: '#22C55E',     // green-500
};
