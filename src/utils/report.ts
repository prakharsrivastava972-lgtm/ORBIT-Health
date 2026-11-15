import { format, parseISO } from 'date-fns';
import { BEHAVIOR_DOMAINS } from '@/data/checkin';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { BASIS_LABEL, CONFIDENCE_LABEL } from '@/components/status/labels';
import type { AlertSummary, AlertView } from '@/engine/alerts';
import type { EvaluationResult } from '@/engine/evaluate';
import { missionDay } from '@/utils/met';
import type { AstronautProfile, CheckIn, Severity } from '@/types';

export const STATE_LABEL: Record<Severity | 'no-data', string> = {
  normal: 'Normal',
  attention: 'Attention',
  urgent: 'Urgent',
  'no-data': 'No data',
};

const SOURCE_LABEL = { simulated: 'Simulated', manual: 'Manual entry', device: 'Device' } as const;

export interface ReportFlag {
  title: string;
  severity: Severity;
  basis: string;
  confidence: string;
  explanation: string;
  escalation: string;
  limitations: string;
  status: 'active' | 'acknowledged' | 'resolved';
  note?: string;
}

export interface ReportMetricRow {
  label: string;
  state: string;
  latest: string;
  measured: string;
  source: string;
  baseline: string;
  confidence: string;
}

export interface Report {
  generatedAt: string;
  name: string;
  callsign: string;
  age: number;
  sex: string;
  mission: string;
  location: string;
  day: number;
  plannedDays: number;
  conditions: string;
  overall: Severity;
  incomplete: boolean;
  dataNotes: string[];
  unresolved: ReportFlag[];
  resolved: ReportFlag[];
  metrics: ReportMetricRow[];
  behavior: {
    count: number;
    lastDate: string | null;
    latest: { label: string; rating: number }[];
    averages: { label: string; avg: string }[] | null;
    supportRequested: boolean;
  };
}

const flagLine = (v: AlertView): ReportFlag => ({
  title: v.flag.title,
  severity: v.flag.severity,
  basis: BASIS_LABEL[v.flag.basis],
  confidence: CONFIDENCE_LABEL[v.flag.confidence],
  explanation: v.flag.explanation,
  escalation: v.flag.escalation,
  limitations: v.flag.limitations,
  status: v.status,
  note: v.record?.note,
});

export function buildReport(
  profile: AstronautProfile,
  evaluation: EvaluationResult,
  summary: AlertSummary,
  checkIns: CheckIn[],
  now: Date = new Date(),
): Report {
  const metrics: ReportMetricRow[] = METRIC_KEYS.map((key) => {
    const a = evaluation.metrics[key];
    const meta = METRICS[key];
    return {
      label: meta.label,
      state: STATE_LABEL[a.state],
      latest: a.latest ? `${a.latest.value} ${meta.unit}` : 'No usable reading',
      measured: a.latest ? format(parseISO(a.latest.takenAt), 'MMM d, yyyy h:mm a') : '—',
      source: a.latest ? SOURCE_LABEL[a.latest.source] : '—',
      baseline: a.baseline
        ? `${a.baseline.median.toFixed(meta.decimals)} ± ${a.baseline.sigma.toFixed(Math.max(meta.decimals, 1))} ${meta.unit}`
        : 'No personal baseline',
      confidence: a.quality ? CONFIDENCE_LABEL[a.quality.confidence] : '—',
    };
  });

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const recent = sorted.slice(-7);

  return {
    generatedAt: format(now, 'MMM d, yyyy h:mm a'),
    name: profile.name,
    callsign: profile.callsign,
    age: profile.age,
    sex: profile.sex,
    mission: profile.mission.name,
    location: profile.mission.location,
    day: missionDay(profile.mission.launchDate, now),
    plannedDays: profile.mission.plannedDays,
    conditions: profile.conditions.length ? profile.conditions.join(', ') : 'none declared',
    overall: summary.state,
    incomplete: evaluation.incomplete,
    dataNotes: evaluation.dataNotes,
    unresolved: summary.unresolved.map(flagLine),
    resolved: summary.resolved.map(flagLine),
    metrics,
    behavior: {
      count: sorted.length,
      lastDate: last ? last.date : null,
      latest: last ? BEHAVIOR_DOMAINS.map((d) => ({ label: d.label, rating: last[d.key] })) : [],
      averages:
        recent.length >= 3
          ? BEHAVIOR_DOMAINS.map((d) => ({
              label: d.label,
              avg: (recent.reduce((s, c) => s + c[d.key], 0) / recent.length).toFixed(1),
            }))
          : null,
      supportRequested: !!last?.requestsSupport,
    },
  };
}

