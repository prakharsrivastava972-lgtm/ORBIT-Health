import type { MetricKey } from '@/types';

export interface MetricMeta {
  label: string;
  unit: string;
  decimals: number;
}

export const METRICS: Record<MetricKey, MetricMeta> = {
  hr: { label: 'Resting heart rate', unit: 'bpm', decimals: 0 },
  sbp: { label: 'Systolic pressure', unit: 'mmHg', decimals: 0 },
  dbp: { label: 'Diastolic pressure', unit: 'mmHg', decimals: 0 },
  tempC: { label: 'Body temperature', unit: '°C', decimals: 1 },
  glucose: { label: 'Blood glucose', unit: 'mg/dL', decimals: 0 },
  spo2: { label: 'Blood oxygen (SpO2)', unit: '%', decimals: 0 },
  sleepHrs: { label: 'Sleep duration', unit: 'h', decimals: 1 },
  hydrationL: { label: 'Fluid intake', unit: 'L', decimals: 1 },
  weightKg: { label: 'Body weight', unit: 'kg', decimals: 1 },
};

export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];