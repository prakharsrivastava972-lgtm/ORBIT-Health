import { BODY_SYSTEMS } from './systems';

describe('body system content', () => {
  it('defines the six required systems', () => {
    expect(BODY_SYSTEMS.map((s) => s.id).sort()).toEqual(
      ['cardiovascular', 'immune', 'muscular', 'nervous', 'respiratory', 'skeletal'].sort(),
    );
  });

  it('every system states its limits and the dedicated assessments needed', () => {
    for (const s of BODY_SYSTEMS) {
      expect(s.cannotMeasure.length).toBeGreaterThan(0);
      expect(s.requiredAssessments.length).toBeGreaterThan(0);
      expect(s.spaceflightContext.length).toBeGreaterThan(0);
      expect(s.references.length).toBeGreaterThan(0);
    }
  });

  it('never presents bone or immune status as measurable from vitals', () => {
    const coverage = (id: string) => BODY_SYSTEMS.find((s) => s.id === id)!.coverage;
    expect(coverage('skeletal')).toBe('none');
    expect(coverage('immune')).toBe('none');
  });

  it('avoids diagnostic wording', () => {
    const text = JSON.stringify(BODY_SYSTEMS);
    expect(text).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b/i);
  });
});