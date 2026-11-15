import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileOverride } from '@/data/profileOverrides';

interface ProfileState {
  overrides: Record<string, ProfileOverride>;
  /** Merges a patch. Pass `thresholds: {}` to clear thresholds. */
  update: (id: string, patch: ProfileOverride) => void;
  /** Removes profile edits but keeps thresholds. */
  clearFields: (id: string) => void;
  reset: (id: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      overrides: {},
      update: (id, patch) =>
        set((s) => {
          const cur = s.overrides[id] ?? {};
          const next: ProfileOverride = { ...cur, ...patch, mission: { ...cur.mission, ...patch.mission } };
          return { overrides: { ...s.overrides, [id]: next } };
        }),
      clearFields: (id) =>
        set((s) => {
          const thresholds = s.overrides[id]?.thresholds;
          const next = { ...s.overrides };
          if (thresholds) next[id] = { thresholds };
          else delete next[id];
          return { overrides: next };
        }),
      reset: (id) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[id];
          return { overrides: next };
        }),
    }),
    { name: 'orbit-health:profiles', version: 1 },
  ),
);