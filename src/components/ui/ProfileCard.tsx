import { UserRound } from 'lucide-react';
import type { AstronautProfile } from '@/types';

export default function ProfileCard({ profile }: { profile: AstronautProfile }) {
  const rows: [string, string][] = [
    ['Age', String(profile.age)],
    ['Sex', profile.sex],
    ['Height', `${profile.heightCm} cm`],
    ['Weight', `${profile.weightKg} kg`],
  ];
  return (
    <section className="panel p-5" aria-labelledby="profile-heading">
      <div className="flex items-start gap-3">
        <div className="rounded-full border border-accent/40 bg-accent/10 p-2.5 text-accent">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 id="profile-heading" className="truncate text-base font-semibold">
            {profile.name}
          </h2>
          <p className="text-sm text-ink-muted">Callsign: {profile.callsign}</p>
        </div>
        {profile.isSimulated && (
          <span className="ml-auto shrink-0 rounded-md border border-status-attention/40 bg-status-attention/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-status-attention">
            Simulated
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-4 gap-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="label-caps !text-[10px]">{k}</dt>
            <dd className="mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs text-ink-faint">
        Declared conditions (informational only): {profile.conditions.length ? profile.conditions.join(', ') : 'none'}
      </p>
    </section>
  );
}