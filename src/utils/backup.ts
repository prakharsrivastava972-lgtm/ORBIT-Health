import { z } from 'zod';
import { sampleProfiles } from '@/data/profiles';
import type { ProfileOverride } from '@/data/profileOverrides';
import type { AlertRecords } from '@/engine/alerts';
import { useAlertStore } from '@/store/useAlertStore';
import { useAppStore } from '@/store/useAppStore';
import { useCommsStore } from '@/store/useCommsStore';
import { useDataStore } from '@/store/useDataStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useTaskStore } from '@/store/useTaskStore';
import type { CheckIn, CommsMessage, Measurement } from '@/types';

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface Backup {
  app: 'orbit-health';
  version: 1;
  exportedAt: string;
  activeProfileId: string;
  profileOverrides: Record<string, ProfileOverride>;
  measurements: Record<string, Measurement[]>;
  checkIns: Record<string, CheckIn[]>;
  alertRecords: Record<string, AlertRecords>;
  commsThreads: Record<string, CommsMessage[]>;
  taskDone: Record<string, Record<string, string[]>>;
}

const metric = z.enum(['hr', 'sbp', 'dbp', 'tempC', 'glucose', 'spo2', 'sleepHrs', 'hydrationL', 'weightKg']);
const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');
const rating = z.number().int().min(1).max(5);

const measurement = z.object({
  id: z.string(),
  astronautId: z.string(),
  metric,
  value: z.number().finite(),
  unit: z.string(),
  takenAt: iso,
  recordedAt: iso,
  source: z.enum(['manual', 'simulated', 'device']),
  context: z.enum(['rest', 'post-exercise', 'fasting', 'post-meal']).optional(),
});

const checkIn = z.object({
  id: z.string(),
  astronautId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: rating,
  stress: rating,
  fatigue: rating,
  isolation: rating,
  sleepQuality: rating,
  notes: z.string().max(500).optional(),
  requestsSupport: z.boolean().optional(),
});

const alertRecord = z.object({
  status: z.enum(['acknowledged', 'resolved']),
  signature: z.string(),
  at: z.string(),
  note: z.string().optional(),
});

const message = z.object({
  id: z.string(),
  from: z.enum(['crew', 'flight-surgeon']),
  sentAt: iso,
  deliveredAt: iso,
  body: z.string(),
  simulated: z.literal(true),
  replyTo: z.string().optional(),
});

const limitEntry = z.object({
  attentionLow: z.number().optional(),
  attentionHigh: z.number().optional(),
  urgentLow: z.number().optional(),
  urgentHigh: z.number().optional(),
});

const override = z.object({
  name: z.string().optional(),
  callsign: z.string().optional(),
  age: z.number().optional(),
  sex: z.enum(['F', 'M', 'X']).optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  conditions: z.array(z.string()).optional(),
  mission: z
    .object({
      name: z.string().optional(),
      launchDate: z.string().optional(),
      plannedDays: z.number().optional(),
      location: z.string().optional(),
    })
    .optional(),
  thresholds: z.record(z.string(), limitEntry).optional(),
});

const backupSchema = z.object({
  app: z.literal('orbit-health'),
  version: z.literal(1),
  exportedAt: z.string(),
  activeProfileId: z.string(),
  profileOverrides: z.record(z.string(), override),
  measurements: z.record(z.string(), z.array(measurement)),
  checkIns: z.record(z.string(), z.array(checkIn)),
  alertRecords: z.record(z.string(), z.record(z.string(), alertRecord)),
  commsThreads: z.record(z.string(), z.array(message)),
  taskDone: z.record(z.string(), z.record(z.string(), z.array(z.string()))),
});

export function createBackup(): Backup {
  return {
    app: 'orbit-health',
    version: 1,
    exportedAt: new Date().toISOString(),
    activeProfileId: useAppStore.getState().activeProfileId,
    profileOverrides: useProfileStore.getState().overrides,
    measurements: useDataStore.getState().measurements,
    checkIns: useDataStore.getState().checkIns,
    alertRecords: useAlertStore.getState().records,
    commsThreads: useCommsStore.getState().threads,
    taskDone: useTaskStore.getState().done,
  };
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export function parseBackup(text: string): ParseResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'File is too large (limit 5 MB).' };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  const r = backupSchema.safeParse(json);
  if (!r.success) {
    const i = r.error.issues[0];
    const where = i.path.length ? i.path.slice(0, 3).join(' > ') : 'file';
    return { ok: false, error: `Not a valid ORBIT Health backup (${where}: ${i.message}).` };
  }
  const backup = r.data as unknown as Backup;
  if (!sampleProfiles.some((p) => p.id === backup.activeProfileId)) backup.activeProfileId = sampleProfiles[0].id;
  return { ok: true, backup };
}

export function restoreBackup(b: Backup): void {
  useAppStore.setState({ activeProfileId: b.activeProfileId });
  useProfileStore.setState({ overrides: b.profileOverrides });
  useDataStore.setState({ measurements: b.measurements, checkIns: b.checkIns });
  useAlertStore.setState({ records: b.alertRecords });
  useCommsStore.setState({ threads: b.commsThreads });
  useTaskStore.setState({ done: b.taskDone });
}

/** Clears every store. Simulated history is regenerated the next time a profile is opened. */
export function resetEverything(): void {
  useAppStore.setState({ activeProfileId: sampleProfiles[0].id });
  useProfileStore.setState({ overrides: {} });
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAlertStore.setState({ records: {} });
  useCommsStore.setState({ threads: {} });
  useTaskStore.setState({ done: {} });
}