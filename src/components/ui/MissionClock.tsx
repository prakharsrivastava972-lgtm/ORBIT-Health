import { Rocket } from 'lucide-react';
import type { AstronautProfile } from '@/types';
import { missionDay, missionProgress } from '@/utils/met';

export default function MissionClock({ profile }: { profile: AstronautProfile }) {
  const { launchDate, plannedDays, location } = profile.mission;
  const day = missionDay(launchDate);
  const pct = missionProgress(launchDate, plannedDays);
  const remaining = Math.max(0, plannedDays - day);

  return (
    <section className="panel p-5" aria-labelledby="clock-heading">
      <div className="flex items-center gap-2 text-accent-blue">
        <Rocket className="h-4 w-4" aria-hidden="true" />
        <h2 id="clock-heading" className="label-caps !text-accent-blue">
          Mission elapsed time
        </h2>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">
        Day {day} <span className="text-base font-normal text-ink-muted">of {plannedDays}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Mission elapsed"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-3 h-2 overflow-hidden rounded-full bg-space-700"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        {pct}% complete · {remaining} days remaining
      </p>
      <p className="mt-1 text-xs text-ink-faint">Location: {location}</p>
    </section>
  );
}