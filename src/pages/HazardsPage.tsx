import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Atom, Box, ClipboardList, Orbit, Satellite, ShieldAlert, Users, type LucideIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import FlagCard from '@/components/status/FlagCard';
import StatusBadge from '@/components/status/StatusBadge';
import { ENVIRONMENT_IDS, ENVIRONMENT_LABEL, environmentFor, type EnvironmentId } from '@/data/hazards';
import { BODY_SYSTEMS, REFERENCE_LABEL } from '@/data/systems';
import { assessHazards, type HazardView } from '@/engine/hazards';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useActiveProfile } from '@/store/useAppStore';
import type { HazardId } from '@/types';

const ICONS: Record<HazardId, LucideIcon> = {
  radiation: Atom,
  microgravity: Orbit,
  'isolation-confinement': Users,
  'distance-from-earth': Satellite,
  'closed-environment': Box,
};

const chip = 'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium';

function ListChip({ view }: { view: HazardView }) {
  if (view.content.measurable === false) {
    return <span className={`${chip} border-accent-blue/40 bg-accent-blue/10 text-accent-blue`}>Not measurable here</span>;
  }
  if (view.state === 'none') {
    return <span className={`${chip} border-line/60 text-ink-muted`}>No related flags</span>;
  }
  return <StatusBadge state={view.state} />;
}

export default function HazardsPage() {
  const profile = useActiveProfile();
  const { evaluation, ready } = useEvaluation(profile);
  const [selected, setSelected] = useState<HazardId>('radiation');
  const [override, setOverride] = useState<{ id: string; env: EnvironmentId } | null>(null);

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Hazard Monitor" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const ownEnv = environmentFor(profile);
  const env = override && override.id === profile.id ? override.env : ownEnv;
  const views = assessHazards(evaluation, env);
  const view = views.find((v) => v.content.id === selected) ?? views[0];
  const h = view.content;
  const systems = BODY_SYSTEMS.filter((s) => h.relatedSystems.includes(s.id));

  return (
    <>
      <PageHeader
        title="Hazard Monitor"
        description="Radiation, microgravity, isolation and confinement, distance from Earth, and closed environment."
      />

      <p className="mb-4 rounded-lg border border-line/60 bg-space-900/60 p-3 text-xs leading-relaxed text-ink-muted">
        Hazards are exposures, not diagnoses. A hazard with no related flags does not mean there is no exposure, because
        most hazard effects cannot be seen in ordinary vitals. General educational context, not NASA guidance.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-[18rem_1fr]">
        <section className="panel p-4" aria-label="Hazards">
          <div role="group" aria-label="Hazards" className="space-y-2">
            {views.map((v) => {
              const Icon = ICONS[v.content.id];
              const active = v.content.id === selected;
              return (
                <button
                  key={v.content.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(v.content.id)}
                  className={`flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-line/60 text-ink-muted hover:border-accent/40 hover:text-ink'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {v.content.label}
                  </span>
                  <ListChip view={v} />
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-4" aria-live="polite">
          <section className="panel p-5" aria-labelledby="hazard-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="hazard-heading" className="text-xl font-semibold tracking-tight">
                  {h.label}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-ink-muted">{h.summary}</p>
              </div>
              <span className={`${chip} gap-1.5 border-accent-blue/40 bg-accent-blue/10 !px-2.5 !py-1 !text-xs text-accent-blue`}>
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                {h.measurable === false ? 'Effects not measurable from ordinary vitals' : 'Some effects partly reflected by vitals'}
              </span>
            </div>
          </section>

          <section className="panel p-5" aria-labelledby="exposure-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 id="exposure-heading" className="label-caps !text-accent">
                Exposure context
              </h3>
              <div>
                <label htmlFor="env-select" className="text-xs text-ink-faint">
                  Mission environment to view
                </label>
                <select
                  id="env-select"
                  value={env}
                  onChange={(e) => setOverride({ id: profile.id, env: e.target.value as EnvironmentId })}
                  className="ml-2 rounded-lg border border-line/60 bg-space-900 px-3 py-1.5 text-sm hover:border-accent/50"
                >
                  {ENVIRONMENT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {ENVIRONMENT_LABEL[id]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{h.byEnvironment[env]}</p>
            <p className="mt-2 text-xs text-ink-faint">
              {profile.callsign}&apos;s simulated mission environment: {ENVIRONMENT_LABEL[ownEnv]}.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
              {h.effects.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {systems.length > 0 && (
              <p className="mt-3 text-xs text-ink-faint">
                Related body systems: {systems.map((s) => s.label).join(', ')}. See the{' '}
                <Link to="/body" className="text-accent hover:underline">
                  Body Explorer
                </Link>
                .
              </p>
            )}
          </section>

          <section aria-labelledby="related-flags-heading">
            <h3 id="related-flags-heading" className="label-caps mb-3">
              Related flags from the engine
            </h3>
            {view.flags.length === 0 ? (
              <div className="panel p-5 text-sm text-ink-muted">
                {h.relatedMetrics.length === 0 && h.relatedBehavior.length === 0
                  ? 'No app signal is linked to this hazard, so no flags can appear here. This is not evidence of no exposure.'
                  : 'No related flags right now. This is not evidence of no exposure.'}
              </div>
            ) : (
              <div className="grid gap-4">
                {view.flags.map((f) => (
                  <FlagCard key={f.id} flag={f} />
                ))}
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">{h.dataGap}</p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="panel p-5" aria-labelledby="cant-heading">
              <h3 id="cant-heading" className="label-caps !text-accent-blue">
                What ordinary vitals cannot tell you
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
                {h.cannotMeasure.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
            <section className="panel p-5" aria-labelledby="needs-heading">
              <div className="flex items-center gap-2 text-accent-blue">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                <h3 id="needs-heading" className="label-caps !text-accent-blue">
                  Dedicated assessments needed
                </h3>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
                {view.assessment.requiredAssessments.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-faint">Discuss any concern with the flight surgeon.</p>
            </section>
          </div>

          <section className="panel p-5" aria-labelledby="counter-heading">
            <h3 id="counter-heading" className="label-caps">
              General countermeasure context
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
              {h.countermeasures.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <p className="text-[11px] leading-relaxed text-ink-faint">
            General educational summary written for this prototype. It is not NASA guidance and does not diagnose.
            Individual responses vary. Sources to verify before citing (unverified until Phase 15):{' '}
            {h.references.map((r) => REFERENCE_LABEL[r] ?? r).join('; ')}.
          </p>
        </div>
      </div>
    </>
  );
}