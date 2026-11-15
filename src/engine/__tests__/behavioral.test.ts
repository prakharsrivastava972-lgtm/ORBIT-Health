import { format, subDays } from 'date-fns';
import { evaluate } from '../evaluate';
import { evaluateBehavioral } from '../behavioral';
import type { CheckIn } from '@/types';
import { NOW, testProfile } from './helpers';

function ci(daysAgo: number, over: Partial<CheckIn> = {}): CheckIn {
  const date = format(subDays(NOW, daysAgo), 'yyyy-MM-dd');
  return { id: `t-${date}`, astronautId: 't', date, mood: 4, stress: 2, fatigue: 2, isolation: 2, sleepQuality: 4, ...over };
}

/** n daily check-ins, the last one `endDaysAgo` days ago. `tail` overrides the final entries in order. */
function series(n: number, endDaysAgo = 0, tail: Partial<CheckIn>[] = []): CheckIn[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i - (n - tail.length);
    return ci(endDaysAgo + n - 1 - i, t >= 0 ? tail[t] : {});
  });
}

const ids = (list: CheckIn[]) => evaluateBehavioral(list, NOW).flags.map((f) => f.id);

describe('behavioral rules', () => {
  it('records a note and raises no flags when there are no check-ins', () => {
    const r = evaluateBehavioral([], NOW);
    expect(r.flags).toEqual([]);
    expect(r.notes.join(' ')).toMatch(/none recorded/i);
  });

  it('raises no flags for steady ratings', () => {
    expect(ids(series(20))).toEqual([]);
  });

  it('always raises an Urgent flag when support is requested', () => {
    const r = evaluateBehavioral(series(20, 0, [{ requestsSupport: true }]), NOW);
    expect(r.flags).toHaveLength(1);
    expect(r.flags[0].id).toBe('behavioral:support');
    expect(r.flags[0].severity).toBe('urgent');
    expect(r.flags[0].escalation).toMatch(/flight surgeon/i);
  });

  it('flags three days of high stress as sustained, once', () => {
    expect(ids(series(23, 0, [{ stress: 4 }, { stress: 4 }, { stress: 4 }]))).toEqual(['behavioral:stress:sustained']);
  });

  it('flags a shift from personal baseline when ratings are not yet extreme', () => {
    const r = evaluateBehavioral(series(23, 0, [{ stress: 3 }, { stress: 4 }, { stress: 4 }]), NOW);
    expect(r.flags.map((f) => f.id)).toEqual(['behavioral:stress:shift']);
    expect(r.flags[0].basis).toBe('personal-baseline');
    expect(r.flags[0].severity).toBe('attention');
    expect(r.flags[0].evidence.baseline).toBe(2);
  });

  it('flags the most concerning rating with fixed rules when history is short, and says so', () => {
    const r = evaluateBehavioral(series(5, 0, [{ fatigue: 5 }]), NOW);
    expect(r.flags.map((f) => f.id)).toEqual(['behavioral:fatigue:extreme']);
    expect(r.flags[0].basis).toBe('self-reported');
    expect(r.flags[0].dataQuality.issues.join(' ')).toMatch(/baseline/i);
  });

  it('treats LOW mood and LOW sleep quality as concerning', () => {
    expect(ids(series(20, 0, [{ mood: 1 }]))).toContain('behavioral:mood:extreme');
    expect(ids(series(20, 0, [{ sleepQuality: 2 }, { sleepQuality: 2 }, { sleepQuality: 2 }]))).toEqual([
      'behavioral:sleepQuality:sustained',
    ]);
  });

  it('does not make claims about the present when the latest check-in is old', () => {
    const r = evaluateBehavioral(series(20, 10, [{ stress: 5 }]), NOW);
    expect(r.flags).toEqual([]);
    expect(r.notes.join(' ')).toMatch(/10 days ago/);
  });

  it('never raises Urgent unless support is requested', () => {
    const worst = { mood: 1, stress: 5, fatigue: 5, isolation: 5, sleepQuality: 1 } as const;
    const r = evaluateBehavioral(series(20, 0, Array(20).fill(worst)), NOW);
    expect(r.flags.length).toBeGreaterThan(1);
    expect(r.flags.some((f) => f.id === 'behavioral:multi')).toBe(true);
    expect(r.flags.every((f) => f.severity === 'attention')).toBe(true);
  });

  it('avoids diagnostic wording', () => {
    const worst = { mood: 1, stress: 5, fatigue: 5, isolation: 5, sleepQuality: 1, requestsSupport: true } as const;
    const text = JSON.stringify(evaluateBehavioral(series(20, 0, Array(20).fill(worst)), NOW).flags);
    expect(text.length).toBeGreaterThan(200);
    expect(text).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b|\bdepress|\banxiety\b/i);
  });
});

describe('behavioral rules inside the engine', () => {
  it('raises the overall status to Urgent when support is requested', () => {
    const r = evaluate(testProfile, [], NOW, [ci(0, { requestsSupport: true })]);
    expect(r.overall).toBe('urgent');
    expect(r.flags.some((f) => f.id === 'behavioral:support')).toBe(true);
  });

  it('leaves behavioral rules out when no check-ins are passed', () => {
    const r = evaluate(testProfile, [], NOW);
    expect(r.dataNotes.some((n) => /behavioral/i.test(n))).toBe(false);
  });

  it('notes missing check-ins when an empty list is passed', () => {
    const r = evaluate(testProfile, [], NOW, []);
    expect(r.dataNotes.some((n) => /behavioral check-in: none recorded/i.test(n))).toBe(true);
  });
});