import { makeEntrySchema, toMeasurements } from './validation';

const now = () => new Date(2026, 5, 1, 12, 0, 0);
const schema = makeEntrySchema('2026-04-01', now);
const ok = { kind: 'hr', value: '62', takenAt: '2026-06-01T08:00', context: '' };

function failedFields(input: unknown): string[] {
  const r = schema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => String(i.path[0]));
}

describe('biometric entry validation', () => {
  it('accepts a valid reading', () => {
    expect(schema.safeParse(ok).success).toBe(true);
  });
  it('rejects an empty value', () => {
    expect(failedFields({ ...ok, value: '' })).toContain('value');
  });
  it('rejects a non-numeric value', () => {
    expect(failedFields({ ...ok, value: 'abc' })).toContain('value');
  });
  it('rejects implausible values', () => {
    expect(failedFields({ ...ok, value: '400' })).toContain('value');
    expect(failedFields({ kind: 'spo2', value: '101', takenAt: ok.takenAt })).toContain('value');
  });
  it('rejects a measurement time in the future', () => {
    expect(failedFields({ ...ok, takenAt: '2026-06-02T08:00' })).toContain('takenAt');
  });
  it('rejects a measurement time before launch', () => {
    expect(failedFields({ ...ok, takenAt: '2026-03-01T08:00' })).toContain('takenAt');
  });
  it('requires systolic above diastolic', () => {
    expect(failedFields({ kind: 'bp', value: '70', value2: '80', takenAt: ok.takenAt })).toContain('value');
  });
  it('turns blood pressure into two stored manual readings', () => {
    const parsed = schema.parse({ kind: 'bp', value: '118', value2: '76', takenAt: ok.takenAt, context: 'rest' });
    const items = toMeasurements(parsed, 'astro-x', now());
    expect(items.map((m) => m.metric)).toEqual(['sbp', 'dbp']);
    expect(items.every((m) => m.source === 'manual' && m.context === 'rest')).toBe(true);
    expect(items.map((m) => m.value)).toEqual([118, 76]);
  });
});