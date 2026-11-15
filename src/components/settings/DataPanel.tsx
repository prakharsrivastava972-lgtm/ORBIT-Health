import { useState, type ChangeEvent } from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Trash2, Upload } from 'lucide-react';
import { MAX_BACKUP_BYTES, createBackup, parseBackup, resetEverything, restoreBackup } from '@/utils/backup';

const btn =
  'inline-flex items-center gap-2 rounded-lg border border-line/60 px-4 py-2 text-sm text-ink-muted hover:border-accent/50 hover:text-ink';

export default function DataPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const exportBackup = () => {
    setError(null);
    try {
      const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbit-health-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Backup downloaded.');
    } catch {
      setMessage(null);
      setError('Could not create the backup file.');
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setMessage(null);
      setError('File is too large (limit 5 MB).');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = parseBackup(String(reader.result ?? ''));
      if (!r.ok) {
        setMessage(null);
        setError(`${r.error} Nothing was changed.`);
      } else {
        restoreBackup(r.backup);
        setError(null);
        setMessage(`Backup restored (exported ${format(parseISO(r.backup.exportedAt), 'MMM d, yyyy h:mm a')}).`);
      }
      input.value = '';
    };
    reader.onerror = () => {
      setMessage(null);
      setError('Could not read the file.');
    };
    reader.readAsText(file);
  };

  const doReset = () => {
    resetEverything();
    setConfirming(false);
    setError(null);
    setMessage('All app data was reset. Simulated history is regenerated when you open a page.');
  };

  return (
    <section className="panel p-5" aria-labelledby="data-heading">
      <h2 id="data-heading" className="text-base font-semibold">
        Data: backup, restore and reset
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Everything is stored only in this browser (localStorage keys starting with orbit-health:). Clearing browser data removes it.
        Export a backup to keep a copy. The app uses metric units only.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={exportBackup} className={btn}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Export backup (JSON)
        </button>
        <label className={`${btn} cursor-pointer`}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import backup
          <input type="file" accept="application/json,.json" onChange={onFile} className="sr-only" aria-label="Import backup file" />
        </label>
        {!confirming && (
          <button type="button" onClick={() => setConfirming(true)} className={btn}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Reset all app data…
          </button>
        )}
      </div>

      {confirming && (
        <div role="alertdialog" aria-label="Confirm reset" className="mt-3 rounded-lg border border-status-urgent/40 bg-status-urgent/10 p-3">
          <p className="text-sm">
            This deletes all readings, check-ins, alert states, messages, task progress and profile edits on this device. It cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={doReset} className="rounded-lg border border-status-urgent/60 px-3 py-1.5 text-sm text-status-urgent hover:bg-status-urgent/10">
              Yes, reset everything
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={btn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm text-status-normal">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-status-urgent">
          {error}
        </p>
      )}
    </section>
  );
}