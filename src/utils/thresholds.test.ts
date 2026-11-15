import { inputKey, parseThresholds, thresholdsToInputs } from './thresholds';

describe('threshold parsing', () => {
  it('accepts valid limits and ignores blank fields', () => {
    const r = parseThresholds({ [inputKey('hr', 'attentionHigh')]: '95', [inputKey('hr', 'urgentHigh')]: '120' });
    expect(r.errors).toEqual({});
    expect(r.thresholds).toEqual({ hr: { attentionHigh: 95, urgentHigh: 120 } });
  });

  it('returns nothing when everything is blank', () => {
    expect(parseThresholds({})).toEqual({ thresholds: {}, errors: {} });
  });

  it('rejects non-numbers and out-of-range values', () => {
    expect(parseThresholds({ [inputKey('hr', 'attentionHigh')]: 'abc' }).errors.hr).toMatch(/numbers only/i);
    expect(parseThresholds({ [inputKey('hr', 'attentionHigh')]: '999' }).errors.hr).toMatch(/between/i);
  });

  it('rejects limits that do not increase', () => {
    const r = parseThresholds({ [inputKey('spo2', 'urgentLow')]: '95', [inputKey('spo2', 'attentionLow')]: '90' });
    expect(r.errors.spo2).toMatch(/increase/i);
    expect(r.thresholds.spo2).toBeUndefined();
  });

  it('round-trips through the input form', () => {
    const t = { hr: { attentionHigh: 95 } };
    expect(parseThresholds(thresholdsToInputs(t)).thresholds).toEqual(t);
  });
});