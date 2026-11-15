import { composeReply } from './responder';
import { awaitingReply, buildExchange, visibleMessages, SURGEON_RESPONSE_SECONDS } from './thread';

const ctx = { callsign: 'Helios', state: 'attention' as const, unresolvedFlags: 2 };
const t0 = new Date(2026, 5, 1, 12, 0, 0);
const at = (s: number) => new Date(t0.getTime() + s * 1000);

describe('simulated responder', () => {
  it('asks clarifying questions and is labeled as automated', () => {
    const r = composeReply('My sleep has been poor this week', ctx);
    expect(r).toMatch(/automated reply, not medical advice/i);
    expect(r).toMatch(/how many hours/i);
    expect(r).toMatch(/2 unresolved flags/);
  });

  it('points to emergency procedures for emergencies and self-harm wording', () => {
    expect(composeReply('I have chest pain', ctx)).toMatch(/emergency procedures/i);
    expect(composeReply('I might hurt myself', ctx)).toMatch(/behavioral health support/i);
  });

  it('avoids diagnostic wording', () => {
    const text = ['sleep', 'oxygen low', 'heart racing', 'temp high', 'stress', 'hello'].map((m) => composeReply(m, ctx)).join(' ');
    expect(text).not.toMatch(/\byou have\b|\bdiagnosed with\b|\byou are suffering\b|\bdepress|\banxiety\b/i);
  });
});

describe('message delay', () => {
  it('delivers the crew message after the one-way delay and the reply after a round trip plus response time', () => {
    const [crew, reply] = buildExchange('hi', 'ok', t0, 10);
    expect(new Date(crew.deliveredAt).getTime() - t0.getTime()).toBe(10000);
    expect(new Date(reply.sentAt).getTime() - new Date(crew.deliveredAt).getTime()).toBe(SURGEON_RESPONSE_SECONDS * 1000);
    expect(new Date(reply.deliveredAt).getTime() - t0.getTime()).toBe((10 + SURGEON_RESPONSE_SECONDS + 10) * 1000);
    expect(reply.replyTo).toBe(crew.id);
    expect(crew.simulated && reply.simulated).toBe(true);
  });

  it('hides the reply until it is delivered', () => {
    const msgs = buildExchange('hi', 'ok', t0, 10);
    expect(visibleMessages(msgs, at(5))).toHaveLength(1);
    expect(awaitingReply(msgs, at(5))).toBe(true);
    expect(visibleMessages(msgs, at(30))).toHaveLength(2);
    expect(awaitingReply(msgs, at(30))).toBe(false);
  });
});