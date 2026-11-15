import { applyAlertStates, summarizeAlerts } from '@/engine/alerts';
import { evaluate } from '@/engine/evaluate';
import { NOW, run, testProfile } from '@/engine/__tests__/helpers';
import { buildReport, reportToText, shortSummary } from './report';

const build = () => {
  const e = evaluate(testProfile, run('spo2', [...Array(20).fill(97), 88]), NOW);
  return buildReport(testProfile, e, summarizeAlerts(applyAlertStates(e.flags, {})), [], NOW);
};

describe('report', () => {
  it('summarizes status, flags and all nine metrics', () => {
    const r = build();
    expect(r.overall).toBe('urgent');
    expect(r.unresolved.some((f) => /SpO2/.test(f.title))).toBe(true);
    expect(r.metrics).toHaveLength(9);
    expect(r.behavior.lastDate).toBeNull();
  });

  it('labels itself as simulated, states its limits, and avoids diagnostic wording', () => {
    const text = reportToText(build());
    expect(text).toMatch(/SIMULATED/);
    expect(text).toMatch(/bone density loss, immune dysfunction or radiation injury/);
    expect(text).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b/i);
    expect(shortSummary(build())).toMatch(/Status: Urgent/);
  });
});