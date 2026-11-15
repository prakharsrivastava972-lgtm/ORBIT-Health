import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import AlertActions from '@/components/status/AlertActions';
import FlagCard from '@/components/status/FlagCard';
import StatusBadge from '@/components/status/StatusBadge';
import { applyAlertStates, summarizeAlerts, type AlertView } from '@/engine/alerts';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';
import { useAlertRecords, useAlertStore } from '@/store/useAlertStore';
import type { Severity } from '@/types';

const STATE_INFO: { state: Severity; text: string }[] = [
  { state: 'normal', text: 'No unresolved flags. This is not a medical clearance. It only means the rules found nothing to flag in the data entered.' },
  { state: 'attention', text: 'At least one flag is worth reviewing. Repeat measurements, note possible causes and mention it at your next flight-surgeon check-in.' },
  { state: 'urgent', text: 'At least one flag calls for prompt contact with the flight surgeon. Only a limit breach or a support request can cause this.' },
];

const STEPS: Record<Severity, string[]> = {
  urgent: [
    'If a reading triggered the flag and you feel well enough, repeat it once. If you feel unwell, do not wait: contact the flight surgeon first.',
    'Contact the flight surgeon using your mission medical procedures.',
    'If anyone is in immediate danger, follow your mission emergency procedures.',
    'Note what happened and when, so it can go into your medical report (Phase 11).',
  ],
  attention: [
    'Open each flag and read the evidence and the limits of what it can tell you.',
    'Repeat measurements under the same conditions and note anything that could explain the change.',
    'Mention it at your next flight-surgeon check-in. Contact them sooner if it persists, gets worse, or you feel unwell.',
  ],
  normal: [
    'No unresolved flags. Keep logging readings and your daily check-in so changes are noticed early.',
    'Missing or old data is listed above. It is never counted as normal.',
  ],
};

function AlertList({ views, profileId }: { views: AlertView[]; profileId: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {views.map((v) => (
        <div key={v.flag.id} className="space-y-2">
          <FlagCard flag={v.flag} />
          <AlertActions profileId={profileId} view={v} />
        </div>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const profile = useActiveProfile();
  const { evaluation, ready } = useEvaluation(profile);
  const records = useAlertRecords(profile);
  const clearRecord = useAlertStore((s) => s.clearRecord);

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Warning Center" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const summary = summarizeAlerts(applyAlertStates(evaluation.flags, records));
  const resolved = [...summary.resolved].sort((a, b) => (b.record?.at ?? '').localeCompare(a.record?.at ?? ''));

  return (
    <>
      <PageHeader
        title="Warning Center"
        description="Normal, Attention and Urgent states with escalation instructions."
      />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="panel p-5" aria-labelledby="astatus-heading" data-testid="alert-status" data-state={summary.state}>
          <h2 id="astatus-heading" className="label-caps">
            Overall alert status
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge state={summary.state} large />
            <p className="text-sm text-ink-muted">
              {summary.active.length} active · {summary.acknowledged.length} acknowledged · {summary.resolved.length} resolved
            </p>
          </div>
          {evaluation.dataNotes.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-status-attention">
              {evaluation.dataNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            This status counts active and acknowledged flags. Resolved flags are left out. Health Insights shows every
            flag the rules raise. Demo data is SIMULATED.
          </p>
          <dl className="mt-4 space-y-2">
            {STATE_INFO.map((s) => (
              <div key={s.state} className="flex items-start gap-3">
                <dt className="w-28 shrink-0">
                  <StatusBadge state={s.state} />
                </dt>
                <dd className="text-xs leading-relaxed text-ink-muted">{s.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-5" aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="label-caps !text-accent">
            What to do now
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
            {STEPS[summary.state].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-ink-faint">
            See{' '}
            <Link to="/recommendations" className="text-accent hover:underline">
              Recommendations
            </Link>{' '}
            for suggestions tied to each flag, and{' '}
            <Link to="/comms" className="text-accent hover:underline">
              Flight Surgeon Comms
            </Link>{' '}
            (simulated, Phase 11).
          </p>
        </section>
      </div>

      <section className="mt-6" aria-labelledby="active-heading">
        <h2 id="active-heading" className="label-caps mb-3">
          Active ({summary.active.length})
        </h2>
        {summary.active.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">No active alerts.</div>
        ) : (
          <AlertList views={summary.active} profileId={profile.id} />
        )}
      </section>

      <section className="mt-6" aria-labelledby="ack-heading">
        <h2 id="ack-heading" className="label-caps mb-3">
          Acknowledged ({summary.acknowledged.length})
        </h2>
        {summary.acknowledged.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-muted">None. Acknowledged flags still count toward the status.</div>
        ) : (
          <AlertList views={summary.acknowledged} profileId={profile.id} />
        )}
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="resolved-heading">
        <h2 id="resolved-heading" className="label-caps">
          Resolved ({resolved.length})
        </h2>
        {resolved.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nothing resolved yet.</p>
        ) : (
          <ul className="mt-2">
            {resolved.map((v) => (
              <li key={v.flag.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line/30 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{v.flag.title}</p>
                  <p className="text-xs text-ink-faint">
                    Resolved {v.record ? format(parseISO(v.record.at), 'MMM d, h:mm a') : ''}
                    {v.record?.note ? ` · Note: ${v.record.note}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => clearRecord(profile.id, v.flag.id)}
                  aria-label={`Reopen: ${v.flag.title}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 px-3 py-1.5 text-sm text-ink-muted hover:border-accent/50 hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reopen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}