export const REPORT_DISCLAIMER =
  'Prepared from SIMULATED demonstration data. Not a medical record and not a diagnosis. Flags compare numbers with limits and with the astronaut\u2019s own history.';
export const REPORT_LIMITS =
  'Ordinary vital signs and check-in ratings cannot measure bone density loss, immune dysfunction or radiation injury. Those need dedicated assessments (for example bone-density scanning, clinical blood tests, dosimetry and medical review). General reference limits are illustrative, not astronaut-specific medical thresholds and not NASA values.';

function flagText(f: ReportFlag): string[] {
  return [
    `- [${STATE_LABEL[f.severity]}] ${f.title} (${f.status})`,
    `  Basis: ${f.basis}. ${f.confidence}.`,
    `  ${f.explanation}`,
    `  Suggested next step: ${f.escalation}`,
    ...(f.note ? [`  Resolution note: ${f.note}`] : []),
  ];
}

export function reportToText(r: Report): string {
  const lines: string[] = [
    'ORBIT HEALTH: CREW HEALTH SUMMARY',
    'SIMULATED DEMONSTRATION DATA',
    REPORT_DISCLAIMER,
    '',
    `Generated: ${r.generatedAt}`,
    `Astronaut: ${r.name} (${r.callsign}), age ${r.age}, sex ${r.sex}`,
    `Mission: ${r.mission}, ${r.location}`,
    `Mission elapsed time: day ${r.day} of ${r.plannedDays}`,
    `Declared conditions (informational): ${r.conditions}`,
    '',
    `OVERALL STATUS: ${STATE_LABEL[r.overall]}${r.incomplete ? ' (incomplete: some data missing or old)' : ''}`,
    '',
    `UNRESOLVED FLAGS (${r.unresolved.length})`,
    ...(r.unresolved.length ? r.unresolved.flatMap(flagText) : ['None.']),
    '',
    `RESOLVED FLAGS (${r.resolved.length})`,
    ...(r.resolved.length ? r.resolved.flatMap(flagText) : ['None.']),
    '',
    'LATEST READINGS',
    ...r.metrics.map(
      (m) => `- ${m.label}: ${m.latest} (${m.measured}, ${m.source}). Status: ${m.state}. Baseline: ${m.baseline}. ${m.confidence}.`,
    ),
    '',
    'BEHAVIORAL CHECK-IN (self-reported, 1 to 5)',
    ...(r.behavior.lastDate
      ? [
          `Last check-in: ${r.behavior.lastDate} (${r.behavior.count} on record).`,
          `Latest ratings: ${r.behavior.latest.map((l) => `${l.label} ${l.rating}`).join(', ')}.`,
          ...(r.behavior.averages ? [`Average of last up to 7: ${r.behavior.averages.map((l) => `${l.label} ${l.avg}`).join(', ')}.`] : []),
          ...(r.behavior.supportRequested ? ['Support requested in the latest check-in.'] : []),
        ]
      : ['No check-ins recorded.']),
    '',
    'DATA QUALITY NOTES',
    ...(r.dataNotes.length ? r.dataNotes.map((n) => `- ${n}`) : ['None.']),
    '',
    'LIMITS OF THIS REPORT',
    REPORT_LIMITS,
  ];
  return lines.join('\n');
}

/** Short summary used when attaching a report to a message. */
export function shortSummary(r: Report): string {
  const lines = [
    `${r.name} (${r.callsign}), mission day ${r.day}. SIMULATED data.`,
    `Status: ${STATE_LABEL[r.overall]} (${r.unresolved.length} unresolved flag${r.unresolved.length === 1 ? '' : 's'}).`,
    ...r.unresolved.slice(0, 5).map((f) => `- ${f.title} (${STATE_LABEL[f.severity]})`),
    r.incomplete ? 'Some data is missing or old.' : 'Data complete for the main metrics.',
  ];
  return lines.join('\n');
}