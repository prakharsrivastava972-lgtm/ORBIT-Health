import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import type { ProfileOverride } from '@/data/profileOverrides';
import type { AstronautProfile } from '@/types';

export function makeProfileSchema(nowFn: () => Date = () => new Date()) {
  return z
    .object({
      name: z.string().trim().min(1, 'Enter a name.').max(60, 'Name can be at most 60 characters.'),
      callsign: z.string().trim().min(1, 'Enter a callsign.').max(20, 'Callsign can be at most 20 characters.'),
      age: z.string().trim(),
      sex: z.enum(['F', 'M', 'X']),
      heightCm: z.string().trim(),
      weightKg: z.string().trim(),
      conditions: z.string().max(200, 'Keep declared conditions under 200 characters.'),
      missionName: z.string().trim().min(1, 'Enter a mission name.').max(80, 'Mission name can be at most 80 characters.'),
      launchDate: z.string(),
      plannedDays: z.string().trim(),
      location: z.string().trim().min(1, 'Enter a location.').max(80, 'Location can be at most 80 characters.'),
    })
    .superRefine((d, ctx) => {
      const check = (
        field: 'age' | 'heightCm' | 'weightKg' | 'plannedDays',
        label: string,
        min: number,
        max: number,
        int: boolean,
      ) => {
        const raw = d[field];
        const n = Number(raw);
        let message: string | null = null;
        if (raw === '' || !Number.isFinite(n)) message = `${label}: enter a number.`;
        else if (int && !Number.isInteger(n)) message = `${label} must be a whole number.`;
        else if (n < min || n > max) message = `${label} must be between ${min} and ${max}.`;
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      };
      check('age', 'Age', 18, 80, true);
      check('heightCm', 'Height', 120, 230, false);
      check('weightKg', 'Weight', 30, 200, false);
      check('plannedDays', 'Planned duration', 1, 1500, true);

      const valid = /^\d{4}-\d{2}-\d{2}$/.test(d.launchDate) && !Number.isNaN(parseISO(d.launchDate).getTime());
      if (!valid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['launchDate'], message: 'Enter a valid launch date.' });
      } else if (d.launchDate > format(nowFn(), 'yyyy-MM-dd')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['launchDate'], message: 'Launch date cannot be in the future.' });
      }
    });
}

export type ProfileValues = z.infer<ReturnType<typeof makeProfileSchema>>;

export function profileToValues(p: AstronautProfile): ProfileValues {
  return {
    name: p.name,
    callsign: p.callsign,
    age: String(p.age),
    sex: p.sex,
    heightCm: String(p.heightCm),
    weightKg: String(p.weightKg),
    conditions: p.conditions.join(', '),
    missionName: p.mission.name,
    launchDate: p.mission.launchDate,
    plannedDays: String(p.mission.plannedDays),
    location: p.mission.location,
  };
}

export function toOverride(v: ProfileValues): ProfileOverride {
  return {
    name: v.name,
    callsign: v.callsign,
    age: Number(v.age),
    sex: v.sex,
    heightCm: Number(v.heightCm),
    weightKg: Number(v.weightKg),
    conditions: v.conditions.split(',').map((s) => s.trim()).filter(Boolean),
    mission: {
      name: v.missionName,
      launchDate: v.launchDate,
      plannedDays: Number(v.plannedDays),
      location: v.location,
    },
  };
}