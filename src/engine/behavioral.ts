import { differenceInCalendarDays, parseISO } from 'date-fns';
import { BEHAVIOR_DOMAINS, burden, type BehaviorDomain } from '@/data/checkin';
import type { CheckIn, Confidence, RiskFlag, Severity } from '@/types';
import { median } from './baselines';

export const BEHAVIOR_CURRENT_DAYS = 3;
export const RECENT_CHECKINS = 3;
export const MIN_BEHAVIOR_HISTORY = 10;
export const BEHAVIOR_BASELINE_MIN_TOTAL = MIN_BEHAVIOR_HISTORY + RECENT_CHECKINS;
export const BEHAVIOR_HISTORY_MAX = 28;
export const CONCERNING = 4;
export const MOST_CONCERNING = 5;
export const SHIFT_POINTS = 1.5;
export const MULTI_AREAS = 3;
export const SUSTAINED_WINDOW_DAYS = 7;

export interface BehavioralRule {
  id: string;
  name: string;
  description: string;
}

/** Shown on the Check-in page so every behavioral rule is visible. */
export const BEHAVIOR_RULES: BehavioralRule[] = [
  {
    id: 'support',
    name: 'Support request (Urgent)',
    description:
      'If the latest check-in asks to talk to someone, an Urgent flag is raised and stays until a newer check-in replaces it. It is never suppressed by the ratings.',
  },
  {
    id: 'sustained',
    name: 'Sustained concern (Attention)',
    description:
      'The last 3 check-ins, within 7 days, are all in the concerning range for one area: stress, fatigue or isolation rated 4 or 5, or mood or sleep quality rated 1 or 2.',
  },
  {
    id: 'extreme',
    name: 'Most concerning rating (Attention)',
    description: 'The latest check-in has stress, fatigue or isolation at 5, or mood or sleep quality at 1.',
  },
  {
    id: 'shift',
    name: 'Personal baseline shift (Attention)',
    description:
      'Needs 10 earlier check-ins plus the 3 most recent. Flags an area when the average of the last 3 is at least 1.5 points more concerning than the median of up to 28 earlier check-ins.',
  },
  {
    id: 'multi',
    name: 'Several areas at once (Attention)',
    description: 'Three or more areas are in the concerning range in the latest check-in.',
  },
  {
    id: 'fresh',
    name: 'Freshness',
    description:
      'Rules about the current state only apply when the latest check-in is 3 days old or less. Otherwise there is no current assessment and the page says so.',
  },
];

export interface BehavioralResult {
  flags: RiskFlag[];
  notes: string[];
  daysSinceLast: number | null;
}

const ESCALATION_ATTENTION =
  'Consider talking with a crewmate you trust, keeping routines for sleep, exercise and meals, and raising it at your next flight-surgeon or behavioral-health check-in. Contact them sooner if it persists or you feel worse.';
const ESCALATION_URGENT =
  'Contact the flight surgeon or behavioral health support now. If anyone is in immediate danger, follow your mission emergency procedures.';
const LIMITATIONS =
  'Self-reported ratings are subjective and vary from day to day. A flag only means ratings are at a fixed limit or differ from your own earlier ratings. It does not assess or diagnose any mental health condition.';

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const lc = (s: string) => s.toLowerCase();

/** Median concern score of earlier check-ins (excluding the 3 most recent). `sorted` must be oldest first. */
export function domainBaseline(sorted: CheckIn[], d: BehaviorDomain): number | null {
  const history = sorted.slice(0, Math.max(0, sorted.length - RECENT_CHECKINS)).slice(-BEHAVIOR_HISTORY_MAX);
  if (history.length < MIN_BEHAVIOR_HISTORY) return null;
  return median(history.map((c) => burden(d, c[d.key])));
}

