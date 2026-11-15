import type { Basis, MeasurementContext, MetricKey, MissionThresholds } from '@/types';

export interface Limits {
  attentionLow?: number;
  attentionHigh?: number;
  urgentLow?: number;
  urgentHigh?: number;
}

export const GENERAL_REFERENCE_NOTE =
  'General reference limits are illustrative round numbers for adults, chosen for this prototype. They are not astronaut-specific medical thresholds and are not NASA values. A flight surgeon or clinician must review them before real use.';

/** A reading is flagged only when it is strictly beyond a limit. */
export const GENERAL_REFERENCE: Partial<Record<MetricKey, Limits>> = {
  hr: { attentionLow: 50, attentionHigh: 100, urgentLow: 40, urgentHigh: 130 },
  sbp: { attentionLow: 90, attentionHigh: 130, urgentLow: 80, urgentHigh: 180 },
  dbp: { attentionLow: 55, attentionHigh: 85, urgentLow: 40, urgentHigh: 120 },
  tempC: { attentionLow: 35.5, attentionHigh: 37.8, urgentLow: 35.0, urgentHigh: 39.0 },
  glucose: { attentionLow: 70, attentionHigh: 100, urgentLow: 54, urgentHigh: 200 },
  spo2: { attentionLow: 95, urgentLow: 90 },
  sleepHrs: { attentionLow: 6, attentionHigh: 10, urgentLow: 4 },
  hydrationL: { attentionLow: 1.5, urgentLow: 1.0 },
  // weightKg: no general limit. Personal baseline only.
};

/** Mission-profile limits replace the general limits for that metric entirely. */
export function limitsFor(
  metric: MetricKey,
  thresholds?: MissionThresholds,
): { limits?: Limits; basis: Basis } {
  const custom = thresholds?.[metric];
  if (custom) return { limits: custom, basis: 'mission-configured' };
  return { limits: GENERAL_REFERENCE[metric], basis: 'general-reference' };
}

/** Contexts that make a reading not comparable with the usual reference. */
export const EXCLUDED_CONTEXTS: Partial<Record<MetricKey, MeasurementContext[]>> = {
  hr: ['post-exercise'],
  sbp: ['post-exercise'],
  dbp: ['post-exercise'],
  glucose: ['post-meal'],
};

export function isComparableContext(metric: MetricKey, context?: MeasurementContext): boolean {
  if (!context) return true;
  return !(EXCLUDED_CONTEXTS[metric] ?? []).includes(context);
}