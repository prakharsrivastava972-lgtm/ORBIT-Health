import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sampleProfiles } from '@/data/profiles';
import { mergeProfile } from '@/data/profileOverrides';
import { useProfileStore } from '@/store/useProfileStore';
import type { AstronautProfile } from '@/types';

interface AppState {
  activeProfileId: string;
  setActiveProfile: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProfileId: sampleProfiles[0].id,
      setActiveProfile: (id) => set({ activeProfileId: id }),
    }),
    {
      name: 'orbit-health:app',
      version: 1,
      partialize: (s) => ({ activeProfileId: s.activeProfileId }),
    },
  ),
);

/** Sample profiles with the user's edits applied. */
export function useProfiles(): AstronautProfile[] {
  const overrides = useProfileStore((s) => s.overrides);
  return useMemo(() => sampleProfiles.map((p) => mergeProfile(p, overrides[p.id])), [overrides]);
}

/** Active profile, falling back to the first one if the stored id is unknown. */
export function useActiveProfile(): AstronautProfile {
  const id = useAppStore((s) => s.activeProfileId);
  const profiles = useProfiles();
  return profiles.find((p) => p.id === id) ?? profiles[0];
}