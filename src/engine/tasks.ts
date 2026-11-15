import { differenceInCalendarDays, format, parseISO, startOfDay, subDays } from 'date-fns';
import { missionProgress } from '@/utils/met';
import type { CheckIn, Measurement, MetricKey, TaskCategory } from '@/types';

/**
 * Daily logging tasks. Points reward LOGGING, never results: nothing here depends on a value being
 * normal or healthy. Completion of measurement and check-in tasks is computed from stored data.
 */
export interface TaskDef {
  id: string;
  title: string;
  category: TaskCategory;
  points: number;
  kind: 'measurement' | 'checkin' | 'self';
  /** Measurement tasks need every one of these metrics logged that day. */
  metrics?: MetricKey[];
  where?: string;
}

export const TASK_DEFS: TaskDef[] = [
  { id: 'vitals', title: 'Log morning vitals (heart rate, blood pressure, temperature, SpO2)', category: 'measurement', points: 10, kind: 'measurement', metrics: ['hr', 'sbp', 'tempC', 'spo2'], where: '/biometrics' },
  { id: 'glucose', title: 'Log fasting blood glucose', category: 'measurement', points: 10, kind: 'measurement', metrics: ['glucose'], where: '/biometrics' },
  { id: 'sleep', title: 'Log sleep duration from last night', category: 'sleep', points: 10, kind: 'measurement', metrics: ['sleepHrs'], where: '/biometrics' },
  { id: 'hydration', title: 'Log your fluid intake', category: 'hydration', points: 10, kind: 'measurement', metrics: ['hydrationL'], where: '/biometrics' },
  { id: 'weight', title: 'Log body weight', category: 'measurement', points: 10, kind: 'measurement', metrics: ['weightKg'], where: '/biometrics' },
  { id: 'checkin', title: 'Complete your behavioral check-in', category: 'wellbeing', points: 15, kind: 'checkin', where: '/check-in' },
  { id: 'exercise', title: 'Complete your scheduled exercise session', category: 'exercise', points: 10, kind: 'self' },
  { id: 'nutrition', title: 'Follow your mission nutrition plan', category: 'nutrition', points: 10, kind: 'self' },
  { id: 'stress-break', title: 'Take a short stress-management break', category: 'wellbeing', points: 10, kind: 'self' },
];

export interface DayIndex {
  metricsByDate: Map<string, Set<MetricKey>>;
  checkInDates: Set<string>;
}

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

export function indexData(measurements: Measurement[], checkIns: CheckIn[]): DayIndex {
  const metricsByDate = new Map<string, Set<MetricKey>>();
  for (const m of measurements) {
    const key = dayKey(parseISO(m.takenAt));
    const set = metricsByDate.get(key) ?? new Set<MetricKey>();
    set.add(m.metric);
    metricsByDate.set(key, set);
  }
  return { metricsByDate, checkInDates: new Set(checkIns.map((c) => c.date)) };
}

/** Ids of the tasks completed on a date. Self-reported tasks come from `self`. */
export function doneOn(idx: DayIndex, date: string, self: string[] = []): Set<string> {
  const have = idx.metricsByDate.get(date) ?? new Set<MetricKey>();
  const out = new Set<string>();
  for (const d of TASK_DEFS) {
    if (d.kind === 'measurement') {
      if ((d.metrics ?? []).every((m) => have.has(m))) out.add(d.id);
    } else if (d.kind === 'checkin') {
      if (idx.checkInDates.has(date)) out.add(d.id);
    } else if (self.includes(d.id)) {
      out.add(d.id);
    }
  }
  return out;
}

/** A day counts toward the streak when the check-in AND at least one vital were logged. */
function qualifies(idx: DayIndex, date: string): boolean {
  return idx.checkInDates.has(date) && (idx.metricsByDate.get(date)?.size ?? 0) > 0;
}

