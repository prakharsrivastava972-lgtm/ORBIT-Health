import { METRICS } from '@/data/metrics';
import type { Measurement, MetricKey, MissionThresholds, RiskFlag, Severity } from '@/types';
import { RECENT_READINGS, type Baseline } from './baselines';
import type { Quality } from './dataQuality';
import { limitsFor } from './referenceRanges';
import { MIN_TREND_SPAN_DAYS, TREND_WINDOW, linearTrend } from './trends';

export const Z_ATTENTION = 3;
export const Z_SUSTAINED = 2;
export const TREND_SIGMAS = 2.5;
export const TREND_MIN_R2 = 0.65;

export interface RuleInfo {
  id: string;
  name: string;
  basisLabel: string;
  cap: string;
  description: string;
}

/** Shown on the Insights page so every rule is visible to the user. */
export const RULES: RuleInfo[] = [
  {
    id: 'limit',
    name: 'Limit check',
    basisLabel: 'General reference range, or limits set in the mission profile',
    cap: 'Attention or Urgent',
    description:
      'Compares the latest usable reading with a limit. General limits are illustrative and are not astronaut-specific medical thresholds. If the mission profile sets limits for a metric, those replace the general ones.',
  },
  {
    id: 'baseline',
    name: 'Personal baseline check',
    basisLabel: 'Your own earlier readings',
    cap: 'Attention only',
    description:
      'Needs 10 earlier readings plus the 3 most recent. The baseline is the median of up to 28 earlier readings. Usual variation is estimated robustly (median absolute deviation, with a minimum per metric). Flags a latest reading about 3 times that variation away, or three readings in a row about 2 times away on the same side. Never Urgent on its own.',
  },
  {
    id: 'trend',
    name: 'Drift check',
    basisLabel: 'Your own recent readings',
    cap: 'Attention only',
    description:
      'Looks at the last 7 readings (at least 5, spanning 4 or more days). Flags a steady straight-line change larger than 2.5 times your usual variation with a good fit (R-squared of 0.65 or more). Skipped when the baseline check already flagged the same metric.',
  },
  {
    id: 'context',
    name: 'Context filter',
    basisLabel: 'How the reading was taken',
    cap: 'Not a flag',
    description:
      'Heart rate and blood pressure tagged "after exercise", and glucose tagged "after a meal", are left out of comparisons and counted in the data-quality notes.',
  },
];

export interface RuleContext {
  metric: MetricKey;
  latest: Measurement;
  /** Usable readings, oldest first. */
  readings: Measurement[];
  baseline: Baseline | null;
  quality: Quality;
  thresholds?: MissionThresholds;
}

const ESCALATION: Record<Severity, string> = {
  normal: '',
  attention:
    'Repeat the measurement under the same conditions, note anything that could explain it (activity, food, sleep, stress), and mention it at your next flight-surgeon check-in. Contact the flight surgeon sooner if you feel unwell or it persists.',
  urgent:
    'Repeat the measurement now to rule out a measuring error. If the reading is confirmed, or you feel unwell, contact the flight surgeon immediately and follow your mission medical procedures.',
};

const LIMITATIONS: Record<MetricKey, string> = {
  hr: 'One resting reading cannot show heart rhythm or heart function. Caffeine, stress, illness, fitness and measuring technique all change it.',
  sbp: 'Blood pressure varies through the day and with posture, cuff fit and stress. One reading cannot assess the heart or blood vessels.',
  dbp: 'Blood pressure varies through the day and with posture, cuff fit and stress. One reading cannot assess the heart or blood vessels.',
  tempC: 'Body temperature varies with time of day, activity and measuring site. It cannot identify a cause.',
  glucose: 'A glucose value depends on fasting status and timing. One value cannot assess metabolic health.',
  spo2: 'Pulse oximeters can read inaccurately with poor circulation, movement or cold fingers. SpO2 does not measure carbon dioxide or lung function.',
  sleepHrs: 'Duration does not capture sleep quality or circadian timing.',
  hydrationL: 'Self-reported fluid intake is approximate and does not measure hydration status.',
  weightKg: 'Body weight cannot separate muscle, fat and fluid changes.',
};

const fmt = (metric: MetricKey, n: number) => n.toFixed(METRICS[metric].decimals);
const fmtSpread = (metric: MetricKey, n: number) => n.toFixed(Math.max(METRICS[metric].decimals, 1));

function build(
  ctx: RuleContext,
  ruleId: string,
  part: Pick<RiskFlag, 'severity' | 'title' | 'basis' | 'explanation' | 'evidence'>,
): RiskFlag {
  return {
    id: `${ctx.metric}:${ruleId}`,
    metric: ctx.metric,
    ...part,
    confidence: ctx.quality.confidence,
    dataQuality: {
      staleHours: ctx.quality.staleHours,
      sampleCount: ctx.quality.sampleCount,
      issues: ctx.quality.issues,
    },
    escalation: ESCALATION[part.severity],
    limitations: `${LIMITATIONS[ctx.metric]} A flag is a comparison, not a diagnosis.`,
  };
}

