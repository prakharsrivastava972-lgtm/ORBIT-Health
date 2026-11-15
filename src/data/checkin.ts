export type DomainKey = 'mood' | 'stress' | 'fatigue' | 'isolation' | 'sleepQuality';

export interface BehaviorDomain {
  key: DomainKey;
  label: string;
  question: string;
  low: string;
  high: string;
  /** True when a higher rating is more concerning (stress, fatigue, isolation). */
  higherIsWorse: boolean;
}

export const BEHAVIOR_DOMAINS: BehaviorDomain[] = [
  { key: 'mood', label: 'Mood', question: 'How is your mood today?', low: 'Very low', high: 'Very good', higherIsWorse: false },
  { key: 'stress', label: 'Stress', question: 'How stressed do you feel today?', low: 'Not at all', high: 'Extremely', higherIsWorse: true },
  { key: 'fatigue', label: 'Fatigue', question: 'How tired do you feel today?', low: 'Well rested', high: 'Exhausted', higherIsWorse: true },
  { key: 'isolation', label: 'Isolation', question: 'How isolated or lonely do you feel?', low: 'Not at all', high: 'Very', higherIsWorse: true },
  { key: 'sleepQuality', label: 'Sleep quality', question: 'How was your sleep quality last night?', low: 'Very poor', high: 'Very good', higherIsWorse: false },
];

/** Concern score from 1 to 5, where 5 is most concerning. The mapping is its own inverse. */
export function burden(domain: BehaviorDomain, rating: number): number {
  return domain.higherIsWorse ? rating : 6 - rating;
}