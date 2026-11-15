import { sampleProfiles } from '@/data/profiles';
import { useDataStore } from '@/store/useDataStore';
import { useProfileStore } from '@/store/useProfileStore';
import { createBackup, parseBackup, restoreBackup, resetEverything } from './backup';

const id = sampleProfiles[0].id;

beforeEach(() => {
  localStorage.clear();
  resetEverything();
});

describe('backup', () => {
  it('round-trips data through export, reset and import', () => {
    useDataStore.getState().ensureSeeded(sampleProfiles[0]);
    useProfileStore.getState().update(id, { callsign: 'Zed' });
    const text = JSON.stringify(createBackup());
    resetEverything();
    expect(useDataStore.getState().measurements[id]).toBeUndefined();
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) restoreBackup(r.backup);
    expect(useProfileStore.getState().overrides[id]?.callsign).toBe('Zed');
    expect(useDataStore.getState().measurements[id].length).toBeGreaterThan(100);
  });

  it('rejects text that is not JSON', () => {
    const r = parseBackup('not json');
    expect(r.ok).toBe(false);
  });

  it('rejects files from another app', () => {
    expect(parseBackup(JSON.stringify({ app: 'other' })).ok).toBe(false);
  });

  it('rejects invalid records and names where the problem is', () => {
    useDataStore.getState().ensureSeeded(sampleProfiles[0]);
    const b = JSON.parse(JSON.stringify(createBackup()));
    b.measurements[id][0].value = 'x';
    const r = parseBackup(JSON.stringify(b));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/measurements/);
  });
});