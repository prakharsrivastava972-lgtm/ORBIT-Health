import { format, subDays } from 'date-fns';
import { TASK_DEFS, summarizeTasks } from '../tasks';
import type { CheckIn, Measurement } from '@/types';
import { NOW, mk } from './helpers';

const TODAY = format(NOW, 'yyyy-MM-dd');

function ci(daysAgo: number): CheckIn {
  const date = format(subDays(NOW, daysAgo), 'yyyy-MM-dd');
  return { id: `c-${date}`, astronautId: 't', date, mood: 4, stress: 2, fatigue: 2, isolation: 2, sleepQuality: 4 };
}

function summary(measurements: Measurement[], checkIns: CheckIn[], selfDone: Record<string, string[]> = {}) {
  return summarizeTasks({ measurements, checkIns, selfDone, launchDate: '2026-01-01', plannedDays: 180, now: NOW });
}

const done = (s: ReturnType<typeof summary>, id: string) => s.tasks.find((t) => t.def.id === id)!.done;

describe('daily tasks', () => {
  it('starts with nothing done when there is no data', () => {
    const s = summary([], []);
    expect(s.tasks).toHaveLength(TASK_DEFS.length);
    expect(s.doneCount).toBe(0);
    expect(s.points).toBe(0);
    expect(s.streak).toBe(0);
  });

  it('completes the vitals task only when every required vital is logged today', () => {
    const three = [mk('hr', 60, 0), mk('sbp', 116, 0), mk('tempC', 36.7, 0)];
    expect(done(summary(three, []), 'vitals')).toBe(false);
    expect(done(summary([...three, mk('spo2', 97, 0)], []), 'vitals')).toBe(true);
  });

  it('ignores readings from other days', () => {
    const s = summary([mk('glucose', 90, 1)], []);
    expect(done(s, 'glucose')).toBe(false);
  });

  it('completes the check-in task from a check-in dated today', () => {
    expect(done(summary([], [ci(0)]), 'checkin')).toBe(true);
    expect(done(summary([], [ci(1)]), 'checkin')).toBe(false);
  });

  it('counts a streak and does not break it when today is unfinished', () => {
    const both = [0, 1, 2, 3, 4];
    expect(summary(both.map((d) => mk('hr', 60, d)), both.map(ci)).streak).toBe(5);
    const noToday = [1, 2, 3, 4];
    expect(summary(noToday.map((d) => mk('hr', 60, d)), noToday.map(ci)).streak).toBe(4);
  });

  it('ends a streak at a gap and remembers the longest one', () => {
    const days = [0, 1, 3, 4];
    const s = summary(days.map((d) => mk('hr', 60, d)), days.map(ci));
    expect(s.streak).toBe(2);
    expect(s.longestStreak).toBe(2);
  });

  it('computes points from completions, including self-reported tasks', () => {
    const m = [mk('hr', 60, 0), mk('sbp', 116, 0), mk('tempC', 36.7, 0), mk('spo2', 97, 0)];
    const s = summary(m, [ci(0)], { [TODAY]: ['exercise'] });
    expect(s.points).toBe(10 + 15 + 10);
    expect(s.todayPoints).toBe(35);
    expect(summary(m, [ci(0)]).points).toBe(25);
  });

  it('awards milestones from real data only', () => {
    const days = [0, 1, 2];
    const s = summary(days.map((d) => mk('hr', 60, d)), days.map(ci));
    const earned = (id: string) => s.milestones.find((x) => x.id === id)!.earned;
    expect(earned('first-reading')).toBe(true);
    expect(earned('streak-3')).toBe(true);
    expect(earned('streak-7')).toBe(false);
    expect(earned('mission-75')).toBe(true);
    expect(earned('mission-100')).toBe(false);
    expect(summary([], []).milestones.some((x) => x.earned && !x.id.startsWith('mission'))).toBe(false);
  });

  it('rewards logging only and never claims results are normal or healthy', () => {
    const s = summary([], []);
    const text = JSON.stringify([TASK_DEFS, s.milestones]);
    expect(text).not.toMatch(/\bhealthy\b|\bnormal\b|\bdiagnos|\byou have\b/i);
  });
});