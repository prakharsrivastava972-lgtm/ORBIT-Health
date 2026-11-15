import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/status/StatusBadge';
import { applyAlertStates, summarizeAlerts } from '@/engine/alerts';
import { CATEGORY_LABEL, CATEGORY_ORDER, ROUTINE, buildRecommendations, type RecCategory } from '@/engine/recommendations';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';
import { useAlertRecords } from '@/store/useAlertStore';

const chip = 'inline-flex rounded-md border border-line/60 px-2 py-0.5 text-[11px] text-ink-muted';

export default function RecommendationsPage() {
  const profile = useActiveProfile();
  const { evaluation, ready } = useEvaluation(profile);
  const records = useAlertRecords(profile);
  const [filter, setFilter] = useState<RecCategory | 'all'>('all');

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Recommendations" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const flags = summarizeAlerts(applyAlertStates(evaluation.flags, records)).unresolved.map((v) => v.flag);
  const titles = new Map(flags.map((f) => [f.id, f.title]));
  const recs = buildRecommendations(flags);
  const shown = filter === 'all' ? recs : recs.filter((r) => r.category === filter);
  const routine = filter === 'all' ? ROUTINE : ROUTINE.filter((r) => r.category === filter);
  const count = (c: RecCategory) => recs.filter((r) => r.category === c).length;

  const options: { key: RecCategory | 'all'; label: string }[] = [
    { key: 'all', label: `All (${recs.length})` },
    ...CATEGORY_ORDER.map((c) => ({ key: c, label: `${CATEGORY_LABEL[c]} (${count(c)})` })),
  ];

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Suggestions for exercise, nutrition, hydration, sleep, stress management and escalation."
      />

      <p className="mb-4 rounded-lg border border-line/60 bg-space-900/60 p-3 text-xs leading-relaxed text-ink-muted">
        General wellbeing suggestions written for this prototype. They are not medical advice and not NASA guidance, and
        they set no doses or targets. Your mission procedures and your flight surgeon always take precedence.
      </p>

      <div role="group" aria-label="Filter by category" className="mb-5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={filter === o.key}
            onClick={() => setFilter(o.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              filter === o.key
                ? 'border-accent/60 bg-accent/10 font-medium text-accent'
                : 'border-line/60 text-ink-muted hover:border-accent/40 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <section aria-labelledby="triggered-heading">
        <h2 id="triggered-heading" className="label-caps mb-3">
          Suggestions from your current flags
        </h2>
        {recs.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">
            No suggestions are triggered right now because there are no unresolved flags. The general routine below
            always applies.
          </div>
        ) : shown.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">No triggered suggestions in this category.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {shown.map((r) => (
              <article key={r.id} className="panel p-5 animate-fade-up">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{r.title}</h3>
                  <StatusBadge state={r.priority} />
                </div>
                <p className="mt-2">
                  <span className={chip}>{CATEGORY_LABEL[r.category]}</span>
                </p>
                <p className="mt-3 text-sm text-ink-muted">{r.detail}</p>
                <p className="mt-3 text-xs text-ink-faint">
                  Why you are seeing this: {r.triggeredBy.map((id) => titles.get(id) ?? id).join('; ')}.{' '}
                  <Link to="/alerts" className="text-accent hover:underline">
                    Open the Warning Center
                  </Link>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6" aria-labelledby="routine-heading">
        <h2 id="routine-heading" className="label-caps mb-1">
          General routine (not triggered by a flag)
        </h2>
        <p className="mb-3 text-xs text-ink-faint">Always shown. Follow the plan set by your flight surgeon.</p>
        {routine.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">No routine items in this category.</div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {routine.map((r) => (
              <li key={r.id} className="panel p-4">
                <p className="text-sm font-medium">{r.title}</p>
                <p className="mt-1">
                  <span className={chip}>{CATEGORY_LABEL[r.category]}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{r.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}