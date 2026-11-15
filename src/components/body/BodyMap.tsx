import type { ReactNode } from 'react';
import type { SystemId } from '@/data/systems';

interface Props {
  selected: SystemId;
  onSelect: (id: SystemId) => void;
}

interface HotspotProps {
  id: SystemId;
  label: string;
  selected: SystemId;
  onSelect: (id: SystemId) => void;
  children: ReactNode;
}

/** Mouse and touch target. Keyboard and screen-reader users use the system list beside the map. */
function Hotspot({ id, label, selected, onSelect, children }: HotspotProps) {
  const active = selected === id;
  return (
    <g
      data-testid={`hotspot-${id}`}
      onClick={() => onSelect(id)}
      opacity={active ? 1 : 0.5}
      className={`cursor-pointer transition-opacity hover:opacity-100 ${active ? 'text-accent' : 'text-ink-muted'}`}
    >
      <title>{label}</title>
      {children}
    </g>
  );
}

export default function BodyMap({ selected, onSelect }: Props) {
  const p = { selected, onSelect };
  return (
    <svg
      viewBox="0 0 200 420"
      aria-hidden="true"
      focusable="false"
      className="mx-auto h-[26rem] w-auto max-w-full"
    >
      {/* Schematic silhouette (not anatomically exact) */}
      <g className="text-space-600" fill="currentColor" fillOpacity={0.45} stroke="rgb(var(--line))" strokeWidth={1}>
        <circle cx={100} cy={40} r={22} />
        <rect x={90} y={58} width={20} height={14} rx={5} />
        <rect x={68} y={66} width={64} height={168} rx={24} />
        <rect x={50} y={76} width={16} height={130} rx={8} />
        <rect x={134} y={76} width={16} height={130} rx={8} />
        <rect x={72} y={228} width={26} height={172} rx={13} />
        <rect x={102} y={228} width={26} height={172} rx={13} />
      </g>

      <Hotspot id="nervous" label="Nervous system" {...p}>
        <ellipse cx={100} cy={39} rx={14} ry={12} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.5} />
        <line x1={100} y1={64} x2={100} y2={222} stroke="transparent" strokeWidth={16} />
        <line x1={100} y1={64} x2={100} y2={222} stroke="currentColor" strokeWidth={2.5} strokeDasharray="1 5" strokeLinecap="round" />
      </Hotspot>

      <Hotspot id="respiratory" label="Respiratory system" {...p}>
        <ellipse cx={82} cy={112} rx={15} ry={26} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.5} />
        <ellipse cx={118} cy={112} rx={15} ry={26} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.5} />
      </Hotspot>

      <Hotspot id="cardiovascular" label="Cardiovascular system" {...p}>
        <circle cx={106} cy={130} r={11} fill="currentColor" fillOpacity={0.4} stroke="currentColor" strokeWidth={1.5} />
        <path d="M106 141 L106 190 M106 190 L90 230 M106 190 L122 230" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </Hotspot>

      <Hotspot id="skeletal" label="Skeletal system" {...p}>
        <ellipse cx={100} cy={228} rx={24} ry={9} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.5} />
        {[90, 110].map((x) => (
          <g key={x}>
            <line x1={x} y1={240} x2={x} y2={390} stroke="transparent" strokeWidth={12} />
            <line x1={x} y1={240} x2={x} y2={390} stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
        {[58, 142].map((x) => (
          <g key={x}>
            <line x1={x} y1={90} x2={x} y2={200} stroke="transparent" strokeWidth={12} />
            <line x1={x} y1={90} x2={x} y2={200} stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
      </Hotspot>

      <Hotspot id="muscular" label="Muscular system" {...p}>
        {[60, 140].map((x) => (
          <circle key={x} cx={x} cy={84} r={8} fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth={1.5} />
        ))}
        {[79, 121].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={285} rx={7} ry={36} fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth={1.5} />
            <ellipse cx={x} cy={362} rx={6} ry={22} fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth={1.5} />
          </g>
        ))}
      </Hotspot>

      <Hotspot id="immune" label="Immune system (lymph node regions)" {...p}>
        {[
          [91, 70],
          [109, 70],
          [68, 104],
          [132, 104],
          [95, 245],
          [105, 245],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.5} fill="currentColor" fillOpacity={0.5} stroke="currentColor" strokeWidth={1.5} />
        ))}
      </Hotspot>
    </svg>
  );
}