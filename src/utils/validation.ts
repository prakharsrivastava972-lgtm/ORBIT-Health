import { z } from 'zod';
import { parseISO } from 'date-fns';
import { METRICS } from '@/data/metrics';
import type { Measurement, MeasurementContext, MetricKey } from '@/types';

export type EntryKind = 'hr' | 'bp' | 'tempC' | 'glucose' | 'spo2' | 'sleepHrs' | 'hydrationL' | 'weightKg';

export const ENTRY_KINDS: { kind: EntryKind; label: string; metrics: MetricKey[] }[] = [
  { kind: 'hr', label: 'Heart rate (resting)', metrics: ['hr'] },
  { kind: 'bp', label: 'Blood pressure', metrics: ['sbp', 'dbp'] },
  { kind: 'tempC', label: 'Body temperature', metrics: ['tempC'] },
  { kind: 'glucose', label: 'Blood glucose', metrics: ['glucose'] },
  { kind: 'spo2', label: 'Blood oxygen (SpO2)', metrics: ['spo2'] },
  { kind: 'sleepHrs', label: 'Sleep duration', metrics: ['sleepHrs'] },
  { kind: 'hydrationL', label: 'Fluid intake', metrics: ['hydrationL'] },
  { kind: 'weightKg', label: 'Body weight', metrics: ['weightKg'] },
];

export const CONTEXT_LABELS: Record<MeasurementContext, string> = {
  rest: 'At rest',
  'post-exercise': 'After exercise',
  fasting: 'Fasting',
  'post-meal': 'After a meal',
};

/**
 * DATA-ENTRY SANITY LIMITS ONLY. They catch typing mistakes and impossible values.
 * They are NOT health thresholds and NOT NASA values.
 */
export const ENTRY_LIMITS: Record<MetricKey, { min: number; max: number }> = {
  hr: { min: 20, max: 250 },
  sbp: { min: 50, max: 260 },
  dbp: { min: 30, max: 160 },
  tempC: { min: 30, max: 43 },
  glucose: { min: 20, max: 600 },
  spo2: { min: 50, max: 100 },
  sleepHrs: { min: 0, max: 24 },
  hydrationL: { min: 0, max: 10 },
  weightKg: { min: 20, max: 250 },
};

const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export function makeEntrySchema(launchIso: string, nowFn: () => Date = () => new Date()) {
  return z
    .object({
      kind: z.enum(['hr', 'bp', 'tempC', 'glucose', 'spo2', 'sleepHrs', 'hydrationL', 'weightKg']),
      value: z.string().trim(),
      value2: z.string().trim().optional(),
      takenAt: z.string(),
      context: z.enum(['', 'rest', 'post-exercise', 'fasting', 'post-meal']).optional(),
    })
    .superRefine((d, ctx) => {
      const entry = ENTRY_KINDS.find((k) => k.kind === d.kind)!;
      const parsed: number[] = [];

      entry.metrics.forEach((metric, i) => {
        const field = i === 0 ? 'value' : 'value2';
        const raw = i === 0 ? d.value : (d.value2 ?? '');
        const meta = METRICS[metric];
        const { min, max } = ENTRY_LIMITS[metric];

        if (raw === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: 'Enter a value. Missing readings are not assumed normal.',
          });
          return;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: 'Enter a number.' });
          return;
        }
        if (n < min || n > max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${meta.label} must be between ${min} and ${max} ${meta.unit} (data-entry check, not a health threshold).`,
          });
          return;
        }
        parsed.push(n);
      });

      if (d.kind === 'bp' && parsed.length === 2 && parsed[0] <= parsed[1]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Systolic must be higher than diastolic.',
        });
      }

      const t = new Date(d.takenAt);
      if (d.takenAt === '' || Number.isNaN(t.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['takenAt'], message: 'Enter a valid date and time.' });
      } else if (t.getTime() > nowFn().getTime() + FUTURE_TOLERANCE_MS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['takenAt'],
          message: 'Measurement time cannot be in the future.',
        });
      } else if (t.getTime() < parseISO(launchIso).getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['takenAt'],
          message: 'Measurement time is before mission launch.',
        });
      }
    });
}

export type EntryValues = z.infer<ReturnType<typeof makeEntrySchema>>;

/** Converts validated form values into stored measurements (blood pressure yields two). */
export function toMeasurements(v: EntryValues, astronautId: string, now: Date = new Date()): Measurement[] {
  const entry = ENTRY_KINDS.find((k) => k.kind === v.kind)!;
  const takenAt = new Date(v.takenAt).toISOString();
  const recordedAt = now.toISOString();
  const stamp = `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return entry.metrics.map((metric, i) => {
    const meta = METRICS[metric];
    const n = Number(i === 0 ? v.value : v.value2);
    return {
      id: `manual-${stamp}-${metric}`,
      astronautId,
      metric,
      value: Number(n.toFixed(meta.decimals)),
      unit: meta.unit,
      takenAt,
      recordedAt,
      source: 'manual' as const,
      context: v.context ? (v.context as MeasurementContext) : undefined,
    };
  });
}