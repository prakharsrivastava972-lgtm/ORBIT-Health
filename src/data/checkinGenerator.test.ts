import { format } from 'date-fns';
import { generateCheckIns } from './checkinGenerator';
import type { AstronautProfile } from '@/types';

const base: AstronautProfile = {
  id: 'test-astro',
  name: 'Test Astronaut',
  callsign: 'Test',
  age: 40,
  sex: 'F',
  heightCm: 170,
  weightKg: 65,
  mission: { name: 'Test', launchDate: '2026-04-01', plannedDays: 180, location: 'Test' },
  conditions: [],
  isSimulated: true,
};
const now = new Date(2026, 5, 1, 23, 0, 0);

describe('simulated check-in generator', () => {
  it('is deterministic for the same profile and date', () => {
    expect(generateCheckIns(base, 30, now)).toEqual(generateCheckIns(base, 30, now));
  });

  it('produces ratings from 1 to 5 and leaves today for the user', () => {
    const data = generateCheckIns(base, 30, now);
    expect(data.length).toBeGreaterThan(20);
    const today = format(now, 'yyyy-MM-dd');
    for (const c of data) {
      expect(c.date).not.toBe(today);
      for (const v of [c.mood, c.stress, c.fatigue, c.isolation, c.sleepQuality]) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });

  it('never generates check-ins from before launch', () => {
    const short = { ...base, mission: { ...base.mission, launchDate: '2026-05-29' } };
    const data = generateCheckIns(short, 30, now);
    expect(data.length).toBeLessThanOrEqual(3);
    expect(data.every((c) => c.date >= '2026-05-29')).toBe(true);
  });
});