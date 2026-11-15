import { generateMeasurements } from './generators';
import { METRICS } from './metrics';
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

describe('simulated data generator', () => {
  it('is deterministic for the same profile and date', () => {
    expect(generateMeasurements(base, 30, now)).toEqual(generateMeasurements(base, 30, now));
  });

  it('produces plausible values and labels everything as simulated', () => {
    const data = generateMeasurements(base, 30, now);
    expect(data.length).toBeGreaterThan(200);
    for (const m of data) {
      expect(m.source).toBe('simulated');
      expect(m.unit).toBe(METRICS[m.metric].unit);
      expect(new Date(m.takenAt).getTime()).toBeLessThanOrEqual(now.getTime());
    }
    const hr = data.filter((m) => m.metric === 'hr').map((m) => m.value);
    expect(Math.min(...hr)).toBeGreaterThan(40);
    expect(Math.max(...hr)).toBeLessThan(100);
  });

  it('never generates data from before launch', () => {
    const short = { ...base, mission: { ...base.mission, launchDate: '2026-05-29' } };
    const data = generateMeasurements(short, 30, now);
    const days = new Set(data.map((m) => m.takenAt.slice(0, 10)));
    expect(days.size).toBeLessThanOrEqual(4);
    expect(data.every((m) => new Date(m.takenAt) >= new Date(2026, 4, 29))).toBe(true);
  });
});