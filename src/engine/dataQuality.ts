import type { Confidence, Measurement } from '@/types';
import { BASELINE_MIN_TOTAL, type Baseline } from './baselines';

export const STALE_HOURS = 36;
export const VERY_STALE_HOURS = 72;

export interface Quality {
  staleHours: number;
  sampleCount: number;
  issues: string[];
  confidence: Confidence;
}

export function hoursSince(iso: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3600000);
}

export function assessQuality(input: {
  latest: Measurement;
  sampleCount: number;
  baseline: Baseline | null;
  excluded: number;
  now: Date;
}): Quality {
  const { latest, sampleCount, baseline, excluded, now } = input;
  const staleHours = Math.round(hoursSince(latest.takenAt, now));
  const issues: string[] = [];

  if (staleHours > STALE_HOURS) issues.push(`Latest usable reading is ${staleHours} h old.`);
  if (!baseline) {
    issues.push(
      `Only ${sampleCount} usable reading(s): not enough for a personal baseline (needs at least ${BASELINE_MIN_TOTAL}). Compared with the general reference range only.`,
    );
  }
  if (sampleCount < 3) issues.push('Very few readings, so any comparison is uncertain.');
  if (excluded > 0) {
    issues.push(
      `${excluded} reading(s) were left out because their context (for example after exercise or a meal) does not match the reference.`,
    );
  }

  let confidence: Confidence;
  if (staleHours > VERY_STALE_HOURS || sampleCount < 3) confidence = 'low';
  else if (baseline && baseline.n >= 14 && staleHours <= STALE_HOURS) confidence = 'high';
  else confidence = 'medium';

  return { staleHours, sampleCount, issues, confidence };
}