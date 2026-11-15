import type { Severity } from '@/types';

/**
 * SIMULATED flight surgeon. Replies are scripted from keywords. No real clinician is involved
 * and nothing here is medical advice.
 */
export interface ReplyContext {
  callsign: string;
  state: Severity;
  unresolvedFlags: number;
}

const EMERGENCY = /chest pain|can'?t breathe|cannot breathe|trouble breathing|difficulty breathing|unconscious|passed out|severe bleeding|bleeding heavily|emergency/i;
const SELF_HARM = /suicid|kill myself|harm myself|hurt myself|end my life/i;

const TOPICS: { re: RegExp; text: string }[] = [
  { re: /sleep|insomnia|tired|fatigue/i, text: 'On sleep and tiredness: how many hours did you sleep over the last few nights, and has your schedule or workload changed?' },
  { re: /spo2|oxygen|breath|cough/i, text: 'On breathing and oxygen: did you recheck the sensor and repeat the reading, and have you noticed any change in cabin air or symptoms such as breathlessness?' },
  { re: /heart|pulse|blood pressure|\bbp\b|dizz/i, text: 'On heart rate, pressure or dizziness: were the readings taken at rest, and have caffeine, exercise, fluids or stress changed recently?' },
  { re: /temp|fever|chill/i, text: 'On temperature: which method and site did you use, and are there other symptoms such as aches or chills?' },
  { re: /stress|mood|lonel|isolat|down|worried/i, text: 'On how you are feeling: when did you first notice it, and what has helped or made it worse? A chat with a crewmate you trust may also help.' },
];

export function composeReply(body: string, ctx: ReplyContext): string {
  const head = 'Simulated flight surgeon (automated reply, not medical advice).';

  if (SELF_HARM.test(body)) {
    return `${head} What you describe matters. Please contact behavioral health support or a crewmate now, and follow your mission emergency procedures if anyone is in immediate danger. In a real mission the flight surgeon would speak with ${ctx.callsign} directly.`;
  }
  if (EMERGENCY.test(body)) {
    return `${head} If this is an emergency, follow your mission emergency procedures now and alert your crew. Do not wait for this message thread. In a real mission the flight surgeon would give direct guidance.`;
  }

  const topic = TOPICS.find((t) => t.re.test(body));
  const status =
    ctx.state === 'normal' || ctx.unresolvedFlags === 0
      ? 'The app currently shows no unresolved flags, which is not a medical clearance.'
      : `The app currently shows ${ctx.unresolvedFlags} unresolved flag${ctx.unresolvedFlags === 1 ? '' : 's'} with an overall status of ${ctx.state}.`;

  return [
    head,
    `Message received, ${ctx.callsign}. ${status}`,
    topic ? topic.text : 'To understand this better: when did it start, are there other symptoms, and has anything changed in activity, food, sleep or stress?',
    'Repeat any measurement under the same conditions as usual, note the details, and keep following your mission medical procedures. Contact the crew or flight surgeon sooner if it gets worse.',
  ].join(' ');
}