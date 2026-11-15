import { Line, LineChart } from 'recharts';

interface Props {
  values: number[];
  label: string;
}

export default function Sparkline({ values, label }: Props) {
  if (values.length < 2) {
    return <p className="text-[11px] text-ink-faint">Not enough data for a trend</p>;
  }
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div role="img" aria-label={label}>
      <LineChart width={120} height={32} data={data}>
        <Line type="monotone" dataKey="v" stroke="#22D3EE" strokeWidth={1.75} dot={false} isAnimationActive={false} />
      </LineChart>
    </div>
  );
}