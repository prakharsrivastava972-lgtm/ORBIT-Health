import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TaskState {
  /** Self-reported completions: profile id -> date -> task ids. */
  done: Record<string, Record<string, string[]>>;
  setDone: (profileId: string, date: string, taskId: string, done: boolean) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      done: {},
      setDone: (profileId, date, taskId, done) =>
        set((s) => {
          const byDate = s.done[profileId] ?? {};
          const others = (byDate[date] ?? []).filter((id) => id !== taskId);
          const next = done ? [...others, taskId] : others;
          return { done: { ...s.done, [profileId]: { ...byDate, [date]: next } } };
        }),
    }),
    { name: 'orbit-health:tasks', version: 1 },
  ),
);