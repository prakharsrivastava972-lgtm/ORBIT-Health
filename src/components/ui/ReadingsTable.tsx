import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { useDataStore } from '@/store/useDataStore';
import { CONTEXT_LABELS } from '@/utils/validation';
import type { AstronautProfile, Measurement, MetricKey } from '@/types';

const SHOW = 25;
const sourceLabel = { simulated: 'Simulated', manual: 'Manual entry', device: 'Device' } as const;

interface Props {
  profile: AstronautProfile;
  measurements: Measurement[];
}

export default function ReadingsTable({ profile, measurements }: Props) {
  const [filter, setFilter] = useState<MetricKey | 'all'>('all');
  const remove = useDataStore((s) => s.removeMeasurement);

  const rows = useMemo(
    () =>
      measurements
        .filter((m) => filter === 'all' || m.metric === filter)
        .sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
    [measurements, filter],
  );
  const visible = rows.slice(0, SHOW);

  return (
    <section className="panel p-5" aria-labelledby="table-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="table-heading" className="text-base font-semibold">
            Recorded readings
          </h2>
          <p className="mt-1 text-xs text-ink-faint">
            Showing {visible.length} of {rows.length}, newest first.
          </p>
        </div>
        <div>
          <label htmlFor="table-filter" className="sr-only">
            Filter by metric
          </label>
          <select
            id="table-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as MetricKey | 'all')}
            className="rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm hover:border-accent/50"
          >
            <option value="all">All metrics</option>
            {METRIC_KEYS.map((k) => (
              <option key={k} value={k}>
                {METRICS[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-lg border border-line/60 bg-space-900/60 p-4 text-sm text-ink-muted">
          No readings to show. Add one with the form, or choose a different metric.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Recorded readings for {profile.name}</caption>
            <thead>
              <tr className="label-caps border-b border-line/60">
                <th scope="col" className="py-2 pr-3 font-medium">Measured</th>
                <th scope="col" className="py-2 pr-3 font-medium">Metric</th>
                <th scope="col" className="py-2 pr-3 font-medium">Value</th>
                <th scope="col" className="py-2 pr-3 font-medium">Source</th>
                <th scope="col" className="py-2 pr-3 font-medium">Context</th>
                <th scope="col" className="py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => {
                const when = format(parseISO(m.takenAt), 'MMM d, yyyy h:mm a');
                return (
                  <tr key={m.id} className="border-b border-line/30 last:border-0">
                    <td className="py-2 pr-3 text-ink-muted">{when}</td>
                    <td className="py-2 pr-3">{METRICS[m.metric].label}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {m.value} <span className="text-ink-faint">{m.unit}</span>
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">{sourceLabel[m.source]}</td>
                    <td className="py-2 pr-3 text-ink-muted">{m.context ? CONTEXT_LABELS[m.context] : '—'}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(profile.id, m.id)}
                        aria-label={`Delete ${METRICS[m.metric].label} reading from ${when}`}
                        className="rounded-md p-1.5 text-ink-faint hover:bg-status-urgent/10 hover:text-status-urgent"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}