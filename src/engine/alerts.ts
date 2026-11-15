import type { RiskFlag, Severity } from '@/types';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertRecord {
  status: 'acknowledged' | 'resolved';
  /** Identifies the exact flag content that was acknowledged or resolved. */
  signature: string;
  at: string;
  note?: string;
}

export type AlertRecords = Record<string, AlertRecord>;

export interface AlertView {
  flag: RiskFlag;
  status: AlertStatus;
  record?: AlertRecord;
}

const RANK: Record<Severity, number> = { normal: 0, attention: 1, urgent: 2 };

/** If the flag's severity or explanation changes (for example after a new reading), an old record no longer applies. */
export function flagSignature(flag: RiskFlag): string {
  return `${flag.severity}|${flag.explanation}`;
}

export function applyAlertStates(flags: RiskFlag[], records: AlertRecords): AlertView[] {
  return flags.map((flag): AlertView => {
    const record = records[flag.id];
    if (record && record.signature === flagSignature(flag)) {
      return { flag, status: record.status, record };
    }
    return { flag, status: 'active' };
  });
}

/** A support request is never resolved with a button. It clears when a newer check-in replaces it. */
export function canResolve(flag: RiskFlag): boolean {
  return flag.id !== 'behavioral:support';
}

export function resolveNoteRequired(flag: RiskFlag): boolean {
  return flag.severity === 'urgent';
}

export interface AlertSummary {
  /** Highest severity among unresolved flags. Not a medical clearance when Normal. */
  state: Severity;
  active: AlertView[];
  acknowledged: AlertView[];
  resolved: AlertView[];
  unresolved: AlertView[];
}

export function summarizeAlerts(views: AlertView[]): AlertSummary {
  const unresolved = views.filter((v) => v.status !== 'resolved');
  const state = unresolved.reduce<Severity>(
    (acc, v) => (RANK[v.flag.severity] > RANK[acc] ? v.flag.severity : acc),
    'normal',
  );
  return {
    state,
    active: views.filter((v) => v.status === 'active'),
    acknowledged: views.filter((v) => v.status === 'acknowledged'),
    resolved: views.filter((v) => v.status === 'resolved'),
    unresolved,
  };
}