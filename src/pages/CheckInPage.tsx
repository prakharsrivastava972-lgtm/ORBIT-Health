import { useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { BookOpen, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CheckInForm from '@/components/forms/CheckInForm';
import CheckInChart from '@/components/charts/CheckInChart';
import FlagCard from '@/components/status/FlagCard';
import StatusBadge, { type BadgeState } from '@/components/status/StatusBadge';
import { BEHAVIOR_DOMAINS, burden, type DomainKey } from '@/data/checkin';
import { BEHAVIOR_CURRENT_DAYS, BEHAVIOR_RULES, domainBaseline } from '@/engine/behavioral';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

export default function CheckInPage() {
  const profile = useActiveProfile();
  const { evaluation, checkIns, ready } = useEvaluation(profile);
  const removeCheckIn = useDataStore((s) => s.removeCheckIn);
  const [domainKey, setDomainKey] = useState<DomainKey>('stress');

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Behavioral Check-in" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const daysSince = last ? Math.max(0, differenceInCalendarDays(new Date(), parseISO(last.date))) : null;
  const current = daysSince !== null && daysSince <= BEHAVIOR_CURRENT_DAYS;

  const flags = evaluation.flags.filter((f) => f.metric === 'behavioral');
  const state: BadgeState = flags.some((f) => f.severity === 'urgent')
    ? 'urgent'
    : flags.length > 0
      ? 'attention'
      : current
        ? 'normal'
        : 'no-data';

  const domain = BEHAVIOR_DOMAINS.find((d) => d.key === domainKey) ?? BEHAVIOR_DOMAINS[0];
  const baseB = domainBaseline(sorted, domain);
  const baselineRaw = baseB === null ? null : burden(domain, baseB);
  const rows = sorted.slice(-14).reverse();

  return (
    <>
      <PageHeader
        title="Behavioral Check-in"
        description="Daily check-in for mood, stress, fatigue, isolation and sleep quality."
      />

      <div className="grid items-start gap-4 xl:grid-cols-[28rem_1fr]">
        <CheckInForm key={profile.id} profile={profile} />

        <div className="space-y-4">
          <section className="panel p-5" aria-labelledby="bstatus-heading" data-testid="behavior-status">
            <h2 id="bstatus-heading" className="label-caps">
              Behavioral status
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge state={state} large />
              <p className="text-sm text-ink-muted">
                {!last
                  ? 'No check-ins yet. Complete one to start behavioral tracking.'
                  : daysSince === 0
                    ? `Last check-in: today (${sorted.length} on record).`
                    : `Last check-in: ${last.date}, ${daysSince} day${daysSince === 1 ? '' : 's'} ago (${sorted.length} on record).`}
              </p>
            </div>
            {last && !current && (
              <p className="mt-3 text-xs text-status-attention">
                The latest check-in is more than {BEHAVIOR_CURRENT_DAYS} days old, so there is no current assessment.
              </p>
            )}
            <p className="mt-3 text-xs text-ink-faint">
              Ratings are self-reported. Flags compare them with fixed limits and with your own earlier ratings. They do not diagnose anything. Demo check-ins are SIMULATED.
            </p>
          </section>

          <section aria-labelledby="bflags-heading">
            <h2 id="bflags-heading" className="label-caps mb-3">
              Behavioral flags
            </h2>
            {flags.length === 0 ? (
              <div className="panel p-5 text-sm text-ink-muted">No behavioral flags raised by the current rules.</div>
            ) : (
              <div className="grid gap-4">
                {flags.map((f) => (
                  <FlagCard key={f.id} flag={f} />
                ))}
              </div>
            )}
          </section>

          <section className="panel p-5" aria-labelledby="chart-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="chart-heading" className="text-base font-semibold">
                Ratings over time
              </h2>
              <div>
                <label htmlFor="chart-domain" className="sr-only">
                  Rating to chart
                </label>
                <select
                  id="chart-domain"
                  value={domainKey}
                  onChange={(e) => setDomainKey(e.target.value as DomainKey)}
                  className="rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm hover:border-accent/50"
                >
                  {BEHAVIOR_DOMAINS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <CheckInChart checkIns={sorted} domain={domain} baseline={baselineRaw} />
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              {baselineRaw === null
                ? 'No personal baseline line yet (needs 13 or more check-ins).'
                : `Dashed line: your personal baseline for ${domain.label.toLowerCase()} (${baselineRaw.toFixed(1)}).`}
            </p>
          </section>
        </div>
      </div>

      <section className="panel mt-6 p-5" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-base font-semibold">
          Recent check-ins
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Showing {rows.length} of {sorted.length}, newest first. Ratings are 1 to 5. See the scale under each question.
        </p>
        {rows.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line/60 bg-space-900/60 p-4 text-sm text-ink-muted">
            No check-ins to show yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Recent behavioral check-ins for {profile.name}</caption>
              <thead>
                <tr className="label-caps border-b border-line/60">
                  <th scope="col" className="py-2 pr-3 font-medium">Date</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Mood</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Stress</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Fatigue</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Isolation</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Sleep quality</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Notes</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-line/30 last:border-0">
                    <td className="py-2 pr-3 text-ink-muted">{format(parseISO(c.date), 'MMM d, yyyy')}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.mood}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.stress}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.fatigue}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.isolation}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.sleepQuality}</td>
                    <td className="max-w-[14rem] py-2 pr-3 text-ink-muted">
                      {c.requestsSupport && <span className="mr-1.5 font-medium text-status-urgent">Support requested.</span>}
                      <span className="break-words">{c.notes ?? (c.requestsSupport ? '' : '—')}</span>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeCheckIn(profile.id, c.id)}
                        aria-label={`Delete check-in from ${c.date}`}
                        className="rounded-md p-1.5 text-ink-faint hover:bg-status-urgent/10 hover:text-status-urgent"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="brules-heading">
        <div className="flex items-center gap-2 text-accent">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <h2 id="brules-heading" className="label-caps !text-accent">
            How behavioral flags work
          </h2>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {BEHAVIOR_RULES.map((r) => (
            <li key={r.id} className="rounded-lg border border-line/60 bg-space-900/60 p-3">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{r.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          These fixed-scale rules are illustrative choices for this prototype. They are not a validated screening questionnaire and do not assess or diagnose any mental health condition. A flight surgeon or behavioral health specialist should set the real criteria.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          If anyone is in immediate danger, follow your mission emergency procedures.
        </p>
      </section>
    </>
  );
}