import { sampleProfiles } from '@/data/profiles';
import { makeProfileSchema, profileToValues, toOverride } from './profileValidation';

const schema = makeProfileSchema(() => new Date(2026, 5, 1, 12, 0, 0));
const ok = { ...profileToValues(sampleProfiles[0]), launchDate: '2026-04-01' };

const failed = (input: unknown) => {
  const r = schema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => String(i.path[0]));
};

describe('profile validation', () => {
  it('accepts a valid profile', () => {
    expect(schema.safeParse(ok).success).toBe(true);
  });
  it('requires a name and rejects bad numbers', () => {
    expect(failed({ ...ok, name: '  ' })).toContain('name');
    expect(failed({ ...ok, age: 'abc' })).toContain('age');
    expect(failed({ ...ok, age: '5' })).toContain('age');
    expect(failed({ ...ok, plannedDays: '1.5' })).toContain('plannedDays');
  });
  it('rejects a launch date in the future', () => {
    expect(failed({ ...ok, launchDate: '2026-06-02' })).toContain('launchDate');
  });
  it('converts values into an override with a parsed conditions list', () => {
    const o = toOverride({ ...ok, conditions: ' Allergies , , Asthma ' });
    expect(o.conditions).toEqual(['Allergies', 'Asthma']);
    expect(o.mission?.plannedDays).toBe(180);
  });
});