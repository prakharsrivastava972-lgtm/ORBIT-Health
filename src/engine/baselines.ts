import type { Measurement, MetricKey } from '@/types';

export const RECENT_READINGS = 3;
export const MIN_BASELINE_READINGS = 10;
export const BASELINE_MAX_READINGS = 28;
/** Earlier readings needed for a baseline, plus the most recent ones being compared. */
export const BASELINE_MIN_TOTAL = MIN_BASELINE_READINGS + RECENT_READINGS;

/** Smallest "usual variation" allowed per metric, so a perfectly steady history cannot make tiny changes look huge. */
export const SIGMA_FLOOR: Record<MetricKey, number> = {
  hr: 2,
  sbp: 3,
  dbp: 3,
  tempC: 0.15,
  glucose: 4,
  spo2: 0.5,
  sleepHrs: 0.4,
  hydrationL: 0.25,
  weightKg: 0.3,
};

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median absolute deviation. */
export function mad(values: number[], center: number = median(values)): number {
  return median(values.map((v) => Math.abs(v - center)));
}

export interface Baseline {
  median: number;
  /** Robust estimate of usual variation. */
  sigma: number;
  n: number;
}

/**
 * Baseline = median of up to 28 earlier readings, excluding the 3 most recent.
 * `readings` must be usable readings, oldest first. Returns null when history is too short.
 */
export function computeBaseline(readings: Measurement[], metric: MetricKey): Baseline | null {
  const history = readings.slice(0, Math.max(0, readings.length - RECENT_READINGS)).slice(-BASELINE_MAX_READINGS);
  if (history.length < MIN_BASELINE_READINGS) return null;
  const values = history.map((r) => r.value);
  const med = median(values);
  const sigma = Math.max(1.4826 * mad(values, med), SIGMA_FLOOR[metric]);
  return { median: med, sigma, n: values.length };
}