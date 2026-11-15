import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommsMessage } from '@/types';

interface CommsState {
  threads: Record<string, CommsMessage[]>;
  add: (profileId: string, items: CommsMessage[]) => void;
  clear: (profileId: string) => void;
}

export const useCommsStore = create<CommsState>()(
  persist(
    (set) => ({
      threads: {},
      add: (profileId, items) =>
        set((s) => ({ threads: { ...s.threads, [profileId]: [...(s.threads[profileId] ?? []), ...items] } })),
      clear: (profileId) => set((s) => ({ threads: { ...s.threads, [profileId]: [] } })),
    }),
    { name: 'orbit-health:comms', version: 1 },
  ),
);