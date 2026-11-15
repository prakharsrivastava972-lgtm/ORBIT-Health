import type { Measurement, MetricKey } from '@/types';

/** Readings for one metric, oldest first, optionally limited to the most recent `limit`. */
export function seriesFor(all: Measurement[], metric: MetricKey, limit?: number): Measurement[] {
  const sorted = all.filter((m) => m.metric === metric).sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  return limit ? sorted.slice(-limit) : sorted;
}

export function latestFor(all: Measurement[], metric: MetricKey): Measurement | undefined {
  const s = seriesFor(all, metric);
  return s[s.length - 1];
}