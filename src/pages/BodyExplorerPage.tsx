import { useState } from 'react';
import { Bone, Brain, Dumbbell, HeartPulse, Shield, Wind, type LucideIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import BodyMap from '@/components/body/BodyMap';
import SystemDetail from '@/components/body/SystemDetail';
import { BODY_SYSTEMS, type SystemId } from '@/data/systems';
import { useActiveProfile } from '@/store/useAppStore';
import { useMeasurements } from '@/store/useDataStore';

const ICONS: Record<SystemId, LucideIcon> = {
  cardiovascular: HeartPulse,
  skeletal: Bone,
  muscular: Dumbbell,
  immune: Shield,
  respiratory: Wind,
  nervous: Brain,
};

export default function BodyExplorerPage() {
  const profile = useActiveProfile();
  const { measurements, ready } = useMeasurements(profile);
  const [selected, setSelected] = useState<SystemId>('cardiovascular');
  const system = BODY_SYSTEMS.find((s) => s.id === selected) ?? BODY_SYSTEMS[0];

  return (
    <>
      <PageHeader
        title="Body Explorer"
        description="Interactive body map for six physiological systems and their spaceflight context."
      />
      {!ready ? (
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[19rem_1fr]">
          <section className="panel p-4" aria-label="Body map">
            <BodyMap selected={selected} onSelect={setSelected} />
            <p className="mt-1 text-center text-[11px] text-ink-faint">Schematic, not to scale. Click a highlighted area.</p>

            <div role="group" aria-label="Body systems" className="mt-4 grid grid-cols-2 gap-2">
              {BODY_SYSTEMS.map((s) => {
                const Icon = ICONS[s.id];
                const active = s.id === selected;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(s.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'border-accent/60 bg-accent/10 font-medium text-accent'
                        : 'border-line/60 text-ink-muted hover:border-accent/40 hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </section>

          <SystemDetail system={system} measurements={measurements} />
        </div>
      )}
    </>
  );
}