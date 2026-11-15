import { makeCheckInSchema, toCheckIn } from './checkinValidation';

const schema = makeCheckInSchema('2026-04-01', () => new Date(2026, 5, 1, 12, 0, 0));
const ok = {
  date: '2026-06-01',
  mood: '4',
  stress: '2',
  fatigue: '3',
  isolation: '2',
  sleepQuality: '4',
  notes: '',
  requestsSupport: false,
};

function failedFields(input: unknown): string[] {
  const r = schema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => String(i.path[0]));
}

describe('check-in validation', () => {
  it('accepts a complete check-in', () => {
    expect(schema.safeParse(ok).success).toBe(true);
  });
  it('requires every rating', () => {
    expect(failedFields({ ...ok, stress: '' })).toContain('stress');
    expect(failedFields({ ...ok, mood: '7' })).toContain('mood');
  });
  it('rejects a date in the future', () => {
    expect(failedFields({ ...ok, date: '2026-06-02' })).toContain('date');
  });
  it('rejects a date before launch', () => {
    expect(failedFields({ ...ok, date: '2026-03-31' })).toContain('date');
  });
  it('rejects overly long notes', () => {
    expect(failedFields({ ...ok, notes: 'x'.repeat(501) })).toContain('notes');
  });
  it('converts form values into a stored check-in', () => {
    const parsed = schema.parse({ ...ok, notes: '  slept badly  ', requestsSupport: true });
    const item = toCheckIn(parsed, 'astro-x');
    expect(item.id).toBe('astro-x-checkin-2026-06-01');
    expect(item.fatigue).toBe(3);
    expect(item.notes).toBe('slept badly');
    expect(item.requestsSupport).toBe(true);
  });
});