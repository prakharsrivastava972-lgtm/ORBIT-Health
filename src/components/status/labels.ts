import type { Basis, Confidence } from '@/types';

export const BASIS_LABEL: Record<Basis, string> = {
  'general-reference': 'General reference range',
  'personal-baseline': 'Personal baseline',
  'mission-configured': 'Mission-configured limit',
  'self-reported': 'Self-reported rating (fixed rule)',
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};