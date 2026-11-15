import { format } from 'date-fns';
import { buildRecommendations, CATEGORY_ORDER, ROUTINE } from '../recommendations';
import { evaluate } from '../evaluate';
import type { CheckIn } from '@/types';
import { NOW, run, testProfile } from './helpers';

const cycle = (n: number, pattern: number[]) => Array.from({ length: n }, (_, i) => pattern[i % pattern.length]);
const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe('recommendations', () => {
  it('triggers nothing without flags, and has a routine for every category', () => {
    expect(buildRecommendations([])).toEqual([]);
    expect(ROUTINE.map((r) => r.category).sort()).toEqual([...CATEGORY_ORDER].sort());
  });

  it('puts urgent escalation first for an urgent reading, tied to its flag', () => {
    const flags = evaluate(testProfile, run('spo2', [...Array(20).fill(97), 88]), NOW).flags;
    const recs = buildRecommendations(flags);
    expect(ids(recs)).toContain('esc-urgent');
    expect(ids(recs)).toContain('spo2-repeat');
    expect(recs[0].priority).toBe('urgent');
    expect(recs.every((r) => r.triggeredBy.length > 0)).toBe(true);
    expect(recs.find((r) => r.id === 'esc-urgent')?.triggeredBy).toContain('spo2:limit');
  });

  it('escalates a support request directly, without a generic urgent suggestion', () => {
    const ci: CheckIn = {
      id: 'c', astronautId: 't', date: format(NOW, 'yyyy-MM-dd'),
      mood: 4, stress: 2, fatigue: 2, isolation: 2, sleepQuality: 4, requestsSupport: true,
    };
    const recs = buildRecommendations(evaluate(testProfile, [], NOW, [ci]).flags);
    expect(ids(recs)).toEqual(['esc-support']);
    expect(recs[0].triggeredBy).toEqual(['behavioral:support']);
    expect(recs[0].priority).toBe('urgent');
  });

  it('suggests sleep habits for a sleep drift', () => {
    const drift = Array.from({ length: 7 }, (_, i) => 7.0 - (i * 1.1) / 6);
    const flags = evaluate(testProfile, run('sleepHrs', [...Array(20).fill(7.0), ...drift]), NOW).flags;
    expect(ids(buildRecommendations(flags))).toContain('sleep-routine');
  });

  it('merges duplicate suggestions and keeps every triggering flag', () => {
    const data = [...run('hr', [...cycle(20, [59, 61]), 75]), ...run('sbp', [...cycle(20, [115, 117]), 135])];
    const recs = buildRecommendations(evaluate(testProfile, data, NOW).flags);
    const exercise = recs.filter((r) => r.id === 'exercise-plan');
    expect(exercise).toHaveLength(1);
    expect(exercise[0].triggeredBy.length).toBeGreaterThanOrEqual(2);
  });

  it('avoids diagnostic wording in every suggestion', () => {
    const data = [...run('spo2', [...Array(20).fill(97), 88]), ...run('hr', [...cycle(20, [59, 61]), 75])];
    const text = JSON.stringify([...buildRecommendations(evaluate(testProfile, data, NOW).flags), ...ROUTINE]);
    expect(text.length).toBeGreaterThan(500);
    expect(text).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b|\bdepress|\banxiety\b/i);
  });
});