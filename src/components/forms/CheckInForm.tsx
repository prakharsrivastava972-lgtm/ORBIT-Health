import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CheckCircle2, Save } from 'lucide-react';
import { BEHAVIOR_DOMAINS } from '@/data/checkin';
import { useDataStore } from '@/store/useDataStore';
import { makeCheckInSchema, toCheckIn, type CheckInValues } from '@/utils/checkinValidation';
import type { AstronautProfile } from '@/types';

const today = () => format(new Date(), 'yyyy-MM-dd');

/** Ratings start empty on purpose: every answer should be a deliberate choice. */
const emptyValues = (date: string) =>
  ({ date, mood: '', stress: '', fatigue: '', isolation: '', sleepQuality: '', notes: '', requestsSupport: false }) as unknown as CheckInValues;

const inputClass =
  'mt-1 w-full rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm text-ink placeholder:text-ink-faint hover:border-accent/50 aria-[invalid=true]:border-status-urgent';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-status-urgent">
      {message}
    </p>
  );
}

export default function CheckInForm({ profile }: { profile: AstronautProfile }) {
  const addCheckIn = useDataStore((s) => s.addCheckIn);
  const schema = useMemo(() => makeCheckInSchema(profile.mission.launchDate), [profile.mission.launchDate]);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckInValues>({ resolver: zodResolver(schema), defaultValues: emptyValues(today()) });

  const onSubmit = (values: CheckInValues) => {
    try {
      const item = toCheckIn(values, profile.id);
      const replaced = (useDataStore.getState().checkIns[profile.id] ?? []).some((c) => c.date === item.date);
      addCheckIn(profile.id, item);
      setSaveError(null);
      setSaved(replaced ? `Updated your check-in for ${item.date}.` : `Saved your check-in for ${item.date}.`);
      reset(emptyValues(today()));
    } catch {
      setSaved(null);
      setSaveError('Could not save this check-in. Please try again.');
    }
  };

  return (
    <section className="panel p-5" aria-labelledby="checkin-heading">
      <h2 id="checkin-heading" className="text-base font-semibold">
        Daily check-in
      </h2>
      <p className="mt-1 text-xs text-ink-faint">
        Answer for how you feel today. One check-in per date: saving a date again replaces it. Stored on this device only.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-5">
        <div>
          <label htmlFor="checkin-date" className="text-sm text-ink-muted">
            Date
          </label>
          <input
            id="checkin-date"
            type="date"
            min={profile.mission.launchDate.slice(0, 10)}
            max={today()}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? 'checkin-date-error' : undefined}
            className={inputClass}
            {...register('date')}
          />
          <FieldError id="checkin-date-error" message={errors.date?.message} />
        </div>

        {BEHAVIOR_DOMAINS.map((d) => {
          const err = errors[d.key]?.message;
          return (
            <fieldset key={d.key} aria-describedby={err ? `${d.key}-error` : undefined}>
              <legend className="text-sm">
                <span className="font-medium">{d.label}</span>
                <span className="block text-xs text-ink-muted">{d.question}</span>
                <span className="sr-only">
                  {' '}
                  Scale: 1 = {d.low}, 5 = {d.high}.
                </span>
              </legend>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input type="radio" value={String(n)} className="peer sr-only" {...register(d.key)} />
                    <span className="flex h-10 items-center justify-center rounded-lg border border-line/60 bg-space-900 text-sm text-ink-muted hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:font-semibold peer-checked:text-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-ink-faint" aria-hidden="true">
                <span>1 = {d.low}</span>
                <span>5 = {d.high}</span>
              </div>
              <FieldError id={`${d.key}-error`} message={err} />
            </fieldset>
          );
        })}

        <div>
          <label htmlFor="checkin-notes" className="text-sm text-ink-muted">
            Notes (optional)
          </label>
          <textarea
            id="checkin-notes"
            rows={3}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? 'checkin-notes-error' : undefined}
            className={inputClass}
            {...register('notes')}
          />
          <FieldError id="checkin-notes-error" message={errors.notes?.message} />
        </div>

        <div className="rounded-lg border border-line/60 bg-space-900/60 p-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(34,211,238)]" {...register('requestsSupport')} />
            <span>I would like to talk to someone now (flight surgeon or behavioral health support)</span>
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            Ticking this raises an Urgent flag so it is not missed. If anyone is in immediate danger, follow your mission emergency procedures.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save check-in
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
    </section>
  );
}