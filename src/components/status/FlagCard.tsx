import { METRICS } from '@/data/metrics';
import type { MetricKey, RiskFlag } from '@/types';
import StatusBadge from './StatusBadge';
import { BASIS_LABEL, CONFIDENCE_LABEL } from './labels';

export default function FlagCard({ flag }: { flag: RiskFlag }) {
  const meta = flag.metric in METRICS ? METRICS[flag.metric as MetricKey] : undefined;
  const unit = meta ? ` ${meta.unit}` : '';
  const n = (v: number) => `${Number(v.toFixed(2))}${unit}`;
  const e = flag.evidence;

  const rows: [string, string][] = [['Current value', n(e.current)]];
  if (e.baseline !== undefined) rows.push(['Personal baseline', n(e.baseline)]);
  if (e.deviation !== undefined) rows.push(['Difference from baseline', `${e.deviation > 0 ? '+' : ''}${n(e.deviation)}`]);
  rows.push(['Compared over', e.window]);
  rows.push(['Age of latest reading', `${flag.dataQuality.staleHours} h`]);
  rows.push(['Usable readings', String(flag.dataQuality.sampleCount)]);

  return (
    <article className="panel p-5 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{flag.title}</h3>
        <StatusBadge state={flag.severity} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-md border border-accent-blue/40 bg-accent-blue/10 px-2 py-0.5 text-accent-blue">
          Basis: {BASIS_LABEL[flag.basis]}
        </span>
        <span className="rounded-md border border-line/60 px-2 py-0.5 text-ink-muted">
          {CONFIDENCE_LABEL[flag.confidence]}
        </span>
      </div>

      <p className="mt-3 text-sm text-ink-muted">{flag.explanation}</p>

      <div className="mt-3 rounded-lg border border-line/60 bg-space-900/60 p-3">
        <p className="label-caps">Suggested next step</p>
        <p className="mt-1 text-sm">{flag.escalation}</p>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-accent">Evidence, data quality and limits</summary>
        <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-line/30 py-1">
              <dt className="text-ink-faint">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {flag.dataQuality.issues.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-status-attention">
            {flag.dataQuality.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          <span className="font-medium text-ink">What this cannot tell you: </span>
          {flag.limitations}
        </p>
      </details>
    </article>
  );
}