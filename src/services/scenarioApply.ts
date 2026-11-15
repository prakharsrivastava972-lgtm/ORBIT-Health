import { format, subDays } from 'date-fns';
import { buildScenario, type ScenarioId } from '@/data/scenarios';
import { useAlertStore } from '@/store/useAlertStore';
import { useDataStore } from '@/store/useDataStore';
import { useProfileStore } from '@/store/useProfileStore';
import { missionDay } from '@/utils/met';
import type { AstronautProfile } from '@/types';

const MIN_MISSION_DAY = 30;

/** Replaces one astronaut's readings and check-ins with scenario data and clears their alert states. */
export function applyScenario(
  profile: AstronautProfile,
  id: ScenarioId,
  now: Date = new Date(),
): { launchMoved: boolean } {
  let p = profile;
  let launchMoved = false;
  if (missionDay(profile.mission.launchDate, now) < MIN_MISSION_DAY) {
    const launchDate = format(subDays(now, 44), 'yyyy-MM-dd');
    useProfileStore.getState().update(profile.id, { mission: { launchDate } });
    p = { ...profile, mission: { ...profile.mission, launchDate } };
    launchMoved = true;
  }
  const data = buildScenario(p, id, now);
  useDataStore.setState((s) => ({
    measurements: { ...s.measurements, [p.id]: data.measurements },
    checkIns: { ...s.checkIns, [p.id]: data.checkIns },
  }));
  useAlertStore.setState((s) => ({ records: { ...s.records, [p.id]: {} } }));
  return { launchMoved };
}