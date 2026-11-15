import { linearTrend } from '../trends';

describe('linear trend', () => {
  it('needs at least five points', () => {
    expect(linearTrend([0, 1, 2, 3].map((t) => ({ t, v: t })))).toBeNull();
  });

  it('measures slope, total change and fit', () => {
    const tr = linearTrend([0, 1, 2, 3, 4, 5].map((t) => ({ t, v: 2 * t })))!;
    expect(tr.slope).toBeCloseTo(2);
    expect(tr.change).toBeCloseTo(10);
    expect(tr.r2).toBeCloseTo(1);
    expect(tr.spanDays).toBe(5);
  });
});