import { ENVIRONMENT_IDS, HAZARDS, environmentFor } from './hazards';
import { sampleProfiles } from './profiles';

describe('hazard content', () => {
  it('defines the five required hazards', () => {
    expect(HAZARDS.map((h) => h.id).sort()).toEqual(
      ['closed-environment', 'distance-from-earth', 'isolation-confinement', 'microgravity', 'radiation'].sort(),
    );
  });

  it('every hazard states its limits, assessments and context for all three environments', () => {
    for (const h of HAZARDS) {
      expect(h.cannotMeasure.length).toBeGreaterThan(0);
      expect(h.requiredAssessments.length).toBeGreaterThan(0);
      expect(h.countermeasures.length).toBeGreaterThan(0);
      expect(h.references.length).toBeGreaterThan(0);
      for (const env of ENVIRONMENT_IDS) expect(h.byEnvironment[env].length).toBeGreaterThan(20);
    }
  });

  it('never presents radiation as measurable from vitals or tied to any vital sign', () => {
    const r = HAZARDS.find((h) => h.id === 'radiation')!;
    expect(r.measurable).toBe(false);
    expect(r.relatedMetrics).toEqual([]);
    expect(r.relatedBehavior).toEqual([]);
  });

  it('avoids diagnostic wording', () => {
    expect(JSON.stringify(HAZARDS)).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b/i);
  });

  it('derives a mission environment from each sample profile', () => {
    expect(sampleProfiles.map(environmentFor)).toEqual(['lunar', 'leo', 'deep-space']);
  });
});