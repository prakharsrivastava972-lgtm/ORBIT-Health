import { format, subDays } from 'date-fns';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { SIGMA_FLOOR } from '@/engine/baselines';
import type { AstronautProfile, CheckIn, Measurement, MeasurementContext, MetricKey, Rating } from '@/types';

/** Deterministic SIMULATED demo scenarios. Illustrative values, not clinical norms and not NASA values. */
export type ScenarioId = 'nominal' | 'sleep-stress' | 'dehydration' | 'urgent' | 'sparse';

export interface ScenarioInfo {
  id: ScenarioId;
  label: string;
  description: string;
  expected: string;
}

export const SCENARIOS: ScenarioInfo[] = [
  { id: 'nominal', label: 'Nominal', description: '30 days of steady readings and check-ins.', expected: 'No flags. Status Normal.' },
  { id: 'sleep-stress', label: 'Sleep and stress drift', description: 'Sleep shortens over 9 days while stress, fatigue and sleep-quality ratings worsen.', expected: 'Attention flags on sleep and behavior, no Urgent.' },
  { id: 'dehydration', label: 'Dehydration and elevated heart rate', description: 'Fluid intake falls, resting heart rate and blood pressure creep up, weight dips.', expected: 'A cluster of related Attention flags.' },
  { id: 'urgent', label: 'Urgent escalation', description: 'Sustained high blood pressure climbing past a general limit, plus a check-in asking to talk to someone.', expected: 'Urgent status with escalation steps.' },
  { id: 'sparse', label: 'Sparse data', description: 'Readings every third day, three metrics never logged, only three old check-ins.', expected: 'No baselines, low confidence, missing-data notes.' },
];

type Day = number; // days ago, 0 = today
type Adjust = (metric: MetricKey, d: Day) => number | undefined;

interface Plan {
  days: number;
  include?: (metric: MetricKey, d: Day) => boolean;
  adjust?: Adjust;
  context?: (metric: MetricKey, d: Day) => MeasurementContext | undefined;
}

const HOUR: Record<MetricKey, [number, number]> = {
  hr: [7, 30], sbp: [7, 32], dbp: [7, 32], tempC: [7, 35], glucose: [7, 20],
  spo2: [7, 36], sleepHrs: [7, 15], hydrationL: [21, 0], weightKg: [7, 10],
};
const PATTERN = [0, 1, -1, 0.5, -0.5];
const DEFAULT_CONTEXT: Partial<Record<MetricKey, MeasurementContext>> = { hr: 'rest', glucose: 'fasting' };

const baseMeans = (p: AstronautProfile): Record<MetricKey, number> => ({
  hr: 60, sbp: 116, dbp: 74, tempC: 36.7, glucose: 92, spo2: 98, sleepHrs: 7.2, hydrationL: 2.4, weightKg: p.weightKg,
});

const byDay =
  (table: Partial<Record<MetricKey, Record<number, number>>>): Adjust =>
  (metric, d) =>
    table[metric]?.[d];

function makeMeasurements(profile: AstronautProfile, now: Date, plan: Plan): Measurement[] {
  const mean = baseMeans(profile);
  const out: Measurement[] = [];
  for (let d = plan.days - 1; d >= 0; d--) {
    METRIC_KEYS.forEach((metric, i) => {
      if (plan.include && !plan.include(metric, d)) return;
      const meta = METRICS[metric];
      const base = mean[metric] + PATTERN[d % 5] * SIGMA_FLOOR[metric] * 0.6;
      const raw = plan.adjust?.(metric, d) ?? base;
      let t: Date;
      if (d === 0) {
        t = new Date(now.getTime() - (i + 1) * 3 * 60000);
      } else {
        t = subDays(now, d);
        t.setHours(HOUR[metric][0], HOUR[metric][1], 0, 0);
      }
      const iso = t.toISOString();
      out.push({
        id: `${profile.id}-scn-${metric}-${d}`,
        astronautId: profile.id,
        metric,
        value: Number(raw.toFixed(meta.decimals)),
        unit: meta.unit,
        takenAt: iso,
        recordedAt: iso,
        source: 'simulated',
        context: plan.context?.(metric, d) ?? DEFAULT_CONTEXT[metric],
      });
    });
  }
  return out;
}

