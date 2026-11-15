import { useState } from 'react';
import { Play } from 'lucide-react';
import { SCENARIOS, type ScenarioId } from '@/data/scenarios';
import { applyScenario } from '@/services/scenarioApply';
import type { AstronautProfile } from '@/types';

export default function ScenarioPanel({ profile }: { profile: AstronautProfile }) {
  const [id, setId] = useState<ScenarioId>('nominal');
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    const info = SCENARIOS.find((s) => s.id === id);
    if (!info) return;
    const { launchMoved } = applyScenario(profile, id);
    setMessage(
      `Loaded "${info.label}" for ${profile.callsign}. Expected: ${info.expected}` +
        (launchMoved ? ' The launch date was moved back so there are 45 mission days of history.' : ''),
    );
  };

  return (
    <section className="panel p-5" aria-labelledby="scn-heading">
      <h2 id="scn-heading" className="text-base font-semibold">
        Demo scenarios
      </h2>
      <p className="mt-1 text-xs text-ink-faint">
        Replaces the stored readings and check-ins of the selected astronaut ({profile.callsign}) with SIMULATED scenario data, and
        clears their alert states. Other astronauts are not changed.
      </p>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Scenario</legend>
        {SCENARIOS.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
              id === s.id ? 'border-accent/60 bg-accent/10' : 'border-line/60 hover:border-accent/40'
            }`}
          >
            <input
              type="radio"
              name="scenario"
              value={s.id}
              checked={id === s.id}
              onChange={() => setId(s.id)}
              className="mt-1 accent-[rgb(34,211,238)]"
            />
            <span>
              <span className="font-medium">{s.label}</span>
              <span className="block text-xs text-ink-muted">{s.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={load}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        Load scenario
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm text-status-normal">
          {message}
        </p>
      )}
    </section>
  );
}