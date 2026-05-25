/**
 * PPG (Photoplethysmography) signal processing — pure JavaScript.
 *
 * These functions run on the JS thread, fed by raw luminance samples
 * collected from the camera frame processor.
 *
 * References:
 *  - Tarvainen et al. (2014) HRV analysis from PPG
 *  - Pan-Tompkins peak detection algorithm (simplified)
 *  - Baevsky Stress Index formula
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PPGSample {
  /** Raw average luminance (0–255) from camera frame */
  value: number;
  /** Frame timestamp in milliseconds */
  timestamp: number;
}

export interface PPGResult {
  heartRate: number;      // bpm (rounded)
  hrv: number;            // RMSSD in ms (rounded)
  stressIndex: number;    // 0–100
  healthIndex: number;    // 0–10
  rrIntervals: number[];  // raw RR intervals used for this result
  confidence: number;     // 0–1, how reliable this estimate is
}

// ─── Signal conditioning ────────────────────────────────────────────────────

/**
 * Apply a simple moving-average (box) filter to smooth out noise.
 * Window size ≈ 0.5s worth of samples (e.g. 15 samples at 30fps).
 */
export function movingAverage(signal: number[], windowSize: number): number[] {
  if (signal.length < windowSize) return signal.slice();
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < windowSize; i++) sum += signal[i];
  out.push(sum / windowSize);
  for (let i = windowSize; i < signal.length; i++) {
    sum += signal[i] - signal[i - windowSize];
    out.push(sum / windowSize);
  }
  return out;
}

/**
 * Normalise signal to [0, 1] range.
 */
export function normalise(signal: number[]): number[] {
  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const range = max - min;
  if (range === 0) return signal.map(() => 0.5);
  return signal.map((v) => (v - min) / range);
}

/**
 * High-pass detrend: subtract a moving average to remove baseline wander.
 * This is essential before peak detection.
 */
export function detrend(signal: number[], windowSize: number): number[] {
  const baseline = movingAverage(signal, windowSize);
  // baseline has fewer samples — pad front
  const pad = signal.length - baseline.length;
  return signal.map((v, i) => v - (baseline[i - pad] ?? baseline[0]));
}

// ─── Peak detection ─────────────────────────────────────────────────────────

/**
 * Detect peaks in a normalised [0, 1] signal.
 *
 * Returns an array of sample indices where peaks occur.
 *
 * @param signal   Normalised (0–1) PPG signal
 * @param minGapMs Minimum gap between peaks in ms (default 300ms → max 200bpm)
 * @param fps      Frames per second used for timing
 * @param threshold Amplitude threshold above which a local max is a "peak"
 */
export function detectPeaks(
  signal: number[],
  fps: number,
  minGapMs = 300,
  threshold = 0.5,
): number[] {
  const minGapSamples = Math.round((minGapMs / 1000) * fps);
  const peaks: number[] = [];

  for (let i = 1; i < signal.length - 1; i++) {
    const prev = signal[i - 1];
    const curr = signal[i];
    const next = signal[i + 1];

    // Local maximum above threshold
    if (curr > threshold && curr >= prev && curr >= next) {
      // Enforce minimum gap
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minGapSamples) {
        peaks.push(i);
      } else if (curr > signal[peaks[peaks.length - 1]]) {
        // Replace last peak if this one is taller and within the gap window
        peaks[peaks.length - 1] = i;
      }
    }
  }

  return peaks;
}

// ─── RR interval extraction ─────────────────────────────────────────────────

/**
 * Convert peak indices to RR intervals (ms) using sample timestamps.
 */
export function peaksToRRIntervals(
  peakIndices: number[],
  timestamps: number[],
): number[] {
  if (peakIndices.length < 2) return [];
  const rr: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    const dt = timestamps[peakIndices[i]] - timestamps[peakIndices[i - 1]];
    if (dt > 0) rr.push(dt);
  }
  return rr;
}

// ─── Metric calculations ────────────────────────────────────────────────────

/**
 * Heart Rate in BPM from RR intervals.
 * Uses median (more robust to outliers than mean).
 */
