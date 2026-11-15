import type { RiskFlag } from '@/types';

/**
 * General wellbeing suggestions written for this prototype. NOT medical advice and NOT NASA guidance.
 * They contain no doses, targets or thresholds. Mission procedures and the flight surgeon take precedence.
 */
export type RecCategory = 'escalation' | 'sleep' | 'hydration' | 'nutrition' | 'exercise' | 'stress';

export const CATEGORY_ORDER: RecCategory[] = ['escalation', 'sleep', 'hydration', 'nutrition', 'exercise', 'stress'];

export const CATEGORY_LABEL: Record<RecCategory, string> = {
  escalation: 'Escalation',
  sleep: 'Sleep',
  hydration: 'Hydration',
  nutrition: 'Nutrition',
  exercise: 'Exercise',
  stress: 'Stress and wellbeing',
};

export type RecPriority = 'urgent' | 'attention';

export interface Recommendation {
  id: string;
  category: RecCategory;
  title: string;
  detail: string;
  priority: RecPriority;
  /** Ids of the flags that triggered this suggestion. Never empty. */
  triggeredBy: string[];
}

export interface RoutineItem {
  id: string;
  category: RecCategory;
  title: string;
  detail: string;
}

interface Template {
  id: string;
  category: RecCategory;
  title: string;
  detail: string;
}

const tpl = (id: string, category: RecCategory, title: string, detail: string): Template => ({ id, category, title, detail });

const TEMPLATE_LIST: Template[] = [
  tpl('esc-urgent', 'escalation', 'Contact the flight surgeon now',
    'Urgent flags need prompt medical review. Use your mission medical contact procedures. If anyone is in immediate danger, follow your mission emergency procedures. The simulated Comms page (Phase 11) lets you practice this.'),
  tpl('esc-support', 'escalation', 'Contact the flight surgeon or behavioral health support now',
    'You asked to talk to someone. That request is always escalated. Use your mission contact procedures, and follow emergency procedures if anyone is in immediate danger.'),
  tpl('esc-attention', 'escalation', 'Mention it at your next flight-surgeon check-in',
    'Note what you observed and when. Contact the flight surgeon sooner if it persists, gets worse, or you feel unwell.'),
  tpl('repeat-rest', 'escalation', 'Repeat the reading at rest',
    'Sit quietly for a few minutes, then repeat under the same conditions as your usual readings. Activity, caffeine, stress and technique can all move a single reading.'),
  tpl('temp-repeat', 'escalation', 'Repeat the temperature measurement',
    'Use the same method and site as usual. Record how you feel and any activity beforehand, and tell the flight surgeon about symptoms.'),
  tpl('glucose-repeat', 'escalation', 'Repeat the glucose measurement under the usual conditions',
    'If possible, repeat while fasting and note when you last ate. Glucose depends heavily on timing.'),
  tpl('spo2-repeat', 'escalation', 'Recheck the sensor and repeat the reading',
    'Warm your hands, keep still and check the sensor position, then repeat. Also check for any cabin air-quality alerts.'),
  tpl('spo2-symptoms', 'escalation', 'Report breathing symptoms straight away',
    'If you feel short of breath, dizzy or unwell, tell the flight surgeon and your crew immediately. Do not wait for a repeat reading.'),
  tpl('sleep-routine', 'sleep', 'Protect a consistent sleep routine',
    'Keep regular sleep and wake times, reduce light and noise around your sleep area, and wind down before bed as far as the mission schedule allows.'),
  tpl('sleep-discuss', 'sleep', 'Tell the flight surgeon if short sleep continues',
    'Ongoing sleep changes are worth discussing early. They can affect mood, alertness and performance.'),
  tpl('fluid-plan', 'hydration', 'Follow your mission fluid plan and log what you drink',
    'Ask the flight surgeon what daily intake suits you. This app does not set a personal fluid target.'),
  tpl('fluids-review', 'hydration', 'Review recent fluid intake',
    'Fluid intake, caffeine and sleep can all move heart rate and blood pressure. Check your recent logs for anything unusual.'),
  tpl('temp-rest', 'hydration', 'Rest and keep to your mission fluid plan if you feel unwell',
    'Rest, follow your mission fluid guidance, and tell the flight surgeon if symptoms continue.'),
  tpl('meal-review', 'nutrition', 'Review meal timing and content',
    'Note what and when you ate before the reading. Discuss any diet change with the flight surgeon or nutrition support before making it.'),
  tpl('weight-review', 'nutrition', 'Review intake and exercise logs with the flight surgeon',
    'Body weight alone cannot show whether muscle, fat or fluid changed. A review of logs gives a better picture.'),
  tpl('exercise-plan', 'exercise', 'Keep to your assigned exercise plan',
    'Do not change exercise intensity because of a flag alone. Ask the flight surgeon whether your plan needs adjusting.'),
  tpl('stress-techniques', 'stress', 'Use a stress-management routine that has worked for you',
    'Short breaks, slow breathing, a change of task or a brief chat with a crewmate. Choose what you find helpful.'),
  tpl('workload-rest', 'stress', 'Look at workload and rest periods',
    'Ask whether tasks can be rescheduled or shared, and protect planned rest.'),
  tpl('connect-contact', 'stress', 'Plan contact with other people',
    'Schedule time with crewmates, or a call with family or friends where mission communication allows.'),
  tpl('mood-routine', 'stress', 'Keep routines that support your mood',
    'Regular meals, exercise and time for something you enjoy. Mention changes that last to the flight surgeon or behavioral health support.'),
];

