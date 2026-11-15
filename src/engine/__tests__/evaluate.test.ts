import { evaluate } from '../evaluate';
import type { Measurement } from '@/types';
import { METRIC_KEYS } from '@/data/metrics';
import { NOW, mk, run, testProfile } from './helpers';

const cycle = (n: number, pattern: number[]) => Array.from({ length: n }, (_, i) => pattern[i % pattern.length]);

describe('health intelligence engine', () => {
  it('raises no flags for steady readings', () => {
    const r = evaluate(testProfile, run('hr', cycle(28, [59, 61, 60, 62, 58, 60, 61])), NOW);
    expect(r.flags).toEqual([]);
    expect(r.metrics.hr.state).toBe('normal');
    expect(r.metrics.hr.baseline).not.toBeNull();
  });

  it('raises an Urgent limit flag first, with escalation and provenance', () => {
    const r = evaluate(testProfile, run('spo2', [...Array(20).fill(97), 88]), NOW);
    expect(r.overall).toBe('urgent');
    const first = r.flags[0];
    expect(first.metric).toBe('spo2');
    expect(first.severity).toBe('urgent');
    expect(first.basis).toBe('general-reference');
    expect(first.escalation).toMatch(/flight surgeon/i);
    expect(first.limitations.length).toBeGreaterThan(0);
  });

  it('lets mission-configured limits replace the general ones', () => {
    const data = run('hr', [...Array(20).fill(60), 72]);
    expect(evaluate(testProfile, data, NOW).flags.some((f) => f.id === 'hr:limit')).toBe(false);
    const custom = { ...testProfile, thresholds: { hr: { attentionHigh: 70 } } };
    const flag = evaluate(custom, data, NOW).flags.find((f) => f.id === 'hr:limit');
    expect(flag?.basis).toBe('mission-configured');
    expect(flag?.severity).toBe('attention');
  });

  it('flags a large change from personal baseline as Attention, never Urgent', () => {
    const r = evaluate(testProfile, run('hr', [...cycle(20, [59, 61]), 75]), NOW);
    const flag = r.flags.find((f) => f.id === 'hr:baseline');
    expect(flag?.basis).toBe('personal-baseline');
    expect(flag?.severity).toBe('attention');
    expect(r.flags.some((f) => f.id === 'hr:limit')).toBe(false);
    expect(r.flags.some((f) => f.severity === 'urgent')).toBe(false);
  });

  it('detects a slow drift before any single reading is extreme', () => {
    const drift = Array.from({ length: 7 }, (_, i) => 7.0 - (i * 1.1) / 6);
    const r = evaluate(testProfile, run('sleepHrs', [...Array(20).fill(7.0), ...drift]), NOW);
    expect(r.flags.some((f) => f.id === 'sleepHrs:trend')).toBe(true);
    expect(r.flags.some((f) => f.id === 'sleepHrs:baseline')).toBe(false);
  });

  it('leaves out readings whose context does not match the reference', () => {
    const data = [...run('hr', Array(20).fill(60), 1), mk('hr', 140, 0, 'post-exercise')];
    const r = evaluate(testProfile, data, NOW);
    expect(r.flags.filter((f) => f.metric === 'hr')).toEqual([]);
    expect(r.metrics.hr.excluded).toBe(1);
    expect(r.metrics.hr.latest?.value).toBe(60);
    expect(r.metrics.hr.quality?.issues.some((i) => /left out/i.test(i))).toBe(true);
  });

  it('uses only the reference range when history is too short, and says so', () => {
    const r = evaluate(testProfile, run('hr', [62, 64, 60, 63, 120]), NOW);
    expect(r.metrics.hr.baseline).toBeNull();
    expect(r.flags.some((f) => f.id === 'hr:limit' && f.basis === 'general-reference')).toBe(true);
    expect(r.flags.some((f) => f.basis === 'personal-baseline')).toBe(false);
    expect(r.metrics.hr.quality?.confidence).toBe('medium');
    expect(r.metrics.hr.quality?.issues.some((i) => /baseline/i.test(i))).toBe(true);
  });

  it('never treats missing data as normal', () => {
    const r = evaluate(testProfile, [], NOW);
    expect(METRIC_KEYS.every((k) => r.metrics[k].state === 'no-data')).toBe(true);
    expect(r.flags).toEqual([]);
    expect(r.incomplete).toBe(true);
  });

  it('lowers confidence for old readings', () => {
    const r = evaluate(testProfile, run('spo2', [...Array(20).fill(97), 88], 5), NOW);
    const flag = r.flags.find((f) => f.id === 'spo2:limit');
    expect(flag?.confidence).toBe('low');
    expect(flag!.dataQuality.staleHours).toBeGreaterThan(72);
  });

  it('avoids diagnostic wording in every flag', () => {
    const data: Measurement[] = [
      ...run('spo2', [...Array(20).fill(97), 88]),
      ...run('hr', [...cycle(20, [59, 61]), 75]),
      ...run('sleepHrs', [...Array(20).fill(7.0), ...Array.from({ length: 7 }, (_, i) => 7.0 - (i * 1.1) / 6)]),
    ];
    const text = JSON.stringify(evaluate(testProfile, data, NOW).flags);
    expect(text.length).toBeGreaterThan(100);
    expect(text).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b|\bindicates (a|an) (disease|infection|disorder)\b/i);
  });
});