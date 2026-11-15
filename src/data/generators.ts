import type { AstronautProfile, Measurement, MetricKey } from '@/types';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { missionDay } from '@/utils/met';

/** FNV-1a string hash -> 32-bit seed. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small deterministic PRNG, so the same profile always yields the same demo data. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface Spec {
  mean: number;
  sd: number;
  min: number;
  max: number;
  hour: number;
  minute: number;
  context?: Measurement['context'];
}

/** Illustrative demo values only. Not clinical norms and not NASA values. */
function specsFor(p: AstronautProfile): Record<MetricKey, Spec> {
  return {
    hr: { mean: 60 + (p.age > 45 ? 2 : 0), sd: 3, min: 40, max: 130, hour: 7, minute: 30, context: 'rest' },
    sbp: { mean: 116, sd: 5, min: 80, max: 200, hour: 7, minute: 32 },
    dbp: { mean: 74, sd: 4, min: 40, max: 120, hour: 7, minute: 32 },
    tempC: { mean: 36.7, sd: 0.2, min: 34, max: 41, hour: 7, minute: 35 },
    glucose: { mean: 92, sd: 6, min: 40, max: 300, hour: 7, minute: 20, context: 'fasting' },
    spo2: { mean: 97.5, sd: 0.8, min: 80, max: 100, hour: 7, minute: 36 },
    sleepHrs: { mean: 6.8, sd: 0.6, min: 2, max: 11, hour: 7, minute: 15 },
    hydrationL: { mean: 2.4, sd: 0.35, min: 0.5, max: 5, hour: 21, minute: 0 },
    weightKg: { mean: p.weightKg, sd: 0.3, min: 30, max: 200, hour: 7, minute: 10 },
  };
}

/**
 * Generates up to `days` days of SIMULATED daily readings ending at `now`.
 * Limited to the days since launch. About 4% of readings are randomly missing.
 */
export function generateMeasurements(
  profile: AstronautProfile,
  days = 30,
  now: Date = new Date(),
): Measurement[] {
  const available = Math.min(days, missionDay(profile.mission.launchDate, now));
  const rand = mulberry32(hashSeed(profile.id));
  const specs = specsFor(profile);
  const out: Measurement[] = [];

  for (let d = available - 1; d >= 0; d--) {
    for (const metric of METRIC_KEYS) {
      const spec = specs[metric];
      const t = new Date(now);
      t.setDate(t.getDate() - d);
      t.setHours(spec.hour, spec.minute, 0, 0);

      // Always consume the random numbers so output stays stable regardless of skips.
      const noise = gaussian(rand);
      const skip = rand() < 0.04;
      if (skip || t.getTime() > now.getTime()) continue;

      const meta = METRICS[metric];
      const raw = Math.min(spec.max, Math.max(spec.min, spec.mean + noise * spec.sd));
      const value = Number(raw.toFixed(meta.decimals));
      const takenAt = t.toISOString();
      out.push({
        id: `${profile.id}-${metric}-${takenAt}`,
        astronautId: profile.id,
        metric,
        value,
        unit: meta.unit,
        takenAt,
        recordedAt: takenAt,
        source: 'simulated',
        context: spec.context,
      });
    }
  }
  return out;
}