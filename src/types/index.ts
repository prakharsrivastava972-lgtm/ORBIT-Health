/**
 * ORBIT Health domain model.
 * All demo data is SIMULATED. Nothing here is a NASA medical threshold.
 */

/** Where a rule's limits come from. There is intentionally no 'nasa-threshold' value. */
export type Basis = 'general-reference' | 'personal-baseline' | 'mission-configured' | 'self-reported';
export type Severity = 'normal' | 'attention' | 'urgent';
export type Source = 'manual' | 'simulated' | 'device';
export type Confidence = 'low' | 'medium' | 'high';

export type MetricKey =
  | 'hr'
  | 'sbp'
  | 'dbp'
  | 'tempC'
  | 'glucose'
  | 'spo2'
  | 'sleepHrs'
  | 'hydrationL'
  | 'weightKg';

export type MeasurementContext = 'rest' | 'post-exercise' | 'fasting' | 'post-meal';

/** Set by a flight surgeon per astronaut. Never preloaded as "NASA values". */
export type MissionThresholds = Partial<
  Record<MetricKey, { attentionLow?: number; attentionHigh?: number; urgentLow?: number; urgentHigh?: number }>
>;

export interface MissionInfo {
  name: string;
  launchDate: string; // ISO date
  plannedDays: number;
  location: string; // e.g. "Low Earth Orbit station (simulated)"
}

export interface AstronautProfile {
  id: string;
  name: string;
  callsign: string;
  age: number;
  sex: 'F' | 'M' | 'X';
  heightCm: number;
  weightKg: number;
  mission: MissionInfo;
  conditions: string[]; // user-declared, informational only
  thresholds?: MissionThresholds;
  isSimulated: boolean;
}

export interface Measurement {
  id: string;
  astronautId: string;
  metric: MetricKey;
  value: number;
  unit: string;
  takenAt: string; // ISO: when measured
  recordedAt: string; // ISO: when entered
  source: Source;
  context?: MeasurementContext;
}

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface CheckIn {
  id: string;
  astronautId: string;
  date: string; // ISO date
  mood: Rating;
  stress: Rating;
  fatigue: Rating;
  isolation: Rating;
  sleepQuality: Rating;
  notes?: string;
  /** Crew member asked to talk to someone now. Always escalated. */
  requestsSupport?: boolean;
}

export interface RiskFlag {
  id: string;
  metric: MetricKey | 'behavioral' | 'hazard';
  severity: Severity;
  title: string;
  basis: Basis;
  explanation: string;
  evidence: { current: number; baseline?: number; deviation?: number; window: string };
  confidence: Confidence;
  dataQuality: { staleHours: number; sampleCount: number; issues: string[] };
  escalation: string;
  limitations: string;
  references?: string[]; // ids in the citation registry
}

export type HazardId =
  | 'radiation'
  | 'microgravity'
  | 'isolation-confinement'
  | 'distance-from-earth'
  | 'closed-environment';

export interface HazardAssessment {
  hazardId: HazardId;
  exposureContext: string;
  relatedRiskIds: string[];
  /** Ordinary vitals cannot directly measure these hazards' effects. */
  measurableFromVitals: false | 'partial';
  requiredAssessments: string[];
}

export type TaskCategory = 'exercise' | 'nutrition' | 'hydration' | 'sleep' | 'wellbeing' | 'measurement';

export interface Task {
  id: string;
  astronautId: string;
  title: string;
  category: TaskCategory;
  points: number;
  dueDate: string;
  completedAt?: string;
}

export interface Gamification {
  points: number;
  streakDays: number;
  milestones: string[];
}

export interface CommsMessage {
  id: string;
  from: 'crew' | 'flight-surgeon';
  sentAt: string;
  deliveredAt: string; // sentAt + simulated one-way delay
  body: string;
  simulated: true;
  /** Id of the crew message this reply answers. */
  replyTo?: string;
}

/** Future-ready: all data enters the app through an adapter like this. */
export interface SensorAdapter {
  id: string;
  label: string;
  source: Source;
  fetchSince(astronautId: string, sinceIso: string): Promise<Measurement[]>;
}

/** Future-ready: swap localStorage for IndexedDB or a backend. */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}