export function evaluateBehavioral(checkIns: CheckIn[], now: Date = new Date()): BehavioralResult {
  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;
  if (n === 0) return { flags: [], notes: ['Behavioral check-in: none recorded.'], daysSinceLast: null };

  const latest = sorted[n - 1];
  const daysSinceLast = Math.max(0, differenceInCalendarDays(now, parseISO(latest.date)));
  const current = daysSinceLast <= BEHAVIOR_CURRENT_DAYS;
  const hasBaseline = n >= BEHAVIOR_BASELINE_MIN_TOTAL;

  const notes: string[] = [];
  const issues: string[] = [];
  if (!current) {
    issues.push(`Latest behavioral check-in is ${daysSinceLast} days old.`);
    notes.push(`Behavioral check-in: last entry was ${daysSinceLast} days ago, so there is no current assessment.`);
  }
  if (!hasBaseline) {
    issues.push(
      `Only ${n} check-in(s): not enough for a personal baseline (needs at least ${BEHAVIOR_BASELINE_MIN_TOTAL}). Fixed-scale rules only.`,
    );
  }
  if (n < 3) issues.push('Very few check-ins, so any comparison is uncertain.');

  const confidence: Confidence = n < 3 || !current ? 'low' : hasBaseline && n >= 17 && daysSinceLast <= 1 ? 'high' : 'medium';
  const staleHours = daysSinceLast * 24;

  const make = (
    id: string,
    severity: Severity,
    title: string,
    basis: RiskFlag['basis'],
    explanation: string,
    evidence: RiskFlag['evidence'],
  ): RiskFlag => ({
    id,
    metric: 'behavioral',
    severity,
    title,
    basis,
    explanation,
    evidence,
    confidence,
    dataQuality: { staleHours, sampleCount: n, issues },
    escalation: severity === 'urgent' ? ESCALATION_URGENT : ESCALATION_ATTENTION,
    limitations: LIMITATIONS,
  });

  const flags: RiskFlag[] = [];

  if (latest.requestsSupport) {
    flags.push(
      make(
        'behavioral:support',
        'urgent',
        'Support requested in latest check-in',
        'self-reported',
        `In your check-in for ${latest.date} you asked to talk to someone. This is always escalated, whatever the ratings were.`,
        { current: 1, window: 'latest check-in' },
      ),
    );
  }

  if (current) {
    const concerning: string[] = [];

    for (const d of BEHAVIOR_DOMAINS) {
      const burdens = sorted.map((c) => burden(d, c[d.key]));
      const raws = sorted.map((c) => c[d.key] as number);
      const lastB = burdens[n - 1];
      const lastRaw = raws[n - 1];
      const name = lc(d.label);
      const scale = `1 = ${lc(d.low)}, 5 = ${lc(d.high)}`;
      if (lastB >= CONCERNING) concerning.push(name);

      const recentB = burdens.slice(-RECENT_CHECKINS);
      const recentRaw = raws.slice(-RECENT_CHECKINS);
      const spanOk =
        n >= RECENT_CHECKINS &&
        differenceInCalendarDays(parseISO(latest.date), parseISO(sorted[n - RECENT_CHECKINS].date)) <= SUSTAINED_WINDOW_DAYS;
      const baseB = domainBaseline(sorted, d);

      if (spanOk && recentB.every((b) => b >= CONCERNING)) {
        flags.push(
          make(
            `behavioral:${d.key}:sustained`,
            'attention',
            `${d.label} rated in the concerning range for 3 check-ins`,
            'self-reported',
            `Your last 3 ${name} ratings were ${recentRaw.join(', ')} (${scale}), all in the concerning range. Fixed-scale rules like this are illustrative choices for this prototype, not a validated screening tool.`,
            { current: lastRaw, window: 'last 3 check-ins' },
          ),
        );
      } else if (lastB >= MOST_CONCERNING) {
        flags.push(
          make(
            `behavioral:${d.key}:extreme`,
            'attention',
            `${d.label} at the most concerning rating`,
            'self-reported',
            `Your latest ${name} rating is ${lastRaw} (${scale}), the most concerning end of the scale. Fixed-scale rules like this are illustrative choices for this prototype, not a validated screening tool.`,
            { current: lastRaw, window: 'latest check-in' },
          ),
        );
      } else if (baseB !== null && mean(recentB) - baseB >= SHIFT_POINTS) {
        const baseRaw = burden(d, baseB);
        const avgRaw = mean(recentRaw);
        flags.push(
          make(
            `behavioral:${d.key}:shift`,
            'attention',
            `${d.label} shifted from personal baseline`,
            'personal-baseline',
            `Your last 3 ${name} ratings average ${avgRaw.toFixed(1)}, compared with your personal baseline of ${baseRaw.toFixed(1)} (median of ${Math.min(BEHAVIOR_HISTORY_MAX, n - RECENT_CHECKINS)} earlier check-ins). That is a shift of ${Math.abs(avgRaw - baseRaw).toFixed(1)} points in the more concerning direction (${scale}).`,
            {
              current: lastRaw,
              baseline: baseRaw,
              deviation: lastRaw - baseRaw,
              window: `last 3 vs ${Math.min(BEHAVIOR_HISTORY_MAX, n - RECENT_CHECKINS)} earlier check-ins`,
            },
          ),
        );
      }
    }

    if (concerning.length >= MULTI_AREAS) {
      flags.push(
        make(
          'behavioral:multi',
          'attention',
          'Several wellbeing ratings in the concerning range',
          'self-reported',
          `${concerning.length} areas are in the concerning range in your latest check-in: ${concerning.join(', ')}. Several areas at once is worth discussing even if each rating alone is moderate.`,
          { current: concerning.length, window: 'latest check-in' },
        ),
      );
    }
  }

  return { flags, notes, daysSinceLast };
}