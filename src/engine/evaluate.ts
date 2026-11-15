import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { seriesFor } from '@/utils/series';
import type { AstronautProfile, CheckIn, Confidence, Measurement, MetricKey, RiskFlag, Severity } from '@/types';
import { computeBaseline, type Baseline } from './baselines';
import { evaluateBehavioral } from './behavioral';
import { STALE_HOURS, assessQuality, type Quality } from './dataQuality';
import { isComparableContext } from './referenceRanges';
import { baselineRule, limitRule, trendRule, type RuleContext } from './rules';

export interface MetricAssessment {
  metric: MetricKey;
  state: Severity | 'no-data';
  latest?: Measurement;
  baseline: Baseline | null;
  quality?: Quality;
  /** Readings left out because of their context. */
  excluded: number;
}

export interface EvaluationResult {
  evaluatedAt: string;
  flags: RiskFlag[];
  metrics: Record<MetricKey, MetricAssessment>;
  overall: Severity;
  /** True when any metric has no usable reading or an old one, or check-ins are missing or old. */
  incomplete: boolean;
  dataNotes: string[];
}

const SEVERITY_RANK: Record<Severity, number> = { normal: 0, attention: 1, urgent: 2 };
const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

/** Pass `checkIns` to include behavioral rules. Leave it out to evaluate vitals only. */
export function evaluate(
  profile: AstronautProfile,
  all: Measurement[],
  now: Date = new Date(),
  checkIns?: CheckIn[],
): EvaluationResult {
  const flags: RiskFlag[] = [];
  const metrics = {} as Record<MetricKey, MetricAssessment>;
  const dataNotes: string[] = [];

  for (const metric of METRIC_KEYS) {
    const series = seriesFor(all, metric);
    const readings = series.filter((m) => isComparableContext(metric, m.context));
    const excluded = series.length - readings.length;

    if (readings.length === 0) {
      metrics[metric] = { metric, state: 'no-data', baseline: null, excluded };
      dataNotes.push(`${METRICS[metric].label}: no usable reading.`);
      continue;
    }

    const latest = readings[readings.length - 1];
    const baseline = computeBaseline(readings, metric);
    const quality = assessQuality({ latest, sampleCount: readings.length, baseline, excluded, now });
    const ctx: RuleContext = { metric, latest, readings, baseline, quality, thresholds: profile.thresholds };

    const found: (RiskFlag | null)[] = [limitRule(ctx)];
    const baselineFlag = baselineRule(ctx);
    found.push(baselineFlag);
    if (!baselineFlag) found.push(trendRule(ctx));

    const metricFlags = found.filter((f): f is RiskFlag => f !== null);
    flags.push(...metricFlags);

    const state = metricFlags.reduce<Severity>(
      (acc, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc),
      'normal',
    );
    metrics[metric] = { metric, state, latest, baseline, quality, excluded };

    if (quality.staleHours > STALE_HOURS) {
      dataNotes.push(`${METRICS[metric].label}: latest usable reading is ${quality.staleHours} h old.`);
    }
  }

  if (checkIns) {
    const behavioral = evaluateBehavioral(checkIns, now);
    flags.push(...behavioral.flags);
    dataNotes.push(...behavioral.notes);
  }

  flags.sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] ||
      a.id.localeCompare(b.id),
  );

  const overall = flags.reduce<Severity>(
    (acc, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc),
    'normal',
  );

  return { evaluatedAt: now.toISOString(), flags, metrics, overall, incomplete: dataNotes.length > 0, dataNotes };
}