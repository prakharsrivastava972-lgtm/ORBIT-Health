import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { BookOpen } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/status/StatusBadge';
import FlagCard from '@/components/status/FlagCard';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { BASELINE_MIN_TOTAL } from '@/engine/baselines';
import type { EvaluationResult } from '@/engine/evaluate';
import { GENERAL_REFERENCE_NOTE } from '@/engine/referenceRanges';
import { RULES } from '@/engine/rules';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function bannerText(e: EvaluationResult): string {
  const urgent = e.flags.filter((f) => f.severity === 'urgent').length;
  const attention = e.flags.filter((f) => f.severity === 'attention').length;
  if (urgent > 0) {
    const extra = attention > 0 ? ` and ${plural(attention, 'attention flag')}` : '';
    return `${plural(urgent, 'urgent flag')}${extra}. Follow the suggested steps and contact the flight surgeon.`;
  }
  if (attention > 0) return `${plural(attention, 'attention flag')}. Review the suggested steps below.`;
  if (e.incomplete) return 'No flags raised, but some data is missing or old, so this picture is incomplete.';
  return 'No flags raised by the rules. This is not a medical clearance.';
}

export default function InsightsPage() {
  const profile = useActiveProfile();
  const { evaluation, ready } = useEvaluation(profile);

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Health Insights" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Health Insights"
        description="Explainable comparison of current readings with personal baselines and general reference ranges."
      />

      <section className="panel p-5" aria-labelledby="overall-heading" data-testid="overall-status">
        <h2 id="overall-heading" className="label-caps">
          Overall status
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge state={evaluation.overall} large />
          <p className="text-sm text-ink-muted">{bannerText(evaluation)}</p>
        </div>
        {evaluation.dataNotes.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-status-attention">
            {evaluation.dataNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-faint">
          Flags compare numbers with limits and with your own history. They do not diagnose anything. Demo readings are SIMULATED.
        </p>
      </section>

      <section className="mt-6" aria-labelledby="flags-heading">
        <h2 id="flags-heading" className="label-caps mb-3">
          Risk flags
        </h2>
        {evaluation.flags.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">
            No flags raised. If readings are missing, add them on the{' '}
            <Link to="/biometrics" className="text-accent hover:underline">
              Biometrics
            </Link>{' '}
            page.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {evaluation.flags.map((f) => (
              <FlagCard key={f.id} flag={f} />
            ))}
          </div>
        )}
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="text-base font-semibold">
          Every metric at a glance
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Status, latest reading, baseline and confidence for each metric</caption>
            <thead>
              <tr className="label-caps border-b border-line/60">
                <th scope="col" className="py-2 pr-3 font-medium">Metric</th>
                <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                <th scope="col" className="py-2 pr-3 font-medium">Latest</th>
                <th scope="col" className="py-2 pr-3 font-medium">Personal baseline</th>
                <th scope="col" className="py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_KEYS.map((key) => {
                const a = evaluation.metrics[key];
                const meta = METRICS[key];
                return (
                  <tr key={key} className="border-b border-line/30 last:border-0">
                    <th scope="row" className="py-2 pr-3 font-normal">{meta.label}</th>
                    <td className="py-2 pr-3"><StatusBadge state={a.state} /></td>
                    <td className="py-2 pr-3 text-ink-muted">
                      {a.latest
                        ? `${a.latest.value} ${meta.unit} · ${formatDistanceToNow(parseISO(a.latest.takenAt), { addSuffix: true })}`
                        : 'No usable reading'}
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">
                      {a.baseline
                        ? `${a.baseline.median.toFixed(meta.decimals)} ± ${a.baseline.sigma.toFixed(Math.max(meta.decimals, 1))} ${meta.unit}`
                        : a.latest
                          ? `No baseline (needs ${BASELINE_MIN_TOTAL}+ readings)`
                          : '—'}
                    </td>
                    <td className="py-2 capitalize text-ink-muted">{a.quality ? a.quality.confidence : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="rules-heading">
        <div className="flex items-center gap-2 text-accent">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <h2 id="rules-heading" className="label-caps !text-accent">
            How the rules work
          </h2>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {RULES.map((r) => (
            <li key={r.id} className="rounded-lg border border-line/60 bg-space-900/60 p-3">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="mt-1 text-[11px] text-ink-faint">
                Basis: {r.basisLabel} · Highest severity: {r.cap}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">{r.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">{GENERAL_REFERENCE_NOTE}</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Bone density loss, immune dysfunction and radiation injury cannot be measured from these vitals. See the Body Explorer for the dedicated assessments they need.
        </p>
      </section>
    </>
  );
}