export function rrToHR(rrIntervals: number[]): number {
  if (rrIntervals.length === 0) return 0;
  const sorted = [...rrIntervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return Math.round(60000 / median);
}

/**
 * HRV — RMSSD (Root Mean Square of Successive Differences) in ms.
 * Standard time-domain HRV metric. Higher = better parasympathetic tone.
 */
export function rrToRMSSD(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 0;
  let sumSq = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSq += diff * diff;
  }
  return Math.round(Math.sqrt(sumSq / (rrIntervals.length - 1)));
}

/**
 * Stress Index (0–100) derived from HRV.
 *
 * Inverted, scaled version of Baevsky's SI.
 * Low HRV (poor recovery) → high stress. High HRV → low stress.
 *
 * Reference RMSSD ranges (general population):
 *  - < 20ms  → very high stress
 *  - 20–40ms → elevated
 *  - > 40ms  → normal / low stress
 */
export function rmssdToStressIndex(rmssd: number): number {
  if (rmssd <= 0) return 75;
  // Exponential decay: high RMSSD → low stress
  const raw = 100 * Math.exp(-rmssd / 35);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Composite Health Index (0–10).
 *
 * Combines heart rate and HRV into a single wellness score.
 * This is a general wellness indicator, NOT a medical diagnostic.
 *
 * Scoring:
 *  - HR in resting range (50–85 bpm) → best HR score
 *  - High HRV (>40ms) → best HRV score
 */
export function calculateHealthIndex(hr: number, rmssd: number): number {
  // HR score: peak at ~60bpm, declines outside 50–100
  const hrScore = Math.max(
    0,
    1 - Math.abs(hr - 65) / 40,
  );

  // HRV score: capped at 40ms for max score
  const hrvScore = Math.min(1, rmssd / 40);

  // Weighted composite: HRV is more informative than raw HR
  const composite = hrScore * 0.35 + hrvScore * 0.65;

  return Math.round(composite * 10 * 10) / 10; // one decimal place
}

// ─── Outlier filter ─────────────────────────────────────────────────────────

/**
 * Remove physiologically implausible RR intervals.
 * Valid human HR range: ~30–220 bpm → RR: 273ms–2000ms
 */
export function filterRRIntervals(rrIntervals: number[]): number[] {
  return rrIntervals.filter((rr) => rr >= 273 && rr <= 2000);
}

// ─── Full analysis pipeline ─────────────────────────────────────────────────

/**
 * Run the full PPG analysis pipeline on a buffer of samples.
 *
 * @param samples Array of {value, timestamp} objects collected from frames
 * @param fps     Approximate frame rate (for peak detection timing)
 * @returns PPGResult or null if not enough data
 */
export function analysePPGBuffer(
  samples: PPGSample[],
  fps = 30,
): PPGResult | null {
  if (samples.length < fps * 5) return null; // Need at least 5 seconds

  const rawSignal = samples.map((s) => s.value);
  const timestamps = samples.map((s) => s.timestamp);

  // 1. Smooth
  const smoothed = movingAverage(rawSignal, Math.round(fps * 0.15)); // 150ms window

  // 2. Detrend (remove slow baseline drift)
  const detrended = detrend(smoothed, Math.round(fps * 1.5)); // 1.5s window

  // 3. Normalise
  const normalised = normalise(detrended);

  // 4. Detect peaks
  const peakIndices = detectPeaks(normalised, fps);

  if (peakIndices.length < 3) return null; // Need at least 3 beats

  // 5. RR intervals
  const rrRaw = peaksToRRIntervals(peakIndices, timestamps);
  const rrFiltered = filterRRIntervals(rrRaw);

  if (rrFiltered.length < 2) return null;

  // 6. Metrics
  const heartRate = rrToHR(rrFiltered);
  const hrv = rrToRMSSD(rrFiltered);
  const stressIndex = rmssdToStressIndex(hrv);
  const healthIndex = calculateHealthIndex(heartRate, hrv);

  // 7. Confidence: how many valid beats we found relative to expected
  const expectedBeats = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000 / 60 * heartRate;
  const confidence = Math.min(1, rrFiltered.length / Math.max(1, expectedBeats));

  return {
    heartRate,
    hrv,
    stressIndex,
    healthIndex,
    rrIntervals: rrFiltered,
    confidence,
  };
}
