import { format, subDays } from 'date-fns';
import type { AstronautProfile } from '@/types';

/** ISO date such that today is mission day `day` (launch day = day 1). */
const launchForDay = (day: number) => format(subDays(new Date(), day - 1), 'yyyy-MM-dd');

/** All profiles are fictional and SIMULATED. No thresholds are preloaded. */
export const sampleProfiles: AstronautProfile[] = [
  {
    id: 'astro-voss',
    name: 'Mara Voss',
    callsign: 'Helios',
    age: 41,
    sex: 'F',
    heightCm: 168,
    weightKg: 62,
    mission: {
      name: 'Lunar Orbit Outpost Rotation (simulated)',
      launchDate: launchForDay(45),
      plannedDays: 180,
      location: 'Lunar orbit outpost (simulated)',
    },
    conditions: [],
    isSimulated: true,
  },
  {
    id: 'astro-okafor',
    name: 'Daniel Okafor',
    callsign: 'Tern',
    age: 47,
    sex: 'M',
    heightCm: 181,
    weightKg: 83,
    mission: {
      name: 'Low Earth Orbit Station Expedition (simulated)',
      launchDate: launchForDay(112),
      plannedDays: 180,
      location: 'Low Earth orbit station (simulated)',
    },
    conditions: ['Seasonal allergies'],
    isSimulated: true,
  },
  {
    id: 'astro-tanaka',
    name: 'Yuki Tanaka',
    callsign: 'Kite',
    age: 36,
    sex: 'M',
    heightCm: 172,
    weightKg: 68,
    mission: {
      name: 'Deep-Space Transit Analog (simulated)',
      launchDate: launchForDay(8),
      plannedDays: 450,
      location: 'Deep-space transit habitat (simulated)',
    },
    conditions: [],
    isSimulated: true,
  },
];