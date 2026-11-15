import { format, parseISO } from 'date-fns';
import { ClipboardList, Info, Rocket, ShieldAlert } from 'lucide-react';
import { METRICS } from '@/data/metrics';
import { COVERAGE_LABEL, REFERENCE_LABEL, type BodySystem } from '@/data/systems';
import { latestFor } from '@/utils/series';
import type { Measurement } from '@/types';

interface Props {
  system: BodySystem;
  measurements: Measurement[];
}

const sourceLabel = { simulated: 'Simulated', manual: 'Manual entry', device: 'Device' } as const;

export default function SystemDetail({ system, measurements }: Props) {
  return (
    <div className="space-y-4" aria-live="polite">
      <section className="panel p-5" aria-labelledby="system-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="system-heading" className="text-xl font-semibold tracking-tight">
              {system.label} system
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">{system.summary}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-accent-blue/40 bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {COVERAGE_LABEL[system.coverage]}
          </span>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Related hazards: {system.hazards.join(', ')}.
        </p>
      </section>

      <section className="panel p-5" aria-labelledby="context-heading">
        <div className="flex items-center gap-2 text-accent">
          <Rocket className="h-4 w-4" aria-hidden="true" />
          <h3 id="context-heading" className="label-caps !text-accent">
            Spaceflight context
          </h3>
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-muted">
          {system.spaceflightContext.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="panel p-5" aria-labelledby="related-heading">
        <h3 id="related-heading" className="label-caps">
          Related readings in this app
        </h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {system.relatedMetrics.map((key) => {
            const latest = latestFor(measurements, key);
            const meta = METRICS[key];
            return (
              <li key={key} className="rounded-lg border border-line/60 bg-space-900/60 p-3">
                <p className="text-xs text-ink-faint">{meta.label}</p>
                {latest ? (
                  <>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {latest.value} <span className="text-xs font-normal text-ink-muted">{meta.unit}</span>
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {format(parseISO(latest.takenAt), 'MMM d, h:mm a')} · {sourceLabel[latest.source]}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-sm text-ink-muted">No reading recorded</p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{system.relatedNote}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel p-5" aria-labelledby="cannot-heading">
          <div className="flex items-center gap-2 text-accent-blue">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <h3 id="cannot-heading" className="label-caps !text-accent-blue">
              What ordinary vitals cannot tell you
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
            {system.cannotMeasure.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="panel p-5" aria-labelledby="assess-heading">
          <div className="flex items-center gap-2 text-accent-blue">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            <h3 id="assess-heading" className="label-caps !text-accent-blue">
              Dedicated assessments needed
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
            {system.requiredAssessments.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">Discuss any concern with the flight surgeon.</p>
        </section>
      </div>

      <p className="text-[11px] leading-relaxed text-ink-faint">
        General educational summary written for this prototype. It is not NASA guidance and does not diagnose.
        Individual responses vary. Sources to verify before citing (unverified until Phase 15):{' '}
        {system.references.map((r) => REFERENCE_LABEL[r] ?? r).join('; ')}.
      </p>
    </div>
  );
}