import { useMemo } from 'react';
import { evaluate, type EvaluationResult } from '@/engine/evaluate';
import { useCheckIns, useMeasurements } from '@/store/useDataStore';
import type { AstronautProfile, CheckIn, Measurement } from '@/types';

export function useEvaluation(profile: AstronautProfile): {
  evaluation: EvaluationResult | null;
  measurements: Measurement[];
  checkIns: CheckIn[];
  ready: boolean;
} {
  const { measurements, ready } = useMeasurements(profile);
  const checkIns = useCheckIns(profile);
  const evaluation = useMemo(
    () => (ready ? evaluate(profile, measurements, new Date(), checkIns) : null),
    [profile, measurements, checkIns, ready],
  );
  return { evaluation, measurements, checkIns, ready };
}