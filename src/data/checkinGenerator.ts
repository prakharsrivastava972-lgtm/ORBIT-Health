import { format } from 'date-fns';
import type { AstronautProfile, CheckIn, Rating } from '@/types';
import { BEHAVIOR_DOMAINS, type DomainKey } from '@/data/checkin';
import { gaussian, hashSeed, mulberry32 } from '@/data/generators';
import { missionDay } from '@/utils/met';

/** Illustrative demo values only. */
const BASE: Record<DomainKey, { mean: number; sd: number }> = {
  mood: { mean: 4.0, sd: 0.6 },
  stress: { mean: 2.0, sd: 0.6 },
  fatigue: { mean: 2.2, sd: 0.6 },
  isolation: { mean: 2.0, sd: 0.5 },
  sleepQuality: { mean: 3.8, sd: 0.6 },
};

/**
 * SIMULATED daily check-ins up to YESTERDAY (today's check-in is left for the user).
 * About 8% of days are randomly missing. Never earlier than launch.
 */
export function generateCheckIns(profile: AstronautProfile, days = 30, now: Date = new Date()): CheckIn[] {
  const available = Math.min(days, missionDay(profile.mission.launchDate, now));
  const rand = mulberry32(hashSeed(`${profile.id}:checkin`));
  const out: CheckIn[] = [];

  for (let d = available - 1; d >= 1; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const noise = BEHAVIOR_DOMAINS.map(() => gaussian(rand));
    const skip = rand() < 0.08;
    if (skip) continue;

    const rate = (key: DomainKey): Rating => {
      const i = BEHAVIOR_DOMAINS.findIndex((x) => x.key === key);
      const b = BASE[key];
      return Math.min(5, Math.max(1, Math.round(b.mean + noise[i] * b.sd))) as Rating;
    };

    const date = format(day, 'yyyy-MM-dd');
    out.push({
      id: `${profile.id}-checkin-${date}`,
      astronautId: profile.id,
      date,
      mood: rate('mood'),
      stress: rate('stress'),
      fatigue: rate('fatigue'),
      isolation: rate('isolation'),
      sleepQuality: rate('sleepQuality'),
    });
  }
  return out;
}