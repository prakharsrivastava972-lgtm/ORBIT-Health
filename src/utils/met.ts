import { differenceInCalendarDays, parseISO } from 'date-fns';

/** Mission day number. Launch day is day 1; returns 0 before launch. */
export function missionDay(launchIso: string, now: Date = new Date()): number {
  const diff = differenceInCalendarDays(now, parseISO(launchIso));
  return diff < 0 ? 0 : diff + 1;
}

/** Percent of planned mission elapsed, clamped to 0-100. */
export function missionProgress(launchIso: string, plannedDays: number, now: Date = new Date()): number {
  if (plannedDays <= 0) return 0;
  const pct = (missionDay(launchIso, now) / plannedDays) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}