import { evaluate } from '@/engine/evaluate';
import { NOW, testProfile } from '@/engine/__tests__/helpers';
import { SCENARIOS, buildScenario, type ScenarioId } from './scenarios';

function run(id: ScenarioId) {
  const d = buildScenario(testProfile, id, NOW);
  return { d, r: evaluate(testProfile, d.measurements, NOW, d.checkIns) };
}

describe('demo scenarios', () => {
  it('defines five scenarios', () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual(['nominal', 'sleep-stress', 'dehydration', 'urgent', 'sparse']);
  });

  it('nominal raises no flags', () => {
    const { r } = run('nominal');
    expect(r.flags).toEqual([]);
    expect(r.overall).toBe('normal');
  });

  it('sleep and stress drift is Attention only', () => {
    const { r } = run('sleep-stress');
    expect(r.flags.some((f) => f.metric === 'sleepHrs')).toBe(true);
    expect(r.flags.some((f) => f.id === 'behavioral:multi')).toBe(true);
    expect(r.overall).toBe('attention');
  });

  it('dehydration produces a cluster of related Attention flags', () => {
    const { r } = run('dehydration');
    const ids = r.flags.map((f) => f.id);
    expect(ids).toContain('hydrationL:limit');
    expect(ids).toContain('hr:baseline');
    expect(r.overall).toBe('attention');
  });

  it('urgent escalation reaches Urgent through a limit and a support request', () => {
    const { r } = run('urgent');
    expect(r.overall).toBe('urgent');
    expect(r.flags.find((f) => f.id === 'sbp:limit')?.severity).toBe('urgent');
    expect(r.flags.some((f) => f.id === 'behavioral:support')).toBe(true);
  });

  it('sparse data has no baselines, low confidence and missing-data notes', () => {
    const { r } = run('sparse');
    expect(r.incomplete).toBe(true);
    expect(r.metrics.glucose.state).toBe('no-data');
    expect(r.metrics.hr.baseline).toBeNull();
    expect(r.metrics.hr.quality?.confidence).toBe('low');
    expect(r.flags.every((f) => f.basis !== 'personal-baseline')).toBe(true);
  });

  it('labels every generated reading as simulated', () => {
    for (const s of SCENARIOS) {
      expect(buildScenario(testProfile, s.id, NOW).measurements.every((m) => m.source === 'simulated')).toBe(true);
    }
  });
});