/** Counts back from today if today qualifies, otherwise from yesterday. An unfinished today never breaks it. */
export function currentStreak(idx: DayIndex, now: Date): number {
  let d = startOfDay(now);
  if (!qualifies(idx, dayKey(d))) d = subDays(d, 1);
  let n = 0;
  while (qualifies(idx, dayKey(d))) {
    n += 1;
    d = subDays(d, 1);
  }
  return n;
}

export function longestStreak(idx: DayIndex): number {
  const dates = [...new Set([...idx.checkInDates, ...idx.metricsByDate.keys()])].filter((d) => qualifies(idx, d)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev !== null && differenceInCalendarDays(parseISO(d), parseISO(prev)) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export interface Milestone {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface TaskItem {
  def: TaskDef;
  done: boolean;
}

export interface TaskSummary {
  date: string;
  tasks: TaskItem[];
  doneCount: number;
  todayPoints: number;
  points: number;
  streak: number;
  longestStreak: number;
  loggedDays: number;
  milestones: Milestone[];
}

export interface SummaryInput {
  measurements: Measurement[];
  checkIns: CheckIn[];
  /** Self-reported completions: date -> task ids. */
  selfDone: Record<string, string[]>;
  launchDate: string;
  plannedDays: number;
  now: Date;
}

const POINTS = Object.fromEntries(TASK_DEFS.map((d) => [d.id, d.points])) as Record<string, number>;

export function summarizeTasks(input: SummaryInput): TaskSummary {
  const { measurements, checkIns, selfDone, launchDate, plannedDays, now } = input;
  const idx = indexData(measurements, checkIns);
  const today = dayKey(now);

  const todayDone = doneOn(idx, today, selfDone[today]);
  const tasks: TaskItem[] = TASK_DEFS.map((def) => ({ def, done: todayDone.has(def.id) }));
  const todayPoints = tasks.filter((t) => t.done).reduce((s, t) => s + t.def.points, 0);

  // Points are always recomputed from completions, so they cannot drift or be double-counted.
  const allDates = new Set<string>([...idx.metricsByDate.keys(), ...idx.checkInDates, ...Object.keys(selfDone)]);
  let points = 0;
  for (const date of allDates) {
    for (const id of doneOn(idx, date, selfDone[date])) points += POINTS[id] ?? 0;
  }

  const streak = currentStreak(idx, now);
  const longest = longestStreak(idx);
  const loggedDays = [...allDates].filter((d) => qualifies(idx, d)).length;
  const progress = missionProgress(launchDate, plannedDays, now);

  const milestones: Milestone[] = [
    { id: 'first-reading', label: 'First reading', description: 'Log your first biometric reading.', earned: measurements.length > 0 },
    { id: 'first-checkin', label: 'First check-in', description: 'Complete your first behavioral check-in.', earned: checkIns.length > 0 },
    { id: 'streak-3', label: '3-day streak', description: 'Log a check-in and a vital on 3 days in a row.', earned: longest >= 3 },
    { id: 'streak-7', label: '7-day streak', description: 'Log a check-in and a vital on 7 days in a row.', earned: longest >= 7 },
    { id: 'days-10', label: '10 days logged', description: 'Log a check-in and a vital on 10 different days.', earned: loggedDays >= 10 },
    { id: 'days-25', label: '25 days logged', description: 'Log a check-in and a vital on 25 different days.', earned: loggedDays >= 25 },
    { id: 'mission-25', label: 'Mission 25%', description: 'Reach 25% of the planned mission duration.', earned: progress >= 25 },
    { id: 'mission-50', label: 'Mission halfway', description: 'Reach 50% of the planned mission duration.', earned: progress >= 50 },
    { id: 'mission-75', label: 'Mission 75%', description: 'Reach 75% of the planned mission duration.', earned: progress >= 75 },
    { id: 'mission-100', label: 'Mission complete', description: 'Reach the planned mission duration.', earned: progress >= 100 },
  ];

  return {
    date: today,
    tasks,
    doneCount: tasks.filter((t) => t.done).length,
    todayPoints,
    points,
    streak,
    longestStreak: longest,
    loggedDays,
    milestones,
  };
}