type CheckExtra = Partial<Record<'mood' | 'stress' | 'fatigue' | 'isolation' | 'sleepQuality', number>> & {
  notes?: string;
  requestsSupport?: boolean;
};

function makeCheckIns(profile: AstronautProfile, now: Date, days: Day[], extra: (d: Day) => CheckExtra): CheckIn[] {
  return [...days]
    .sort((a, b) => b - a)
    .map((d) => {
      const e = extra(d);
      const r = { mood: 4, stress: [2, 2, 3, 2, 2][d % 5], fatigue: 2, isolation: 2, sleepQuality: 4, ...e };
      const date = format(subDays(now, d), 'yyyy-MM-dd');
      return {
        id: `${profile.id}-checkin-${date}`,
        astronautId: profile.id,
        date,
        mood: r.mood as Rating,
        stress: r.stress as Rating,
        fatigue: r.fatigue as Rating,
        isolation: r.isolation as Rating,
        sleepQuality: r.sleepQuality as Rating,
        notes: e.notes,
        requestsSupport: e.requestsSupport ? true : undefined,
      };
    });
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function buildScenario(
  profile: AstronautProfile,
  id: ScenarioId,
  now: Date = new Date(),
): { measurements: Measurement[]; checkIns: CheckIn[] } {
  const w = profile.weightKg;
  switch (id) {
    case 'nominal':
      return {
        measurements: makeMeasurements(profile, now, { days: 30 }),
        checkIns: makeCheckIns(profile, now, range(1, 29), () => ({})),
      };

    case 'sleep-stress': {
      const sleep: Record<number, number> = {};
      for (let d = 0; d <= 8; d++) sleep[d] = 7.2 - (8 - d) * 0.2;
      const stress: Record<number, number> = { 5: 3, 4: 3, 3: 4, 2: 4, 1: 4 };
      const sleepQ: Record<number, number> = { 5: 3, 4: 2, 3: 2, 2: 2, 1: 2 };
      const mood: Record<number, number> = { 3: 3, 2: 3, 1: 3 };
      return {
        measurements: makeMeasurements(profile, now, { days: 30, adjust: byDay({ sleepHrs: sleep }) }),
        checkIns: makeCheckIns(profile, now, range(1, 29), (d) => ({
          ...(stress[d] ? { stress: stress[d], fatigue: stress[d] } : {}),
          ...(sleepQ[d] ? { sleepQuality: sleepQ[d] } : {}),
          ...(mood[d] ? { mood: mood[d] } : {}),
        })),
      };
    }

    case 'dehydration':
      return {
        measurements: makeMeasurements(profile, now, {
          days: 30,
          adjust: byDay({
            hydrationL: { 2: 1.8, 1: 1.4, 0: 1.2 },
            hr: { 2: 80, 1: 90, 0: 98 },
            sbp: { 2: 122, 1: 126, 0: 129 },
            weightKg: { 1: w - 0.6, 0: w - 1.0 },
          }),
        }),
        checkIns: makeCheckIns(profile, now, range(1, 29), (d) => (d <= 2 ? { fatigue: 3 } : {})),
      };

    case 'urgent':
      return {
        measurements: makeMeasurements(profile, now, {
          days: 30,
          adjust: byDay({
            sbp: { 2: 158, 1: 168, 0: 186 },
            dbp: { 2: 96, 1: 104, 0: 122 },
            hr: { 2: 90, 1: 98, 0: 104 },
          }),
          context: (m) => (m === 'sbp' || m === 'dbp' ? 'rest' : undefined),
        }),
        checkIns: makeCheckIns(profile, now, range(0, 29), (d) => {
          if (d === 0) return { stress: 5, fatigue: 4, notes: 'Headache and dizziness (simulated scenario).', requestsSupport: true };
          if (d === 1) return { stress: 4, fatigue: 4 };
          if (d === 2) return { stress: 4, fatigue: 3 };
          return {};
        }),
      };

    case 'sparse': {
      const logged: MetricKey[] = ['hr', 'sbp', 'dbp', 'tempC', 'spo2', 'sleepHrs'];
      return {
        measurements: makeMeasurements(profile, now, {
          days: 30,
          include: (m, d) => logged.includes(m) && d >= 4 && d % 3 === 0,
        }),
        checkIns: makeCheckIns(profile, now, [7, 10, 16], () => ({})),
      };
    }
  }
}