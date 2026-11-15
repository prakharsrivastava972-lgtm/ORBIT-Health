import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import TrendChart from '@/components/charts/TrendChart';
import { BASIS_LABEL } from '@/components/status/labels';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { computeBaseline } from '@/engine/baselines';
import { GENERAL_REFERENCE_NOTE, isComparableContext, limitsFor } from '@/engine/referenceRanges';
import { useActiveProfile } from '@/store/useAppStore';
import { useMeasurements } from '@/store/useDataStore';
import { seriesFor } from '@/utils/series';
import { CONTEXT_LABELS } from '@/utils/validation';
import type { MetricKey } from '@/types';

type RangeKey = '7' | '14' | '30' | 'all';
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '7', label: '7 days', days: 7 },
  { key: '14', label: '14 days', days: 14 },
  { key: '30', label: '30 days', days: 30 },
  { key: 'all', label: 'All', days: 0 },
];
const sourceLabel = { simulated: 'Simulated', manual: 'Manual entry', device: 'Device' } as const;
const SHOW_ROWS = 60;

export default function HistoryPage() {
  const profile = useActiveProfile();
  const { measurements, ready } = useMeasurements(profile);
  const [metric, setMetric] = useState<MetricKey>('hr');
  const [range, setRange] = useState<RangeKey>('30');
  const [showLimits, setShowLimits] = useState(false);

  if (!ready) {
    return (
      <>
        <PageHeader title="History and Charts" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const meta = METRICS[metric];
  const days = RANGES.find((r) => r.key === range)?.days ?? 0;
  const cutoff = days === 0 ? 0 : Date.now() - days * 86400000;
  const all = seriesFor(measurements, metric);
  const inRange = all.filter((m) => new Date(m.takenAt).getTime() >= cutoff);
  const baseline = computeBaseline(all.filter((m) => isComparableContext(metric, m.context)), metric);

  const lim = limitsFor(metric, profile.thresholds);
  const hasLimits = !!lim.limits && (lim.limits.attentionLow !== undefined || lim.limits.attentionHigh !== undefined);
  const limits = hasLimits ? { low: lim.limits?.attentionLow, high: lim.limits?.attentionHigh } : null;

  const values = inRange.map((m) => m.value);
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const fmt = (n: number) => n.toFixed(meta.decimals);
  const latest = inRange[inRange.length - 1];
  const rows = [...inRange].reverse().slice(0, SHOW_ROWS);

  const summary = inRange.length
    ? `${meta.label}: ${inRange.length} readings from ${format(parseISO(inRange[0].takenAt), 'MMM d')} to ${format(parseISO(latest.takenAt), 'MMM d')}, ranging from ${fmt(Math.min(...values))} to ${fmt(Math.max(...values))} ${meta.unit}. The same values are in the table below.`
    : `${meta.label}: no readings in this range.`;

  const stats: [string, string][] = inRange.length
    ? [
        ['Readings', String(inRange.length)],
        ['Lowest', `${fmt(Math.min(...values))} ${meta.unit}`],
        ['Highest', `${fmt(Math.max(...values))} ${meta.unit}`],
        ['Average', `${fmt(mean)} ${meta.unit}`],
        ['Latest', `${fmt(latest.value)} ${meta.unit}`],
      ]
    : [];

  return (
    <>
      <PageHeader
        title="History and Charts"
        description="Interactive trend charts and historical records built from stored application data."
      />

      <section className="panel p-5" aria-labelledby="trend-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="trend-heading" className="text-base font-semibold">
              {meta.label} trend
            </h2>
            <p className="mt-1 text-xs text-ink-faint">Built only from readings stored for {profile.name}. Demo readings are SIMULATED.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="hist-metric" className="block text-xs text-ink-faint">
                Metric
              </label>
              <select
                id="hist-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as MetricKey)}
                className="rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm hover:border-accent/50"
              >
                {METRIC_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {METRICS[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div role="group" aria-label="Date range" className="flex gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={range === r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    range === r.key
                      ? 'border-accent/60 bg-accent/10 font-medium text-accent'
                      : 'border-line/60 text-ink-muted hover:border-accent/40 hover:text-ink'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {inRange.length === 0 ? (
            <p className="rounded-lg border border-line/60 bg-space-900/60 p-4 text-sm text-ink-muted">
              No readings in this range. Choose a longer range or add readings on the Biometrics page.
            </p>
          ) : (
            <TrendChart
              readings={inRange}
              unit={meta.unit}
              name={meta.label}
              summary={summary}
              baseline={baseline}
              limits={showLimits ? limits : null}
            />
          )}
        </div>

        <div className="mt-3 space-y-2 text-xs text-ink-faint">
          <p>
            {baseline
              ? `Shaded band: your personal baseline ${fmt(baseline.median)} ± ${baseline.sigma.toFixed(Math.max(meta.decimals, 1))} ${meta.unit}, from ${baseline.n} earlier readings. Readings tagged after exercise or after a meal are left out of the baseline where the rules exclude them.`
              : 'No personal baseline band yet (needs 13 or more usable readings).'}
          </p>
          {hasLimits ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={showLimits}
                onChange={(e) => setShowLimits(e.target.checked)}
                className="h-4 w-4 accent-[rgb(34,211,238)]"
              />
              Show {BASIS_LABEL[lim.basis].toLowerCase()} attention limits
            </label>
          ) : (
            <p>No general reference limit is defined for this metric. Personal baseline only.</p>
          )}
          {showLimits && hasLimits && lim.basis === 'general-reference' && <p>{GENERAL_REFERENCE_NOTE}</p>}
        </div>

        {stats.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line/60 bg-space-900/60 p-3">
                <dt className="label-caps !text-[10px]">{k}</dt>
                <dd className="mt-1 text-sm font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="hist-table-heading">
        <h2 id="hist-table-heading" className="text-base font-semibold">
          Records
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Showing {rows.length} of {inRange.length} readings in range, newest first.
        </p>
        {rows.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line/60 bg-space-900/60 p-4 text-sm text-ink-muted">Nothing to show.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">
                {meta.label} readings for {profile.name}
              </caption>
              <thead>
                <tr className="label-caps border-b border-line/60">
                  <th scope="col" className="py-2 pr-3 font-medium">Measured</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Value</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Source</th>
                  <th scope="col" className="py-2 font-medium">Context</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-b border-line/30 last:border-0">
                    <td className="py-2 pr-3 text-ink-muted">{format(parseISO(m.takenAt), 'MMM d, yyyy h:mm a')}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {m.value} <span className="text-ink-faint">{m.unit}</span>
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">{sourceLabel[m.source]}</td>
                    <td className="py-2 text-ink-muted">{m.context ? CONTEXT_LABELS[m.context] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}