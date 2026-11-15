import { missionDay, missionProgress } from './met';

describe('mission elapsed time', () => {
  it('launch day is day 1', () => {
    expect(missionDay('2026-01-01', new Date(2026, 0, 1))).toBe(1);
  });
  it('counts calendar days after launch', () => {
    expect(missionDay('2026-01-01', new Date(2026, 0, 10))).toBe(10);
  });
  it('returns 0 before launch', () => {
    expect(missionDay('2026-01-10', new Date(2026, 0, 1))).toBe(0);
  });
  it('computes progress and clamps at 100', () => {
    expect(missionProgress('2026-01-01', 180, new Date(2026, 1, 14))).toBe(25);
    expect(missionProgress('2026-01-01', 10, new Date(2026, 5, 1))).toBe(100);
  });
});