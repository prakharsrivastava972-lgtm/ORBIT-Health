import type { AstronautProfile, MissionInfo, MissionThresholds } from '@/types';

/** User edits layered on top of a sample profile. Never replaces id or isSimulated. */
export interface ProfileOverride {
  name?: string;
  callsign?: string;
  age?: number;
  sex?: AstronautProfile['sex'];
  heightCm?: number;
  weightKg?: number;
  conditions?: string[];
  mission?: Partial<MissionInfo>;
  thresholds?: MissionThresholds;
}

export function mergeProfile(base: AstronautProfile, override?: ProfileOverride): AstronautProfile {
  if (!override) return base;
  return {
    ...base,
    ...override,
    mission: { ...base.mission, ...override.mission },
    id: base.id,
    isSimulated: base.isSimulated,
  };
}