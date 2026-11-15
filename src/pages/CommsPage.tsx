import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, Send, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { ENVIRONMENT_LABEL, environmentFor } from '@/data/hazards';
import { applyAlertStates, summarizeAlerts } from '@/engine/alerts';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useNow } from '@/hooks/useNow';
import { composeReply } from '@/services/comms/responder';
import {
  DEMO_ONE_WAY_SECONDS,
  REAL_DELAY_LABEL,
  SURGEON_RESPONSE_SECONDS,
  awaitingReply,
  buildExchange,
  visibleMessages,
} from '@/services/comms/thread';
import { useActiveProfile } from '@/store/useAppStore';
import { useAlertRecords } from '@/store/useAlertStore';
import { useCommsStore } from '@/store/useCommsStore';
import { buildReport, shortSummary } from '@/utils/report';
import type { CommsMessage } from '@/types';

const EMPTY: CommsMessage[] = [];
const MAX_LEN = 1000;
const btn =
  'inline-flex items-center gap-2 rounded-lg border border-line/60 px-3 py-2 text-sm text-ink-muted hover:border-accent/50 hover:text-ink';

export default function CommsPage() {
  const profile = useActiveProfile();
  const { evaluation, checkIns, ready } = useEvaluation(profile);
  const records = useAlertRecords(profile);
  const thread = useCommsStore((s) => s.threads[profile.id] ?? EMPTY);
  const add = useCommsStore((s) => s.add);
  const clear = useCommsStore((s) => s.clear);
  const now = useNow(1000);

  const [text, setText] = useState('');
  const [attach, setAttach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  if (!ready || !evaluation) {
    return (
      <>
        <PageHeader title="Flight Surgeon Comms" description="Loading simulated mission data…" />
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </>
    );
  }

  const env = environmentFor(profile);
  const oneWay = DEMO_ONE_WAY_SECONDS[env];
  const shown = visibleMessages(thread, now);
  const waiting = awaitingReply(thread, now);

  const send = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      setSent(null);
      setError('Write a message first.');
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setSent(null);
      setError(`Messages can be at most ${MAX_LEN} characters.`);
      return;
    }
    const summary = summarizeAlerts(applyAlertStates(evaluation.flags, records));
    let body = trimmed;
    if (attach) {
      const report = buildReport(profile, evaluation, summary, checkIns, new Date());
      body += `\n\n--- Attached summary (simulated data) ---\n${shortSummary(report)}`;
    }
    const reply = composeReply(trimmed, {
      callsign: profile.callsign,
      state: summary.state,
      unresolvedFlags: summary.unresolved.length,
    });
    add(profile.id, buildExchange(body, reply, new Date(), oneWay));
    setText('');
    setError(null);
    setSent(`Message sent. It reaches the ground in ${oneWay} s (simulated delay).`);
  };

  return (
    <>
      <PageHeader
        title="Flight Surgeon Comms"
        description="Simulated crew-to-flight-surgeon messaging with communication delay."
      />

      <section className="panel p-5" aria-labelledby="delay-heading">
        <h2 id="delay-heading" className="label-caps !text-accent">
          Simulated link
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Environment: {ENVIRONMENT_LABEL[env]}. Real one-way signal delay here is {REAL_DELAY_LABEL[env]} (approximate, illustrative). This demo
          uses a shortened one-way delay of {oneWay} s and a {SURGEON_RESPONSE_SECONDS} s response time so you can watch it work.
        </p>
        <p className="mt-2 rounded-lg border border-status-attention/40 bg-status-attention/10 p-3 text-xs leading-relaxed text-status-attention">
          SIMULATION. Replies are scripted by an automated responder. No real clinician reads these messages, and nothing here is medical
          advice. In an emergency follow your mission emergency procedures.
        </p>
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="thread-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="thread-heading" className="text-base font-semibold">
            Conversation with the flight surgeon (simulated)
          </h2>
          <button type="button" onClick={() => clear(profile.id)} disabled={thread.length === 0} className={`${btn} disabled:opacity-40`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear conversation
          </button>
        </div>

        <div className="mt-4 space-y-3" role="log" aria-live="polite" aria-label="Messages">
          {shown.length === 0 && (
            <p className="rounded-lg border border-line/60 bg-space-900/60 p-4 text-sm text-ink-muted">
              No messages yet. Write one below. You can attach a short status summary from the current report.
            </p>
          )}
          {shown.map((m) => {
            const crew = m.from === 'crew';
            const inTransit = crew && new Date(m.deliveredAt).getTime() > now.getTime();
            return (
              <article
                key={m.id}
                className={`max-w-[85%] rounded-xl border p-3 ${
                  crew ? 'ml-auto border-accent/40 bg-accent/10' : 'border-line/60 bg-space-900/60'
                }`}
              >
                <p className="text-[11px] text-ink-faint">
                  {crew ? `You (${profile.callsign})` : 'Flight surgeon (simulated)'} ·{' '}
                  {format(parseISO(crew ? m.sentAt : m.deliveredAt), 'h:mm:ss a')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                {crew && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {inTransit
                      ? `In transit to ground (arrives ${format(parseISO(m.deliveredAt), 'h:mm:ss a')})`
                      : `Delivered to ground ${format(parseISO(m.deliveredAt), 'h:mm:ss a')}`}
                  </p>
                )}
              </article>
            );
          })}
          {waiting && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Awaiting reply from the simulated flight surgeon…
            </p>
          )}
        </div>
      </section>

      <section className="panel mt-6 p-5" aria-labelledby="compose-heading">
        <h2 id="compose-heading" className="text-base font-semibold">
          New message
        </h2>
        <label htmlFor="comms-text" className="mt-3 block text-sm text-ink-muted">
          Message
        </label>
        <textarea
          id="comms-text"
          rows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'comms-error' : undefined}
          className="mt-1 w-full rounded-lg border border-line/60 bg-space-900 px-3 py-2 text-sm text-ink hover:border-accent/50 aria-[invalid=true]:border-status-urgent"
        />
        <p className="mt-1 text-[11px] text-ink-faint">
          {text.length}/{MAX_LEN}
        </p>
        {error && (
          <p id="comms-error" role="alert" className="mt-1 text-xs text-status-urgent">
            {error}
          </p>
        )}

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="h-4 w-4 accent-[rgb(34,211,238)]" />
          Attach current report summary
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={send}
            className="inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Send message
          </button>
          {sent && (
            <p role="status" className="text-sm text-status-normal">
              {sent}
            </p>
          )}
        </div>
      </section>
    </>
  );
}