const TEMPLATES: Record<string, Template> = Object.fromEntries(TEMPLATE_LIST.map((t) => [t.id, t]));

const CARDIO = ['repeat-rest', 'exercise-plan', 'fluids-review'];
const METRIC_TEMPLATES: Record<string, string[]> = {
  hr: CARDIO,
  sbp: CARDIO,
  dbp: CARDIO,
  tempC: ['temp-repeat', 'temp-rest'],
  glucose: ['glucose-repeat', 'meal-review'],
  spo2: ['spo2-repeat', 'spo2-symptoms'],
  sleepHrs: ['sleep-routine', 'sleep-discuss'],
  hydrationL: ['fluid-plan'],
  weightKg: ['weight-review', 'exercise-plan'],
};

const DOMAIN_TEMPLATES: Record<string, string[]> = {
  stress: ['stress-techniques'],
  fatigue: ['sleep-routine', 'workload-rest'],
  isolation: ['connect-contact'],
  mood: ['mood-routine', 'connect-contact'],
  sleepQuality: ['sleep-routine'],
};

function templateIdsFor(flag: RiskFlag): string[] {
  const ids: string[] = [];
  if (flag.metric === 'behavioral') {
    const part = flag.id.split(':')[1];
    if (part === 'support') ids.push('esc-support');
    else if (part === 'multi') ids.push('stress-techniques', 'connect-contact');
    else ids.push(...(DOMAIN_TEMPLATES[part] ?? []));
  } else {
    ids.push(...(METRIC_TEMPLATES[flag.metric] ?? []));
  }
  if (flag.id !== 'behavioral:support') ids.push(flag.severity === 'urgent' ? 'esc-urgent' : 'esc-attention');
  return ids;
}

const PRIORITY_RANK: Record<RecPriority, number> = { urgent: 2, attention: 1 };

/** Every suggestion returned is tied to at least one flag. Duplicates are merged. */
export function buildRecommendations(flags: RiskFlag[]): Recommendation[] {
  const merged = new Map<string, Recommendation>();

  for (const flag of flags) {
    const severity = flag.severity;
    if (severity === 'normal') continue;
    for (const id of templateIdsFor(flag)) {
      const t = TEMPLATES[id];
      if (!t) continue;
      const existing = merged.get(id);
      if (existing) {
        if (!existing.triggeredBy.includes(flag.id)) existing.triggeredBy.push(flag.id);
        if (PRIORITY_RANK[severity] > PRIORITY_RANK[existing.priority]) existing.priority = severity;
      } else {
        merged.set(id, { ...t, priority: severity, triggeredBy: [flag.id] });
      }
    }
  }

  return [...merged.values()].sort(
    (a, b) =>
      PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.id.localeCompare(b.id),
  );
}

/** Always shown. Not triggered by any flag. */
export const ROUTINE: RoutineItem[] = [
  { id: 'r-exercise', category: 'exercise', title: 'Do your scheduled exercise sessions',
    detail: 'Exercise is a common countermeasure for the effects of microgravity. Follow the plan set by your flight surgeon and log missed sessions.' },
  { id: 'r-nutrition', category: 'nutrition', title: 'Eat according to your mission nutrition plan',
    detail: 'Regular meals and the planned food and supplements matter more than any single reading.' },
  { id: 'r-hydration', category: 'hydration', title: 'Log your fluid intake',
    detail: 'A daily log makes changes visible. Ask the flight surgeon what intake suits you.' },
  { id: 'r-sleep', category: 'sleep', title: 'Keep a regular sleep schedule',
    detail: 'Consistent sleep and wake times help sleep and alertness.' },
  { id: 'r-stress', category: 'stress', title: 'Complete your daily check-in',
    detail: 'A short daily check-in makes behavioral changes easier to notice early.' },
  { id: 'r-escalation', category: 'escalation', title: 'Know your escalation path',
    detail: 'Know how and when to contact the flight surgeon, including how message delays affect the plan.' },
];