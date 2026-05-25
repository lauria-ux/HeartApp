// ─── Measurement primitives ────────────────────────────────────────────────

export type MeasurementMode = 'quick' | 'precise';
export type CameraFacing = 'rear' | 'front';

export type ContextTag =
  | 'at_rest'
  | 'after_exercise'
  | 'morning'
  | 'before_sleep'
  | 'after_meal'
  | 'stressed'
  | 'after_caffeine';

export const CONTEXT_TAG_LABELS: Record<ContextTag, string> = {
  at_rest: 'At rest',
  after_exercise: 'After exercise',
  morning: 'Morning',
  before_sleep: 'Before sleep',
  after_meal: 'After meal',
  stressed: 'Stressed',
  after_caffeine: 'After caffeine',
};

// ─── Core data models ──────────────────────────────────────────────────────

/** A PPG-based measurement session (camera → HR + HRV). */
export interface Measurement {
  id: string;
  timestamp: number;        // Unix ms
  heartRate: number;        // bpm
  hrv: number;              // RMSSD in ms
  stressIndex: number;      // 0–100 (derived from HRV)
  healthIndex: number;      // 0–10 composite score
  mode: MeasurementMode;
  cameraFacing: CameraFacing;
  contextTag?: ContextTag;
  rrIntervals: number[];    // raw RR intervals in ms (stored for re-analysis)
}

/** Manual blood pressure entry (from cuff — cannot be measured by camera). */
export interface BloodPressureLog {
  id: string;
  timestamp: number;
  systolic: number;         // mmHg
  diastolic: number;        // mmHg
  contextTag?: ContextTag;
}

/** Manual blood oxygen entry (from external pulse oximeter). */
export interface BloodOxygenLog {
  id: string;
  timestamp: number;
  spo2: number;             // 0–100 %
  contextTag?: ContextTag;
}

/** User profile — used for Heart Age and personalised reference ranges. */
export interface UserProfile {
  name?: string;
  dateOfBirth?: number;     // Unix ms
  biologicalSex?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
}

// ─── Status helpers ────────────────────────────────────────────────────────

export type HealthStatus = 'low' | 'normal' | 'elevated' | 'high';

/** Resting HR reference (not diagnostic). */
export function getHRStatus(bpm: number): HealthStatus {
  if (bpm < 60) return 'low';
  if (bpm <= 100) return 'normal';
  if (bpm <= 120) return 'elevated';
  return 'high';
}

/** RMSSD reference — higher HRV = better recovery; low HRV = elevated stress. */
export function getHRVStatus(hrv: number): HealthStatus {
  if (hrv >= 40) return 'normal';
  if (hrv >= 20) return 'elevated';
  return 'high';
}

/** Blood pressure (AHA rough tiers — not diagnostic). */
export function getBPStatus(systolic: number, diastolic: number): HealthStatus {
  if (systolic >= 140 || diastolic >= 90) return 'high';
  if (systolic >= 130 || diastolic >= 80) return 'elevated';
  if (systolic < 90 || diastolic < 60) return 'low';
  return 'normal';
}

/** SpO₂ reference (camera entry is from a real oximeter). */
export function getSpO2Status(spo2: number): HealthStatus {
  if (spo2 >= 95) return 'normal';
  if (spo2 >= 90) return 'elevated';
  return 'high';
}

export function getStressStatus(stressIndex: number): HealthStatus {
  if (stressIndex <= 30) return 'normal';
  if (stressIndex <= 60) return 'elevated';
  return 'high';
}
