import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import type { CheckIn, Rating } from '@/types';

const rating = z.enum(['1', '2', '3', '4', '5'], {
  errorMap: () => ({ message: 'Choose a rating from 1 to 5.' }),
});

export function makeCheckInSchema(launchIso: string, nowFn: () => Date = () => new Date()) {
  return z
    .object({
      date: z.string(),
      mood: rating,
      stress: rating,
      fatigue: rating,
      isolation: rating,
      sleepQuality: rating,
      notes: z.string().max(500, 'Notes can be at most 500 characters.').optional(),
      requestsSupport: z.boolean(),
    })
    .superRefine((d, ctx) => {
      const valid = /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(parseISO(d.date).getTime());
      if (!valid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Enter a valid date.' });
      } else if (d.date > format(nowFn(), 'yyyy-MM-dd')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Check-in date cannot be in the future.' });
      } else if (d.date < launchIso.slice(0, 10)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Check-in date is before mission launch.' });
      }
    });
}

export type CheckInValues = z.infer<ReturnType<typeof makeCheckInSchema>>;

export function toCheckIn(v: CheckInValues, astronautId: string): CheckIn {
  const notes = v.notes?.trim();
  return {
    id: `${astronautId}-checkin-${v.date}`,
    astronautId,
    date: v.date,
    mood: Number(v.mood) as Rating,
    stress: Number(v.stress) as Rating,
    fatigue: Number(v.fatigue) as Rating,
    isolation: Number(v.isolation) as Rating,
    sleepQuality: Number(v.sleepQuality) as Rating,
    notes: notes ? notes : undefined,
    requestsSupport: v.requestsSupport ? true : undefined,
  };
}