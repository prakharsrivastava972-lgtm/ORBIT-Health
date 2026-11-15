import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AlertRecord, AlertRecords } from '@/engine/alerts';
import type { AstronautProfile } from '@/types';

interface AlertState {
  records: Record<string, AlertRecords>;
  setRecord: (profileId: string, flagId: string, record: AlertRecord) => void;
  clearRecord: (profileId: string, flagId: string) => void;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set) => ({
      records: {},
      setRecord: (profileId, flagId, record) =>
        set((s) => ({
          records: { ...s.records, [profileId]: { ...(s.records[profileId] ?? {}), [flagId]: record } },
        })),
      clearRecord: (profileId, flagId) =>
        set((s) => {
          const next = { ...(s.records[profileId] ?? {}) };
          delete next[flagId];
          return { records: { ...s.records, [profileId]: next } };
        }),
    }),
    { name: 'orbit-health:alerts', version: 1 },
  ),
);

const EMPTY: AlertRecords = {};

export function useAlertRecords(profile: AstronautProfile): AlertRecords {
  const records = useAlertStore((s) => s.records[profile.id]);
  return records ?? EMPTY;
}