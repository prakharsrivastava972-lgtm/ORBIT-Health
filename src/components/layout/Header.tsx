import { Menu } from 'lucide-react';
import ProfileSelector from './ProfileSelector';
import { useActiveProfile } from '@/store/useAppStore';
import { missionDay, missionProgress } from '@/utils/met';

interface Props {
  navOpen: boolean;
  onMenuClick: () => void;
}

export default function Header({ navOpen, onMenuClick }: Props) {
  const profile = useActiveProfile();
  const { name, launchDate, plannedDays } = profile.mission;
  const day = missionDay(launchDate);
  const pct = missionProgress(launchDate, plannedDays);

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-space-900/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
          aria-controls="primary-nav-panel"
          className="rounded-lg border border-line/60 p-2 text-ink-muted hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="label-caps">Mission</p>
          <p className="truncate text-sm font-medium">{name}</p>
        </div>

        <div className="hidden w-44 md:block">
          <p className="text-xs text-ink-muted">
            MET: Day {day} of {plannedDays}
          </p>
          <div
            role="progressbar"
            aria-label="Mission progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-space-700"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <span className="hidden rounded-md border border-status-attention/40 bg-status-attention/10 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-status-attention sm:inline-flex">
          Simulated data
        </span>

        <ProfileSelector />
      </div>
    </header>
  );
}