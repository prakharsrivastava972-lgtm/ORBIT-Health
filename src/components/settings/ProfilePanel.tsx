import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { sampleProfiles } from '@/data/profiles';
import { useProfileStore } from '@/store/useProfileStore';
import { makeProfileSchema, profileToValues, toOverride, type ProfileValues } from '@/utils/profileValidation';
import type { AstronautProfile } from '@/types';

const inputCls =
  'mt-1 w-full rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm text-ink hover:border-accent/50 aria-[invalid=true]:border-status-urgent';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm text-ink-muted">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-status-urgent">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProfilePanel({ profile }: { profile: AstronautProfile }) {
  const update = useProfileStore((s) => s.update);
  const clearFields = useProfileStore((s) => s.clearFields);
  const schema = useMemo(() => makeProfileSchema(), []);
  const [saved, setSaved] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(schema), defaultValues: profileToValues(profile) });

  const a = (name: keyof ProfileValues, id: string) => ({
    id,
    className: inputCls,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
    ...register(name),
  });

  const onSubmit = (v: ProfileValues) => {
    const launchChanged = v.launchDate !== profile.mission.launchDate;
    update(profile.id, toOverride(v));
    setSaved(
      launchChanged
        ? 'Profile saved. Stored readings were not moved. Load a scenario or regenerate simulated data to rebuild history from the new launch date.'
        : 'Profile saved.',
    );
  };

  const restore = () => {
    clearFields(profile.id);
    const base = sampleProfiles.find((p) => p.id === profile.id);
    if (base) reset(profileToValues(base));
    setSaved('Profile fields restored to the sample defaults. Thresholds were kept.');
  };

  return (
    <section className="panel p-5" aria-labelledby="prof-heading">
      <h2 id="prof-heading" className="text-base font-semibold">
        Astronaut profile and mission
      </h2>
      <p className="mt-1 text-xs text-ink-faint">Fictional, SIMULATED profile. Edits are stored on this device only.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-name" label="Name" error={errors.name?.message}>
            <input type="text" {...a('name', 'p-name')} />
          </Field>
          <Field id="p-callsign" label="Callsign" error={errors.callsign?.message}>
            <input type="text" {...a('callsign', 'p-callsign')} />
          </Field>
          <Field id="p-age" label="Age" error={errors.age?.message}>
            <input type="text" inputMode="numeric" {...a('age', 'p-age')} />
          </Field>
          <Field id="p-sex" label="Sex" error={errors.sex?.message}>
            <select {...a('sex', 'p-sex')}>
              <option value="F">F</option>
              <option value="M">M</option>
              <option value="X">X</option>
            </select>
          </Field>
          <Field id="p-height" label="Height (cm)" error={errors.heightCm?.message}>
            <input type="text" inputMode="decimal" {...a('heightCm', 'p-height')} />
          </Field>
          <Field id="p-weight" label="Weight (kg)" error={errors.weightKg?.message}>
            <input type="text" inputMode="decimal" {...a('weightKg', 'p-weight')} />
          </Field>
        </div>
        <Field id="p-cond" label="Declared conditions (comma separated, informational only)" error={errors.conditions?.message}>
          <input type="text" {...a('conditions', 'p-cond')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-mission" label="Mission name" error={errors.missionName?.message}>
            <input type="text" {...a('missionName', 'p-mission')} />
          </Field>
          <Field id="p-loc" label="Location" error={errors.location?.message}>
            <input type="text" {...a('location', 'p-loc')} />
          </Field>
          <Field id="p-launch" label="Launch date" error={errors.launchDate?.message}>
            <input type="date" {...a('launchDate', 'p-launch')} />
          </Field>
          <Field id="p-days" label="Planned duration (days)" error={errors.plannedDays?.message}>
            <input type="text" inputMode="numeric" {...a('plannedDays', 'p-days')} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save profile
          </button>
          <button
            type="button"
            onClick={restore}
            className="rounded-lg border border-line/60 px-4 py-2 text-sm text-ink-muted hover:border-accent/50 hover:text-ink"
          >
            Restore defaults
          </button>
        </div>
        {saved && (
          <p role="status" className="text-sm text-status-normal">
            {saved}
          </p>
        )}
      </form>
    </section>
  );
}