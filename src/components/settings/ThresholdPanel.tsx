import { useState } from 'react';
import { Save } from 'lucide-react';
import { METRICS, METRIC_KEYS } from '@/data/metrics';
import { GENERAL_REFERENCE } from '@/engine/referenceRanges';
import { useProfileStore } from '@/store/useProfileStore';
import {
  THRESHOLD_FIELDS,
  inputKey,
  parseThresholds,
  thresholdsToInputs,
  type ThresholdField,
  type ThresholdInputs,
} from '@/utils/thresholds';
import type { AstronautProfile, MetricKey } from '@/types';

const FIELD_LABEL: Record<ThresholdField, string> = {
  urgentLow: 'Urgent low',
  attentionLow: 'Attention low',
  attentionHigh: 'Attention high',
  urgentHigh: 'Urgent high',
};

export default function ThresholdPanel({ profile }: { profile: AstronautProfile }) {
  const update = useProfileStore((s) => s.update);
  const [inputs, setInputs] = useState<ThresholdInputs>(() => thresholdsToInputs(profile.thresholds));
  const [errors, setErrors] = useState<Partial<Record<MetricKey, string>>>({});
  const [message, setMessage] = useState<string | null>(null);

  const save = () => {
    const r = parseThresholds(inputs);
    setErrors(r.errors);
    if (Object.keys(r.errors).length > 0) {
      setMessage(null);
      return;
    }
    update(profile.id, { thresholds: r.thresholds });
    setMessage(
      Object.keys(r.thresholds).length === 0
        ? 'No mission thresholds set. General reference limits apply.'
        : `Saved mission thresholds for ${Object.keys(r.thresholds).length} metric(s). They now replace the general limits for those metrics.`,
    );
  };

  const clear = () => {
    update(profile.id, { thresholds: {} });
    setInputs({});
    setErrors({});
    setMessage('Cleared. General reference limits apply to every metric.');
  };

  return (
    <section className="panel p-5" aria-labelledby="thr-heading">
      <h2 id="thr-heading" className="text-base font-semibold">
        Mission thresholds (set by a flight surgeon)
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Nothing is preloaded, and these are not NASA values. Enter limits only if your flight surgeon provides them. If you set any
        limit for a metric, the general reference limits for that metric are not used. Blank fields are unset. Grey hints show the
        illustrative general limits. Flags from these limits are labeled &quot;Mission-configured limit&quot;.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Mission-configured limits for each metric</caption>
          <thead>
            <tr className="label-caps border-b border-line/60">
              <th scope="col" className="py-2 pr-3 font-medium">Metric</th>
              {THRESHOLD_FIELDS.map((f) => (
                <th key={f} scope="col" className="py-2 pr-3 font-medium">{FIELD_LABEL[f]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_KEYS.map((metric) => {
              const meta = METRICS[metric];
              return (
                <>
                  <tr key={metric} className="border-b border-line/30">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      {meta.label} <span className="text-xs text-ink-faint">({meta.unit})</span>
                    </th>
                    {THRESHOLD_FIELDS.map((f) => {
                      const hint = GENERAL_REFERENCE[metric]?.[f];
                      const key = inputKey(metric, f);
                      return (
                        <td key={f} className="py-2 pr-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={inputs[key] ?? ''}
                            placeholder={hint === undefined ? '—' : String(hint)}
                            onChange={(e) => {
                              setInputs((prev) => ({ ...prev, [key]: e.target.value }));
                              setMessage(null);
                            }}
                            aria-label={`${meta.label} ${FIELD_LABEL[f].toLowerCase()}`}
                            aria-invalid={errors[metric] ? true : undefined}
                            className="w-20 rounded-lg border border-line/60 bg-space-900 px-2 py-1.5 text-sm tabular-nums placeholder:text-ink-faint hover:border-accent/50 aria-[invalid=true]:border-status-urgent"
                          />
                        </td>
                      );
                    })}
                  </tr>
                  {errors[metric] && (
                    <tr key={`${metric}-err`}>
                      <td colSpan={5} className="pb-2">
                        <p role="alert" className="text-xs text-status-urgent">
                          {meta.label}: {errors[metric]}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save thresholds
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-line/60 px-4 py-2 text-sm text-ink-muted hover:border-accent/50 hover:text-ink"
        >
          Clear all
        </button>
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm text-status-normal">
          {message}
        </p>
      )}
    </section>
  );
}