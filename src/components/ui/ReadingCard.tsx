import { differenceInHours, format, formatDistanceToNow, parseISO } from 'date-fns';
import { Clock, FlaskConical, Hand } from 'lucide-react';
import Sparkline from '@/components/charts/Sparkline';
import type { Measurement } from '@/types';

const STALE_AFTER_HOURS = 36;

interface Props {
  label: string;
  unit: string;
  latest?: Measurement;
  /** Second value shown as "a/b" (used for blood pressure). */
  pair?: Measurement;
  trend: number[];
}

const sourceLabel = { simulated: 'Simulated', manual: 'Manual entry', device: 'Device' } as const;

export default function ReadingCard({ label, unit, latest, pair, trend }: Props) {
  if (!latest) {
    return (
      <article className="panel p-4">
        <h3 className="label-caps">{label}</h3>
        <p className="mt-3 text-sm text-ink-muted">No reading recorded</p>
        <p className="mt-1 text-xs text-ink-faint">Missing data is not treated as normal.</p>
      </article>
    );
  }

  const taken = parseISO(latest.takenAt);
  const stale = differenceInHours(new Date(), taken) > STALE_AFTER_HOURS;
  const SourceIcon = latest.source === 'manual' ? Hand : FlaskConical;
  const value = pair ? `${latest.value}/${pair.value}` : String(latest.value);

  return (
    <article className="panel p-4 animate-fade-up">
      <h3 className="label-caps">{label}</h3>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value} <span className="text-sm font-normal text-ink-muted">{unit}</span>
      </p>

      <div className="mt-2">
        <Sparkline values={trend} label={`${label}: last ${trend.length} readings`} />
      </div>

      <dl className="mt-2 space-y-1 text-xs text-ink-faint">
        <div className="flex items-start gap-1.5">
          <Clock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Measured</dt>
          <dd>
            {format(taken, 'MMM d, h:mm a')} · {formatDistanceToNow(taken, { addSuffix: true })}
            {stale && <span className="ml-1.5 font-medium text-status-attention">(stale)</span>}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3 w-3" aria-hidden="true" />
          <dt className="sr-only">Source</dt>
          <dd>{sourceLabel[latest.source]}</dd>
        </div>
      </dl>
    </article>
  );
}