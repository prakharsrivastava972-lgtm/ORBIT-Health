import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateCheckIns } from '@/data/checkinGenerator';
import { generateMeasurements } from '@/data/generators';
import type { AstronautProfile, CheckIn, Measurement } from '@/types';

interface DataState {
  measurements: Record<string, Measurement[]>;
  checkIns: Record<string, CheckIn[]>;
  /** Seeds simulated history (readings and check-ins) the first time a profile is opened. */
  ensureSeeded: (profile: AstronautProfile) => void;
  /** Discards stored data for the profile and regenerates simulated history. */
  regenerate: (profile: AstronautProfile) => void;
  addMeasurements: (profileId: string, items: Measurement[]) => void;
  removeMeasurement: (profileId: string, id: string) => void;
  /** One check-in per date: saving the same date again replaces it. */
  addCheckIn: (profileId: string, item: CheckIn) => void;
  removeCheckIn: (profileId: string, id: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      measurements: {},
      checkIns: {},
      ensureSeeded: (profile) => {
        const s = get();
        const needM = !s.measurements[profile.id];
        const needC = !s.checkIns[profile.id];
        if (!needM && !needC) return;
        set({
          measurements: needM ? { ...s.measurements, [profile.id]: generateMeasurements(profile) } : s.measurements,
          checkIns: needC ? { ...s.checkIns, [profile.id]: generateCheckIns(profile) } : s.checkIns,
        });
      },
      regenerate: (profile) =>
        set((s) => ({
          measurements: { ...s.measurements, [profile.id]: generateMeasurements(profile) },
          checkIns: { ...s.checkIns, [profile.id]: generateCheckIns(profile) },
        })),
      addMeasurements: (profileId, items) =>
        set((s) => ({
          measurements: { ...s.measurements, [profileId]: [...(s.measurements[profileId] ?? []), ...items] },
        })),
      removeMeasurement: (profileId, id) =>
        set((s) => ({
          measurements: {
            ...s.measurements,
            [profileId]: (s.measurements[profileId] ?? []).filter((m) => m.id !== id),
          },
        })),
      addCheckIn: (profileId, item) =>
        set((s) => {
          const others = (s.checkIns[profileId] ?? []).filter((c) => c.date !== item.date);
          return {
            checkIns: {
              ...s.checkIns,
              [profileId]: [...others, item].sort((a, b) => a.date.localeCompare(b.date)),
            },
          };
        }),
      removeCheckIn: (profileId, id) =>
        set((s) => ({
          checkIns: { ...s.checkIns, [profileId]: (s.checkIns[profileId] ?? []).filter((c) => c.id !== id) },
        })),
    }),
    { name: 'orbit-health:data', version: 1 },
  ),
);

const EMPTY: Measurement[] = [];
const EMPTY_CHECKINS: CheckIn[] = [];

export function useMeasurements(profile: AstronautProfile) {
  const list = useDataStore((s) => s.measurements[profile.id]);
  const ensureSeeded = useDataStore((s) => s.ensureSeeded);
  useEffect(() => {
    ensureSeeded(profile);
  }, [profile, ensureSeeded]);
  return { measurements: list ?? EMPTY, ready: list !== undefined };
}

export function useCheckIns(profile: AstronautProfile): CheckIn[] {
  const list = useDataStore((s) => s.checkIns[profile.id]);
  return list ?? EMPTY_CHECKINS;
}