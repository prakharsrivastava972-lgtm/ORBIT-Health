import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, Printer, Radio } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/status/StatusBadge';
import { applyAlertStates, summarizeAlerts } from '@/engine/alerts';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';
import { useAlertRecords } from '@/store/useAlertStore';
import { REPORT_DISCLAIMER, REPORT_LIMITS, STATE_LABEL, buildReport, reportToText, type Report, type ReportFlag } from '@/utils/report';

const btn =
  'inline-flex items-center gap-2 rounded-lg border border-line/60 px-3 py-2 text-sm text-ink-muted hover:border-accent/50 hover:text-ink';

function FlagBlock({ f }: { f: ReportFlag }) {
  return (
    <li className="border-b border-line/30 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge state={f.severity} />
        <p className="text-sm font-medium">{f.title}</p>
        <span className="text-xs text-ink-faint">({f.status})</span>
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        Basis: {f.basis}. {f.confidence}.
      </p>
      <p className="mt-1 text-sm text-ink-muted">{f.explanation}</p>
      <p className="mt-1 text-sm">
        <span className="font-medium">Suggested next step: </span>
        <span className="text-ink-muted">{f.escalation}</span>
      </p>
      {f.note && (
        <p className="mt-1 text-xs text-ink-muted">
          <span className="font-medium">Resolution note: </span>
          {f.note}
        </p>
      )}
    </li>
  );
}

export default function ReportsPage() {
  const profile = useActiveProfile();
  const { evaluation, checkIns, ready } = useEvaluation(profile);
  const records = useAlertRecords(profile);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const report: Report | null = useMemo(() => {
    if (!evaluation) return null;
    const summary = summarizeAlerts(applyAlertStates(evaluation.flags, records));
    return buildReport(profile, evaluation, summary, checkIns, new Date());
  }, [evaluation, records, profile, checkIns]);

  if (!ready || !report) {
    return (
      <>
        <PageHeader title="Reports" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const copy = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(reportToText(report));
      setMessage('Report text copied to the clipboard.');
    } catch {
      setMessage(null);
      setError('Could not copy. Use Download or Print instead.');
    }
  };

  const download = () => {
    setError(null);
    try {
      const blob = new Blob([reportToText(report)], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbit-health-summary-${profile.callsign.toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Report downloaded as a text file.');
    } catch {
      setMessage(null);
      setError('Could not download. Use Copy or Print instead.');
    }
  };

  return (
    <>
      <div className="no-print">
        <PageHeader title="Reports" description="Printable medical summary for review by a flight surgeon." />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => window.print()} className={btn}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </button>
          <button type="button" onClick={copy} className={btn}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy text
          </button>
          <button type="button" onClick={download} className={btn}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download .txt
          </button>
          <Link to="/comms" className={btn}>
            <Radio className="h-4 w-4" aria-hidden="true" />
            Share via simulated Comms
          </Link>
        </div>
        {message && (
          <p role="status" className="mb-3 text-sm text-status-normal">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-3 text-sm text-status-urgent">
            {error}
          </p>
        )}
      </div>

      <article className="report-sheet panel p-6" data-testid="report-sheet" aria-label="Crew health summary report">
        <div className="border-b border-line/60 pb-4">
          <p className="label-caps">ORBIT Health · Crew health summary</p>
          <h2 className="mt-1 text-xl font-semibold">
            {report.name} ({report.callsign})
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Age {report.age} · Sex {report.sex} · Mission day {report.day} of {report.plannedDays}
          </p>
          <p className="text-sm text-ink-muted">
            {report.mission} · {report.location}
          </p>
          <p className="text-xs text-ink-faint">
            Generated {report.generatedAt} · Declared conditions (informational): {report.conditions}
          </p>
          <p className="mt-3 rounded-md border border-status-attention/40 px-3 py-2 text-xs font-medium text-status-attention">
            SIMULATED DEMONSTRATION DATA. {REPORT_DISCLAIMER}
          </p>
        </div>

        <section className="mt-5" aria-labelledby="r-status">
          <h3 id="r-status" className="label-caps">
            Overall status
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge state={report.overall} large />
            <p className="text-sm text-ink-muted">
              {STATE_LABEL[report.overall]}
              {report.incomplete ? ' (incomplete: some data is missing or old)' : ''}. Counts unresolved flags only.
            </p>
          </div>
        </section>

        <section className="mt-5" aria-labelledby="r-unres">
          <h3 id="r-unres" className="label-caps">
            Unresolved flags ({report.unresolved.length})
          </h3>
          {report.unresolved.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">None.</p>
          ) : (
            <ul className="mt-1">
              {report.unresolved.map((f) => (
                <FlagBlock key={f.title} f={f} />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5" aria-labelledby="r-res">
          <h3 id="r-res" className="label-caps">
            Resolved flags ({report.resolved.length})
          </h3>
          {report.resolved.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">None.</p>
          ) : (
            <ul className="mt-1">
              {report.resolved.map((f) => (
                <FlagBlock key={f.title} f={f} />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5" aria-labelledby="r-metrics">
          <h3 id="r-metrics" className="label-caps">
            Latest readings
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-xs">
              <caption className="sr-only">Latest reading, status and baseline for each metric</caption>
              <thead>
                <tr className="label-caps border-b border-line/60">
                  <th scope="col" className="py-2 pr-3 font-medium">Metric</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Latest</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Measured</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Source</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Baseline</th>
                  <th scope="col" className="py-2 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {report.metrics.map((m) => (
                  <tr key={m.label} className="border-b border-line/30 last:border-0">
                    <th scope="row" className="py-2 pr-3 font-normal">{m.label}</th>
                    <td className="py-2 pr-3 tabular-nums">{m.latest}</td>
                    <td className="py-2 pr-3 text-ink-muted">{m.measured}</td>
                    <td className="py-2 pr-3 text-ink-muted">{m.source}</td>
                    <td className="py-2 pr-3">{m.state}</td>
                    <td className="py-2 pr-3 text-ink-muted">{m.baseline}</td>
                    <td className="py-2 text-ink-muted">{m.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5" aria-labelledby="r-behavior">
          <h3 id="r-behavior" className="label-caps">
            Behavioral check-in (self-reported, 1 to 5)
          </h3>
          {report.behavior.lastDate ? (
            <div className="mt-2 space-y-1 text-sm text-ink-muted">
              <p>
                Last check-in {report.behavior.lastDate} ({report.behavior.count} on record).
              </p>
              <p>Latest ratings: {report.behavior.latest.map((l) => `${l.label} ${l.rating}`).join(', ')}.</p>
              {report.behavior.averages && (
                <p>Average of last up to 7: {report.behavior.averages.map((l) => `${l.label} ${l.avg}`).join(', ')}.</p>
              )}
              {report.behavior.supportRequested && <p className="font-medium">Support requested in the latest check-in.</p>}
              <p className="text-xs text-ink-faint">
                Higher is more concerning for stress, fatigue and isolation. Higher is better for mood and sleep quality.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">No check-ins recorded.</p>
          )}
        </section>

        <section className="mt-5" aria-labelledby="r-notes">
          <h3 id="r-notes" className="label-caps">
            Data quality notes
          </h3>
          {report.dataNotes.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">None.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {report.dataNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5" aria-labelledby="r-limits">
          <h3 id="r-limits" className="label-caps">
            Limits of this report
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{REPORT_LIMITS}</p>
        </section>
      </article>
    </>
  );
}