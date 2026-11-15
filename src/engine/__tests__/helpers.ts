import { METRICS } from '@/data/metrics';
import type { AstronautProfile, Measurement, MeasurementContext, MetricKey } from '@/types';

export const NOW = new Date(2026, 5, 1, 12, 0, 0);

export const testProfile: AstronautProfile = {
  id: 't',
  name: 'Test Astronaut',
  callsign: 'Test',
  age: 40,
  sex: 'F',
  heightCm: 170,
  weightKg: 65,
  mission: { name: 'Test', launchDate: '2026-01-01', plannedDays: 180, location: 'Test' },
  conditions: [],
  isSimulated: true,
};

export function mk(metric: MetricKey, value: number, daysAgo: number, context?: MeasurementContext): Measurement {
  const t = new Date(NOW);
  t.setDate(t.getDate() - daysAgo);
  t.setHours(7, 30, 0, 0);
  const iso = t.toISOString();
  return {
    id: `${metric}-${daysAgo}-${value}`,
    astronautId: 't',
    metric,
    value,
    unit: METRICS[metric].unit,
    takenAt: iso,
    recordedAt: iso,
    source: 'manual',
    context,
  };
}

/** One reading per day, oldest first, the last one `endDaysAgo` days ago. */
export function run(metric: MetricKey, values: number[], endDaysAgo = 0): Measurement[] {
  return values.map((v, i) => mk(metric, v, endDaysAgo + values.length - 1 - i));
}