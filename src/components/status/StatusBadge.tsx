import { AlertTriangle, CheckCircle2, Minus, Siren, type LucideIcon } from 'lucide-react';
import type { Severity } from '@/types';

export type BadgeState = Severity | 'no-data';

const CONFIG: Record<BadgeState, { label: string; Icon: LucideIcon; cls: string }> = {
  normal: { label: 'Normal', Icon: CheckCircle2, cls: 'border-status-normal/40 bg-status-normal/10 text-status-normal' },
  attention: {
    label: 'Attention',
    Icon: AlertTriangle,
    cls: 'border-status-attention/40 bg-status-attention/10 text-status-attention',
  },
  urgent: { label: 'Urgent', Icon: Siren, cls: 'border-status-urgent/40 bg-status-urgent/10 text-status-urgent' },
  'no-data': { label: 'No data', Icon: Minus, cls: 'border-line/60 bg-space-700/40 text-ink-muted' },
};

/** Status is always icon + text, never color alone. */
export default function StatusBadge({ state, large = false }: { state: BadgeState; large?: boolean }) {
  const { label, Icon, cls } = CONFIG[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${cls} ${
        large ? 'px-3 py-1.5 text-base' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <Icon className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {label}
    </span>
  );
}