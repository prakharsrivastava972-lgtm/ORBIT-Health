import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCheck, Eye, RotateCcw } from 'lucide-react';
import { canResolve, flagSignature, resolveNoteRequired, type AlertView } from '@/engine/alerts';
import { useAlertStore } from '@/store/useAlertStore';

interface Props {
  profileId: string;
  view: AlertView;
}

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border border-line/60 px-3 py-1.5 text-sm text-ink-muted hover:border-accent/50 hover:text-ink';

export default function AlertActions({ profileId, view }: Props) {
  const { flag, status, record } = view;
  const setRecord = useAlertStore((s) => s.setRecord);
  const clearRecord = useAlertStore((s) => s.clearRecord);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const resolvable = canResolve(flag);
  const noteRequired = resolveNoteRequired(flag);
  const noteId = `note-${flag.id}`;

  const acknowledge = () =>
    setRecord(profileId, flag.id, { status: 'acknowledged', signature: flagSignature(flag), at: new Date().toISOString() });

  const confirmResolve = () => {
    const trimmed = note.trim();
    if (noteRequired && trimmed === '') {
      setError('Add a short note on how this was handled (required for urgent flags).');
      return;
    }
    setRecord(profileId, flag.id, {
      status: 'resolved',
      signature: flagSignature(flag),
      at: new Date().toISOString(),
      note: trimmed === '' ? undefined : trimmed,
    });
  };

  return (
    <div className="px-1">
      {status === 'acknowledged' && record && (
        <p className="mb-2 text-xs text-ink-faint">Acknowledged {format(parseISO(record.at), 'MMM d, h:mm a')}.</p>
      )}

      {!resolving && (
        <div className="flex flex-wrap items-center gap-2">
          {status === 'active' && (
            <button type="button" onClick={acknowledge} aria-label={`Acknowledge: ${flag.title}`} className={btn}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Acknowledge
            </button>
          )}
          {resolvable && (
            <button type="button" onClick={() => setResolving(true)} aria-label={`Resolve: ${flag.title}`} className={btn}>
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Resolve…
            </button>
          )}
          {status === 'acknowledged' && (
            <button type="button" onClick={() => clearRecord(profileId, flag.id)} aria-label={`Undo acknowledgement: ${flag.title}`} className={btn}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Undo acknowledgement
            </button>
          )}
        </div>
      )}

      {!resolvable && (
        <p className="mt-2 text-xs text-ink-faint">
          A support request cannot be resolved here. It clears when a newer check-in replaces it. Acknowledge it so it is
          clear it has been seen, and contact the flight surgeon.
        </p>
      )}

      {resolving && (
        <div className="rounded-lg border border-line/60 bg-space-900/60 p-3">
          <label htmlFor={noteId} className="text-sm text-ink-muted">
            Resolution note {noteRequired ? '(required for urgent flags)' : '(optional)'}
          </label>
          <input
            id={noteId}
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError(null);
            }}
            maxLength={200}
            aria-invalid={error ? true : undefined}
            className="mt-1 w-full rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm text-ink hover:border-accent/50 aria-[invalid=true]:border-status-urgent"
          />
          {error && (
            <p role="alert" className="mt-1 text-xs text-status-urgent">
              {error}
            </p>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            Resolving hides this flag from the active status. It does not change any reading, and the flag returns if new
            data changes it.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={confirmResolve} className={btn}>
              Confirm resolve
            </button>
            <button
              type="button"
              onClick={() => {
                setResolving(false);
                setNote('');
                setError(null);
              }}
              className={btn}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}