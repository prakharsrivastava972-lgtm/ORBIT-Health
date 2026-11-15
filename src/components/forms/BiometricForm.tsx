import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CheckCircle2, Save } from 'lucide-react';
import { METRICS } from '@/data/metrics';
import { useDataStore } from '@/store/useDataStore';
import {
  CONTEXT_LABELS,
  ENTRY_KINDS,
  makeEntrySchema,
  toMeasurements,
  type EntryValues,
} from '@/utils/validation';
import type { AstronautProfile, MeasurementContext } from '@/types';

const inputClass =
  'mt-1 w-full rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm text-ink placeholder:text-ink-faint hover:border-accent/50 aria-[invalid=true]:border-status-urgent';

const nowLocal = () => format(new Date(), "yyyy-MM-dd'T'HH:mm");

const defaults = (kind: EntryValues['kind'] = 'hr'): EntryValues => ({
  kind,
  value: '',
  value2: '',
  takenAt: nowLocal(),
  context: '',
});

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-status-urgent">
      {message}
    </p>
  );
}

export default function BiometricForm({ profile }: { profile: AstronautProfile }) {
  const addMeasurements = useDataStore((s) => s.addMeasurements);
  const schema = useMemo(() => makeEntrySchema(profile.mission.launchDate), [profile.mission.launchDate]);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EntryValues>({ resolver: zodResolver(schema), defaultValues: defaults() });

  const kind = watch('kind');
  const entry = ENTRY_KINDS.find((k) => k.kind === kind) ?? ENTRY_KINDS[0];
  const isBp = entry.kind === 'bp';
  const firstUnit = METRICS[entry.metrics[0]].unit;

  const onSubmit = (values: EntryValues) => {
    try {
      const items = toMeasurements(values, profile.id);
      addMeasurements(profile.id, items);
      setSaveError(null);
      setSaved(`Saved: ${entry.label}. It now appears in the table and on the Overview.`);
      reset(defaults(values.kind));
    } catch {
      setSaved(null);
      setSaveError('Could not save this reading. Please check the values and try again.');
    }
  };

  return (
    <section className="panel p-5" aria-labelledby="entry-heading">
      <h2 id="entry-heading" className="text-base font-semibold">
        Add a reading
      </h2>
      <p className="mt-1 text-xs text-ink-faint">
        Measurement time is when the reading was taken. The time you enter it is recorded separately.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="kind" className="text-sm text-ink-muted">
            Metric
          </label>
          <select
            id="kind"
            className={inputClass}
            {...register('kind', {
              onChange: () => {
                setSaved(null);
                setSaveError(null);
              },
            })}
          >
            {ENTRY_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div className={isBp ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label htmlFor="value" className="text-sm text-ink-muted">
              {isBp ? `Systolic (${firstUnit})` : `Value (${firstUnit})`}
            </label>
            <input
              id="value"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={errors.value ? true : undefined}
              aria-describedby={errors.value ? 'value-error' : undefined}
              className={inputClass}
              {...register('value')}
            />
            <FieldError id="value-error" message={errors.value?.message} />
          </div>
          {isBp && (
            <div>
              <label htmlFor="value2" className="text-sm text-ink-muted">
                {`Diastolic (${METRICS.dbp.unit})`}
              </label>
              <input
                id="value2"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={errors.value2 ? true : undefined}
                aria-describedby={errors.value2 ? 'value2-error' : undefined}
                className={inputClass}
                {...register('value2')}
              />
              <FieldError id="value2-error" message={errors.value2?.message} />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="takenAt" className="text-sm text-ink-muted">
            Measured at
          </label>
          <input
            id="takenAt"
            type="datetime-local"
            aria-invalid={errors.takenAt ? true : undefined}
            aria-describedby={errors.takenAt ? 'takenAt-error' : undefined}
            className={inputClass}
            {...register('takenAt')}
          />
          <FieldError id="takenAt-error" message={errors.takenAt?.message} />
        </div>

        <div>
          <label htmlFor="context" className="text-sm text-ink-muted">
            Context (optional)
          </label>
          <select id="context" className={inputClass} {...register('context')}>
            <option value="">Not specified</option>
            {(Object.keys(CONTEXT_LABELS) as MeasurementContext[]).map((c) => (
              <option key={c} value={c}>
                {CONTEXT_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save reading
        </button>

        {saved && (
          <p role="status" className="flex items-start gap-2 text-sm text-status-normal">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {saved}
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-sm text-status-urgent">
            {saveError}
          </p>
        )}
      </form>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
        Entry limits only catch typing mistakes. They are not health thresholds, and nothing here is a NASA value.
      </p>
    </section>
  );
}