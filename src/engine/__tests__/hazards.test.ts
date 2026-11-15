import { format } from 'date-fns';
import { assessHazards } from '../hazards';
import { evaluate } from '../evaluate';
import type { CheckIn } from '@/types';
import { NOW, run, testProfile } from './helpers';

const view = (list: ReturnType<typeof assessHazards>, id: string) => list.find((v) => v.content.id === id)!;

describe('hazard mapping', () => {
  it('links an SpO2 flag to the closed environment and never to radiation', () => {
    const e = evaluate(testProfile, run('spo2', [...Array(20).fill(97), 88]), NOW);
    const hazards = assessHazards(e, 'leo');
    expect(view(hazards, 'closed-environment').assessment.relatedRiskIds).toContain('spo2:limit');
    expect(view(hazards, 'closed-environment').state).toBe('urgent');
    expect(view(hazards, 'radiation').flags).toEqual([]);
    expect(view(hazards, 'radiation').state).toBe('none');
    expect(view(hazards, 'radiation').assessment.measurableFromVitals).toBe(false);
  });

  it('links a support request to isolation and distance, not to radiation or the cabin', () => {
    const ci: CheckIn = {
      id: 'c', astronautId: 't', date: format(NOW, 'yyyy-MM-dd'),
      mood: 4, stress: 2, fatigue: 2, isolation: 2, sleepQuality: 4, requestsSupport: true,
    };
    const hazards = assessHazards(evaluate(testProfile, [], NOW, [ci]), 'deep-space');
    expect(view(hazards, 'isolation-confinement').assessment.relatedRiskIds).toContain('behavioral:support');
    expect(view(hazards, 'distance-from-earth').assessment.relatedRiskIds).toContain('behavioral:support');
    expect(view(hazards, 'radiation').flags).toEqual([]);
    expect(view(hazards, 'closed-environment').flags).toEqual([]);
  });

  it('reports no related flags (not "normal") when nothing is flagged', () => {
    const hazards = assessHazards(evaluate(testProfile, [], NOW), 'lunar');
    expect(hazards.every((h) => h.state === 'none')).toBe(true);
    expect(view(hazards, 'microgravity').assessment.exposureContext).toMatch(/^Lunar orbit or surface:/);
  });
});