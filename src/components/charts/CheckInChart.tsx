import { format, parseISO } from 'date-fns';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BehaviorDomain } from '@/data/checkin';
import type { CheckIn } from '@/types';

interface Props {
  checkIns: CheckIn[];
  domain: BehaviorDomain;
  /** Personal baseline on the same 1-5 rating scale, or null when history is too short. */
  baseline: number | null;
}

export default function CheckInChart({ checkIns, domain, baseline }: Props) {
  const data = checkIns.slice(-30).map((c) => ({ label: format(parseISO(c.date), 'MMM d'), value: c[domain.key] }));

  if (data.length < 2) {
    return <p className="text-sm text-ink-muted">Not enough check-ins for a chart yet (needs at least 2).</p>;
  }

  return (
    <div
      role="img"
      aria-label={`${domain.label} ratings over the last ${data.length} check-ins, on a 1 to 5 scale where 1 is ${domain.low.toLowerCase()} and 5 is ${domain.high.toLowerCase()}. The same values are in the table below.`}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#283C69" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke="#6A7A99" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#6A7A99" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#0D1730', border: '1px solid #283C69', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#9CABC7' }}
          />
          {baseline !== null && (
            <ReferenceLine
              y={baseline}
              stroke="#60A5FA"
              strokeDasharray="5 4"
              label={{ value: 'Personal baseline', fill: '#60A5FA', fontSize: 11, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            name={domain.label}
            stroke="#22D3EE"
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}