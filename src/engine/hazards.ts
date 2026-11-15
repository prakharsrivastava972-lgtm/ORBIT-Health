import { ENVIRONMENT_LABEL, HAZARDS, type EnvironmentId, type HazardContent } from '@/data/hazards';
import type { DomainKey } from '@/data/checkin';
import type { HazardAssessment, RiskFlag, Severity } from '@/types';
import type { EvaluationResult } from './evaluate';

export interface HazardView {
  content: HazardContent;
  assessment: HazardAssessment;
  flags: RiskFlag[];
  /** Highest related flag severity, or 'none' when there are no related flags (which is NOT the same as no exposure). */
  state: Severity | 'none';
}

const RANK: Record<Severity, number> = { normal: 0, attention: 1, urgent: 2 };

/** Flags whose metric or behavioral area plausibly relates to the hazard. Radiation never has any. */
export function relatedFlags(hazard: HazardContent, flags: RiskFlag[]): RiskFlag[] {
  return flags.filter((f) => {
    if (f.metric === 'behavioral') {
      if (hazard.relatedBehavior.length === 0) return false;
      const part = f.id.split(':')[1];
      if (part === 'support' || part === 'multi') return true;
      return hazard.relatedBehavior.includes(part as DomainKey);
    }
    if (f.metric === 'hazard') return false;
    return hazard.relatedMetrics.includes(f.metric);
  });
}

export function assessHazards(evaluation: EvaluationResult, env: EnvironmentId): HazardView[] {
  return HAZARDS.map((content) => {
    const flags = relatedFlags(content, evaluation.flags);
    const state = flags.reduce<Severity | 'none'>(
      (acc, f) => (acc === 'none' || RANK[f.severity] > RANK[acc] ? f.severity : acc),
      'none',
    );
    return {
      content,
      flags,
      state,
      assessment: {
        hazardId: content.id,
        exposureContext: `${ENVIRONMENT_LABEL[env]}: ${content.byEnvironment[env]}`,
        relatedRiskIds: flags.map((f) => f.id),
        measurableFromVitals: content.measurable,
        requiredAssessments: content.requiredAssessments,
      },
    };
  });
}