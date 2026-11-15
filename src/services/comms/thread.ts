import type { EnvironmentId } from '@/data/hazards';
import type { CommsMessage } from '@/types';

/** Shortened delays so the simulation is easy to watch. Real delays are shown in the page for context. */
export const DEMO_ONE_WAY_SECONDS: Record<EnvironmentId, number> = { leo: 1, lunar: 2, 'deep-space': 10 };

export const REAL_DELAY_LABEL: Record<EnvironmentId, string> = {
  leo: 'well under a second',
  lunar: 'about 1.3 seconds',
  'deep-space': 'roughly 3 to 22 minutes at Mars distances',
};

/** Simulated time for the surgeon to read and answer. */
export const SURGEON_RESPONSE_SECONDS = 5;

const addSeconds = (d: Date, s: number) => new Date(d.getTime() + s * 1000);

/** A crew message plus its scripted reply. The reply is stored now but only shown once it has been delivered. */
export function buildExchange(
  body: string,
  replyText: string,
  now: Date,
  oneWaySeconds: number,
): [CommsMessage, CommsMessage] {
  const key = `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`;
  const crewDelivered = addSeconds(now, oneWaySeconds);
  const replySent = addSeconds(crewDelivered, SURGEON_RESPONSE_SECONDS);
  const replyDelivered = addSeconds(replySent, oneWaySeconds);

  const crew: CommsMessage = {
    id: `c-${key}`,
    from: 'crew',
    sentAt: now.toISOString(),
    deliveredAt: crewDelivered.toISOString(),
    body,
    simulated: true,
  };
  const reply: CommsMessage = {
    id: `s-${key}`,
    from: 'flight-surgeon',
    sentAt: replySent.toISOString(),
    deliveredAt: replyDelivered.toISOString(),
    body: replyText,
    simulated: true,
    replyTo: crew.id,
  };
  return [crew, reply];
}

/** Crew messages always show. Replies show only after they have been delivered. */
export function visibleMessages(messages: CommsMessage[], now: Date): CommsMessage[] {
  return messages
    .filter((m) => m.from === 'crew' || new Date(m.deliveredAt).getTime() <= now.getTime())
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

export function awaitingReply(messages: CommsMessage[], now: Date): boolean {
  return messages.some((m) => m.from === 'flight-surgeon' && new Date(m.deliveredAt).getTime() > now.getTime());
}