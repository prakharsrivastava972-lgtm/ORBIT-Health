import { Link } from 'react-router-dom';
import { differenceInHours, parseISO } from 'date-fns';
import { Info, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ProfileCard from '@/components/ui/ProfileCard';
import MissionClock from '@/components/ui/MissionClock';
import ReadingCard from '@/components/ui/ReadingCard';
import StatusBadge from '@/components/status/StatusBadge';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';
import { useAlertRecords } from '@/store/useAlertStore';
import { useTaskStore } from '@/store/useTaskStore';
import { summarizeTasks } from '@/engine/tasks';
import { applyAlertStates, summarizeAlerts } from '@/engine/alerts';
import { latestFor, seriesFor } from '@/utils/series';
import type { MetricKey } from '@/types';

interface CardSpec {
  key: MetricKey;
  label: string;
  pair?: MetricKey;
}

const CARDS: CardSpec[] = [
  { key: 'hr', label: 'Resting heart rate' },
  { key: 'sbp', label: 'Blood pressure', pair: 'dbp' },
  { key: 'tempC', label: 'Body temperature' },
  { key: 'glucose', label: 'Blood glucose (fasting)' },
  { key: 'spo2', label: 'Blood oxygen (SpO2)' },
  { key: 'sleepHrs', label: 'Sleep (last night)' },
  { key: 'hydrationL', label: 'Fluid intake' },
  { key: 'weightKg', label: 'Body weight' },
];

const FRESH_HOURS = 36;

export default function OverviewPage() {
  const profile = useActiveProfile();
  const { measurements, checkIns, evaluation, ready } = useEvaluation(profile);
  const regenerate = useDataStore((s) => s.regenerate);
  const alertRecords = useAlertRecords(profile);
  const selfDone = useTaskStore((s) => s.done[profile.id]);

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Mission Overview" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const fresh = METRIC_KEYS.filter((k) => {
    const l = latestFor(measurements, k);
    return l && differenceInHours(new Date(), parseISO(l.takenAt)) <= FRESH_HOURS;
  });
  const alertSummary = summarizeAlerts(applyAlertStates(evaluation.flags, alertRecords));
  const topFlags = alertSummary.unresolved.map((v) => v.flag).slice(0, 3);
  const taskSummary = summarizeTasks({
    measurements,
    checkIns,
    selfDone: selfDone ?? {},
    launchDate: profile.mission.launchDate,
    plannedDays: profile.mission.plannedDays,
    now: new Date(),
  });

  return (
    <>
      <PageHeader
        title="Mission Overview"
        description="Latest readings, mission clock and data status for the selected astronaut."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProfileCard profile={profile} />
        <MissionClock profile={profile} />

        <section
          className="panel p-5 md:col-span-2 xl:col-span-1"
          aria-labelledby="summary-heading"
          data-testid="overview-status"
        >
          <div className="flex items-center gap-2 text-accent">
            <Info className="h-4 w-4" aria-hidden="true" />
            <h2 id="summary-heading" className="label-caps !text-accent">
              Health summary
            </h2>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge state={alertSummary.state} large />
            <p className="text-sm text-ink-muted">
              {alertSummary.unresolved.length === 0
                ? 'No flags raised'
                : `${alertSummary.unresolved.length} unresolved flag${alertSummary.unresolved.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <p className="mt-3 text-sm">
            <span className="text-xl font-semibold tabular-nums">{fresh.length}</span>
            <span className="text-ink-muted">
              {' '}
              of {METRIC_KEYS.length} metrics updated in the last {FRESH_HOURS} h
            </span>
          </p>
          {evaluation.incomplete && (
            <p className="mt-2 text-xs text-status-attention">
              Some data is missing or old, so this status is incomplete.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Rule-based comparison, not a diagnosis.{' '}
            <Link to="/insights" className="text-accent underline-offset-2 hover:underline">
              View health insights
            </Link>
          </p>
        </section>
      </div>

      <section className="mt-6" aria-labelledby="readings-heading">
        <h2 id="readings-heading" className="label-caps mb-3">
          Latest readings (trend: last 14 readings)
        </h2>
        {measurements.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">
            No readings yet for this astronaut. Use{' '}
            <Link to="/biometrics" className="text-accent hover:underline">
              Biometrics
            </Link>{' '}
            to add one.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CARDS.map(({ key, label, pair }) => (
              <ReadingCard
                key={key}
                label={label}
                unit={METRICS[key].unit}
                latest={latestFor(measurements, key)}
                pair={pair ? latestFor(measurements, pair) : undefined}
                trend={seriesFor(measurements, key, 14).map((m) => m.value)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Alerts and tasks">
        <div className="panel p-5">
          <h2 className="label-caps">Active alerts</h2>
          {topFlags.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">No flags raised by the current rules.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topFlags.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{f.title}</span>
                  <StatusBadge state={f.severity} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Full explanations are on{' '}
            <Link to="/insights" className="text-accent hover:underline">
              Health Insights
            </Link>
            . Acknowledge and resolve them in the{' '}
            <Link to="/alerts" className="text-accent hover:underline">
              Warning Center
            </Link>
            .
          </p>
        </div>
        <div className="panel p-5">
          <h2 className="label-caps">Today&apos;s tasks</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {taskSummary.doneCount} of {taskSummary.tasks.length} tasks done today · {taskSummary.points} points · {taskSummary.streak}-day streak. See the{' '}
            <Link to="/tasks" className="text-accent hover:underline">
              Daily Tasks
            </Link>{' '}
            page.
          </p>
        </div>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-faint">
        <p>All readings above are SIMULATED demonstration data generated on this device.</p>
        <button
          type="button"
          onClick={() => regenerate(profile)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 px-3 py-1.5 text-ink-muted hover:border-accent/50 hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Regenerate simulated data
        </button>
      </footer>
    </>
  );
}