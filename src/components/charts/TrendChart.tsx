import { format, parseISO } from 'date-fns';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Measurement } from '@/types';

interface Props {
  readings: Measurement[];
  unit: string;
  name: string;
  summary: string;
  baseline: { median: number; sigma: number } | null;
  limits: { low?: number; high?: number } | null;
}

export default function TrendChart({ readings, unit, name, summary, baseline, limits }: Props) {
  const data = readings.map((m) => ({
    label: format(parseISO(m.takenAt), 'MMM d'),
    full: format(parseISO(m.takenAt), 'MMM d, h:mm a'),
    value: m.value,
  }));

  if (data.length < 2) {
    return <p className="text-sm text-ink-muted">Not enough readings in this range for a chart (needs at least 2).</p>;
  }

  return (
    <div role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#283C69" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke="#6A7A99" tick={{ fontSize: 11 }} minTickGap={28} />
          <YAxis stroke="#6A7A99" tick={{ fontSize: 11 }} domain={['auto', 'auto']} unit={` ${unit}`} width={64} />
          <Tooltip
            contentStyle={{ background: '#0D1730', border: '1px solid #283C69', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#9CABC7' }}
            labelFormatter={(_label: unknown, payload: readonly unknown[]) => {
              const first = payload?.[0] as { payload?: { full?: string } } | undefined;
              return first?.payload?.full ?? '';
            }}
            formatter={(v) => [`${v} ${unit}`, name]}
          />
          {baseline && (
            <ReferenceArea
              y1={baseline.median - baseline.sigma}
              y2={baseline.median + baseline.sigma}
              fill="#60A5FA"
              fillOpacity={0.12}
              ifOverflow="extendDomain"
            />
          )}
          {baseline && (
            <ReferenceLine
              y={baseline.median}
              stroke="#60A5FA"
              strokeDasharray="5 4"
              ifOverflow="extendDomain"
              label={{ value: 'Personal baseline', fill: '#60A5FA', fontSize: 11, position: 'insideTopRight' }}
            />
          )}
          {limits?.high !== undefined && (
            <ReferenceLine
              y={limits.high}
              stroke="#E8B038"
              strokeDasharray="2 4"
              ifOverflow="extendDomain"
              label={{ value: 'Attention limit (high)', fill: '#E8B038', fontSize: 11, position: 'insideBottomRight' }}
            />
          )}
          {limits?.low !== undefined && (
            <ReferenceLine
              y={limits.low}
              stroke="#E8B038"
              strokeDasharray="2 4"
              ifOverflow="extendDomain"
              label={{ value: 'Attention limit (low)', fill: '#E8B038', fontSize: 11, position: 'insideTopRight' }}
            />
          )}
          <Line type="monotone" dataKey="value" name={name} stroke="#22D3EE" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}