export function limitRule(ctx: RuleContext): RiskFlag | null {
  const { metric, latest, baseline, thresholds } = ctx;
  const { limits, basis } = limitsFor(metric, thresholds);
  if (!limits) return null;

  const v = latest.value;
  let severity: Severity = 'normal';
  let side: 'below' | 'above' = 'below';
  let limit = 0;

  if (limits.urgentLow !== undefined && v < limits.urgentLow) {
    severity = 'urgent';
    side = 'below';
    limit = limits.urgentLow;
  } else if (limits.urgentHigh !== undefined && v > limits.urgentHigh) {
    severity = 'urgent';
    side = 'above';
    limit = limits.urgentHigh;
  } else if (limits.attentionLow !== undefined && v < limits.attentionLow) {
    severity = 'attention';
    side = 'below';
    limit = limits.attentionLow;
  } else if (limits.attentionHigh !== undefined && v > limits.attentionHigh) {
    severity = 'attention';
    side = 'above';
    limit = limits.attentionHigh;
  }
  if (severity === 'normal') return null;

  const meta = METRICS[metric];
  const mission = basis === 'mission-configured';
  return build(ctx, 'limit', {
    severity,
    basis,
    title: `${meta.label} outside ${mission ? 'mission-configured' : 'general reference'} range`,
    explanation:
      `${meta.label} is ${fmt(metric, v)} ${meta.unit}, ${side} the ${mission ? 'mission-configured' : 'general adult reference'} ${severity} limit of ${fmt(metric, limit)} ${meta.unit}. ` +
      (mission
        ? 'This limit was set in the mission profile.'
        : 'General reference limits are not astronaut-specific medical thresholds.'),
    evidence: {
      current: v,
      baseline: baseline?.median,
      deviation: baseline ? v - baseline.median : undefined,
      window: 'latest reading',
    },
  });
}

export function baselineRule(ctx: RuleContext): RiskFlag | null {
  const { metric, latest, readings, baseline } = ctx;
  if (!baseline) return null;

  const z = (v: number) => (v - baseline.median) / baseline.sigma;
  const zLatest = z(latest.value);
  const recent = readings.slice(-RECENT_READINGS);
  const sustained =
    recent.length === RECENT_READINGS &&
    (recent.every((r) => z(r.value) >= Z_SUSTAINED) || recent.every((r) => z(r.value) <= -Z_SUSTAINED));

  if (Math.abs(zLatest) < Z_ATTENTION && !sustained) return null;

  const meta = METRICS[metric];
  const dev = latest.value - baseline.median;
  const direction = dev > 0 ? 'above' : 'below';

  return build(ctx, 'baseline', {
    severity: 'attention',
    basis: 'personal-baseline',
    title: `${meta.label} differs from personal baseline`,
    explanation:
      `${meta.label} is ${fmt(metric, latest.value)} ${meta.unit}, ${fmtSpread(metric, Math.abs(dev))} ${meta.unit} ${direction} your personal baseline of ${fmt(metric, baseline.median)} ${meta.unit} ` +
      `(about ${Math.abs(zLatest).toFixed(1)} times your usual variation of ±${fmtSpread(metric, baseline.sigma)}).` +
      (sustained && Math.abs(zLatest) < Z_ATTENTION
        ? ' The last three readings have all been on the same side of your baseline.'
        : ''),
    evidence: {
      current: latest.value,
      baseline: baseline.median,
      deviation: dev,
      window: `latest vs ${baseline.n} earlier readings`,
    },
  });
}

export function trendRule(ctx: RuleContext): RiskFlag | null {
  const { metric, latest, readings, baseline } = ctx;
  if (!baseline) return null;

  const window = readings.slice(-TREND_WINDOW);
  const trend = linearTrend(window.map((r) => ({ t: new Date(r.takenAt).getTime() / 86400000, v: r.value })));
  if (!trend || trend.spanDays < MIN_TREND_SPAN_DAYS) return null;
  if (Math.abs(trend.change) < TREND_SIGMAS * baseline.sigma || trend.r2 < TREND_MIN_R2) return null;

  const meta = METRICS[metric];
  const up = trend.change > 0;
  return build(ctx, 'trend', {
    severity: 'attention',
    basis: 'personal-baseline',
    title: `${meta.label} drifting ${up ? 'upward' : 'downward'}`,
    explanation:
      `${meta.label} has moved ${up ? 'up' : 'down'} by about ${fmtSpread(metric, Math.abs(trend.change))} ${meta.unit} across the last ${trend.n} readings (${Math.round(trend.spanDays)} days). ` +
      `That is a steady change larger than ${TREND_SIGMAS} times your usual variation (±${fmtSpread(metric, baseline.sigma)}).`,
    evidence: {
      current: latest.value,
      baseline: baseline.median,
      deviation: latest.value - baseline.median,
      window: `last ${trend.n} readings`,
    },
  });
}