import { applyAlertStates, canResolve, flagSignature, resolveNoteRequired, summarizeAlerts } from '../alerts';
import { evaluate } from '../evaluate';
import { NOW, run, testProfile } from './helpers';

const flagsFor = (last: number) => evaluate(testProfile, run('spo2', [...Array(20).fill(97), last]), NOW).flags;

describe('alert states', () => {
  it('treats every flag as active until a matching record exists', () => {
    const views = applyAlertStates(flagsFor(88), {});
    expect(views.length).toBeGreaterThan(0);
    expect(views.every((v) => v.status === 'active')).toBe(true);
  });

  it('applies an acknowledgement only while the flag is unchanged', () => {
    const flag = flagsFor(88).find((f) => f.id === 'spo2:limit')!;
    const records = { 'spo2:limit': { status: 'acknowledged' as const, signature: flagSignature(flag), at: 'x' } };
    expect(applyAlertStates(flagsFor(88), records).find((v) => v.flag.id === 'spo2:limit')?.status).toBe('acknowledged');
    expect(applyAlertStates(flagsFor(87), records).find((v) => v.flag.id === 'spo2:limit')?.status).toBe('active');
  });

  it('leaves resolved flags out of the overall state', () => {
    const flags = flagsFor(88);
    const limit = flags.find((f) => f.id === 'spo2:limit')!;
    const records = { 'spo2:limit': { status: 'resolved' as const, signature: flagSignature(limit), at: 'x', note: 'ok' } };
    const summary = summarizeAlerts(applyAlertStates(flags, records));
    expect(summary.resolved).toHaveLength(1);
    expect(summary.unresolved.some((v) => v.flag.id === 'spo2:limit')).toBe(false);
    expect(summarizeAlerts(applyAlertStates(flags, {})).state).toBe('urgent');
    expect(summary.state).toBe('attention');
  });

  it('never allows a support request to be resolved, and requires a note for urgent flags', () => {
    const [urgent] = flagsFor(88);
    expect(urgent.severity).toBe('urgent');
    expect(resolveNoteRequired(urgent)).toBe(true);
    expect(canResolve(urgent)).toBe(true);
    expect(canResolve({ ...urgent, id: 'behavioral:support' })).toBe(false);
  });
});