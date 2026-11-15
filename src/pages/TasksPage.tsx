import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Circle, Flame, Lock, Star } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { summarizeTasks } from '@/engine/tasks';
import { useActiveProfile } from '@/store/useAppStore';
import { useCheckIns, useMeasurements } from '@/store/useDataStore';
import { useTaskStore } from '@/store/useTaskStore';
import type { TaskCategory } from '@/types';

const EMPTY: Record<string, string[]> = {};

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  exercise: 'Exercise',
  nutrition: 'Nutrition',
  hydration: 'Hydration',
  sleep: 'Sleep',
  wellbeing: 'Wellbeing',
  measurement: 'Measurement',
};

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border border-line/60 px-3 py-1.5 text-sm text-ink-muted hover:border-accent/50 hover:text-ink';

export default function TasksPage() {
  const profile = useActiveProfile();
  const { measurements, ready } = useMeasurements(profile);
  const checkIns = useCheckIns(profile);
  const selfDone = useTaskStore((s) => s.done[profile.id]) ?? EMPTY;
  const setDone = useTaskStore((s) => s.setDone);

  const summary = useMemo(
    () =>
      summarizeTasks({
        measurements,
        checkIns,
        selfDone,
        launchDate: profile.mission.launchDate,
        plannedDays: profile.mission.plannedDays,
        now: new Date(),
      }),
    [measurements, checkIns, selfDone, profile],
  );

  if (!ready) {
    return (
      <>
        <PageHeader title="Daily Tasks" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const earned = summary.milestones.filter((m) => m.earned).length;

  return (
    <>
      <PageHeader
        title="Daily Tasks"
        description="Daily health tasks with points, streaks and mission milestones."
      />

      <p className="mb-4 rounded-lg border border-line/60 bg-space-900/60 p-3 text-xs leading-relaxed text-ink-muted">
        Points and badges reward logging, not results. A reading is never better or worse for points. Measurement and check-in
        tasks complete themselves when you save a matching entry dated today. Points include simulated demo entries.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="panel p-5" aria-label="Points">
          <p className="label-caps flex items-center gap-2">
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            Points
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums" data-testid="points">
            {summary.points}
          </p>
          <p className="text-xs text-ink-faint">+{summary.todayPoints} today</p>
        </section>
        <section className="panel p-5" aria-label="Streak">
          <p className="label-caps flex items-center gap-2">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            Streak
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums" data-testid="streak">
            {summary.streak} <span className="text-base font-normal text-ink-muted">day{summary.streak === 1 ? '' : 's'}</span>
          </p>
          <p className="text-xs text-ink-faint">
            Check-in and a vital logged each day. Longest: {summary.longestStreak}.
          </p>
        </section>
        <section className="panel p-5" aria-label="Today">
          <p className="label-caps">Today</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums" data-testid="task-progress">
            {summary.doneCount} of {summary.tasks.length} <span className="text-base font-normal text-ink-muted">tasks done today</span>
          </p>
          <p className="text-xs text-ink-faint">{summary.date}</p>
        </section>
      </div>

      <section className="mt-6" aria-labelledby="today-heading">
        <h2 id="today-heading" className="label-caps mb-3">
          Today&apos;s tasks
        </h2>
        <ul className="space-y-2">
          {summary.tasks.map((t) => (
            <li
              key={t.def.id}
              data-testid={`task-${t.def.id}`}
              data-done={t.done}
              className="panel flex flex-wrap items-center gap-3 p-4"
            >
              {t.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-status-normal" aria-hidden="true" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.def.title}</p>
                <p className="text-xs text-ink-faint">
                  {CATEGORY_LABEL[t.def.category]} · +{t.def.points} points · {t.done ? 'Done' : 'To do'}
                </p>
              </div>
              {t.def.kind === 'self' ? (
                t.done ? (
                  <button
                    type="button"
                    onClick={() => setDone(profile.id, summary.date, t.def.id, false)}
                    aria-label={`Undo: ${t.def.title}`}
                    className={btn}
                  >
                    Undo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDone(profile.id, summary.date, t.def.id, true)}
                    aria-label={`Mark done: ${t.def.title}`}
                    className={btn}
                  >
                    Mark done
                  </button>
                )
              ) : t.done ? (
                <span className="text-xs text-ink-faint">Completed from your logged data</span>
              ) : (
                <Link to={t.def.where ?? '/biometrics'} className={btn}>
                  Log it
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6" aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="label-caps mb-3">
          Mission milestones ({earned} of {summary.milestones.length})
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.milestones.map((m) => (
            <li
              key={m.id}
              data-testid={`milestone-${m.id}`}
              data-earned={m.earned}
              className={`panel flex items-start gap-3 p-4 ${m.earned ? '' : 'opacity-70'}`}
            >
              {m.earned ? (
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {m.label} <span className="text-xs font-normal text-ink-faint">({m.earned ? 'Earned' : 'Locked'})</span>
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">{m.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}