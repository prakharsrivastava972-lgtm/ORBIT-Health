import { computeBaseline, mad, median } from '../baselines';
import { run } from './helpers';

describe('baseline maths', () => {
  it('computes the median for odd and even counts', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('computes the median absolute deviation, ignoring outliers', () => {
    expect(mad([1, 2, 3, 4, 100])).toBe(1);
  });

  it('needs enough history and applies a minimum variation', () => {
    expect(computeBaseline(run('hr', Array(12).fill(60)), 'hr')).toBeNull();
    const b = computeBaseline(run('hr', Array(13).fill(60)), 'hr');
    expect(b).not.toBeNull();
    expect(b!.median).toBe(60);
    expect(b!.sigma).toBe(2);
    expect(b!.n).toBe(10);
  });
});