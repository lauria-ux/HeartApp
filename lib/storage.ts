import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Measurement,
  BloodPressureLog,
  BloodOxygenLog,
  UserProfile,
} from '@/types/health';

const KEYS = {
  measurements: 'hh:measurements',
  bpLogs: 'hh:bp_logs',
  spo2Logs: 'hh:spo2_logs',
  profile: 'hh:profile',
} as const;

// ─── Internal helpers ──────────────────────────────────────────────────────

async function readJSON<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  return JSON.parse(raw) as T[];
}

async function writeJSON<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ─── Measurements (PPG sessions) ───────────────────────────────────────────

export async function getMeasurements(): Promise<Measurement[]> {
  const data = await readJSON<Measurement>(KEYS.measurements);
  return data.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveMeasurement(m: Measurement): Promise<void> {
  const existing = await readJSON<Measurement>(KEYS.measurements);
  await writeJSON(KEYS.measurements, [m, ...existing]);
}

export async function deleteMeasurement(id: string): Promise<void> {
  const existing = await readJSON<Measurement>(KEYS.measurements);
  await writeJSON(KEYS.measurements, existing.filter((m) => m.id !== id));
}

// ─── Blood Pressure ────────────────────────────────────────────────────────

export async function getBPLogs(): Promise<BloodPressureLog[]> {
  const data = await readJSON<BloodPressureLog>(KEYS.bpLogs);
  return data.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveBPLog(log: BloodPressureLog): Promise<void> {
  const existing = await readJSON<BloodPressureLog>(KEYS.bpLogs);
  await writeJSON(KEYS.bpLogs, [log, ...existing]);
}

export async function deleteBPLog(id: string): Promise<void> {
  const existing = await readJSON<BloodPressureLog>(KEYS.bpLogs);
  await writeJSON(KEYS.bpLogs, existing.filter((l) => l.id !== id));
}

// ─── Blood Oxygen ──────────────────────────────────────────────────────────

export async function getSpO2Logs(): Promise<BloodOxygenLog[]> {
  const data = await readJSON<BloodOxygenLog>(KEYS.spo2Logs);
  return data.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveSpO2Log(log: BloodOxygenLog): Promise<void> {
  const existing = await readJSON<BloodOxygenLog>(KEYS.spo2Logs);
  await writeJSON(KEYS.spo2Logs, [log, ...existing]);
}

export async function deleteSpO2Log(id: string): Promise<void> {
  const existing = await readJSON<BloodOxygenLog>(KEYS.spo2Logs);
  await writeJSON(KEYS.spo2Logs, existing.filter((l) => l.id !== id));
}

// ─── User Profile ──────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  if (!raw) return null;
  return JSON.parse(raw) as UserProfile;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}
