import { METRICS, METRIC_KEYS } from '@/data/metrics';
import type { MetricKey, MissionThresholds } from '@/types';
import { ENTRY_LIMITS } from '@/utils/validation';

export const THRESHOLD_FIELDS = ['urgentLow', 'attentionLow', 'attentionHigh', 'urgentHigh'] as const;
export type ThresholdField = (typeof THRESHOLD_FIELDS)[number];
export type ThresholdInputs = Record<string, string>;

export const inputKey = (metric: MetricKey, field: ThresholdField) => `${metric}.${field}`;

export function thresholdsToInputs(t?: MissionThresholds): ThresholdInputs {
  const out: ThresholdInputs = {};
  if (!t) return out;
  for (const metric of METRIC_KEYS) {
    for (const f of THRESHOLD_FIELDS) {
      const v = t[metric]?.[f];
      if (v !== undefined) out[inputKey(metric, f)] = String(v);
    }
  }
  return out;
}

/** Blank fields are left unset. Limits must be numbers in the entry range and increase from urgent low to urgent high. */
export function parseThresholds(inputs: ThresholdInputs): {
  thresholds: MissionThresholds;
  errors: Partial<Record<MetricKey, string>>;
} {
  const thresholds: MissionThresholds = {};
  const errors: Partial<Record<MetricKey, string>> = {};

  for (const metric of METRIC_KEYS) {
    const meta = METRICS[metric];
    const { min, max } = ENTRY_LIMITS[metric];
    const entry: Partial<Record<ThresholdField, number>> = {};
    let error: string | undefined;

    for (const f of THRESHOLD_FIELDS) {
      const raw = (inputs[inputKey(metric, f)] ?? '').trim();
      if (raw === '') continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        error = 'Enter numbers only.';
        break;
      }
      if (n < min || n > max) {
        error = `Values must be between ${min} and ${max} ${meta.unit}.`;
        break;
      }
      entry[f] = n;
    }

    if (!error) {
      const present = THRESHOLD_FIELDS.filter((f) => entry[f] !== undefined);
      for (let i = 1; i < present.length; i++) {
        if ((entry[present[i]] as number) <= (entry[present[i - 1]] as number)) {
          error = 'Limits must increase from urgent low to urgent high.';
          break;
        }
      }
    }

    if (error) errors[metric] = error;
    else if (Object.keys(entry).length > 0) thresholds[metric] = entry;
  }
  return { thresholds, errors };
}