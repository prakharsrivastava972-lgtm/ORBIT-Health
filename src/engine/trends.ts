export const TREND_WINDOW = 7;
export const MIN_TREND_POINTS = 5;
export const MIN_TREND_SPAN_DAYS = 4;

/** t is in days. */
export interface TrendPoint {
  t: number;
  v: number;
}

export interface Trend {
  slope: number;
  /** Fitted change across the whole window. */
  change: number;
  r2: number;
  n: number;
  spanDays: number;
}

export function linearTrend(points: TrendPoint[]): Trend | null {
  const n = points.length;
  if (n < MIN_TREND_POINTS) return null;
  const mt = points.reduce((a, p) => a + p.t, 0) / n;
  const mv = points.reduce((a, p) => a + p.v, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    sxx += (p.t - mt) ** 2;
    sxy += (p.t - mt) * (p.v - mv);
    syy += (p.v - mv) ** 2;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const r2 = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  const ts = points.map((p) => p.t);
  const spanDays = Math.max(...ts) - Math.min(...ts);
  return { slope, change: slope * spanDays, r2, n, spanDays };
}