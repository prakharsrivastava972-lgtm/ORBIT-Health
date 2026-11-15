import type { AstronautProfile, HazardId, MetricKey } from '@/types';
import type { DomainKey } from '@/data/checkin';
import type { SystemId } from '@/data/systems';

/**
 * General educational context for this prototype. NOT NASA guidance, NOT a diagnosis tool.
 * Descriptions are qualitative. No exposure limits or medical thresholds are included.
 * Individual responses vary. Sources are listed as unverified until Phase 15.
 */
export type EnvironmentId = 'leo' | 'lunar' | 'deep-space';

export const ENVIRONMENT_LABEL: Record<EnvironmentId, string> = {
  leo: 'Low Earth orbit',
  lunar: 'Lunar orbit or surface',
  'deep-space': 'Deep space transit',
};

export const ENVIRONMENT_IDS = Object.keys(ENVIRONMENT_LABEL) as EnvironmentId[];

/** Derived from the mission location text of the (simulated) profile. */
export function environmentFor(profile: AstronautProfile): EnvironmentId {
  const loc = profile.mission.location.toLowerCase();
  if (loc.includes('deep')) return 'deep-space';
  if (loc.includes('lunar') || loc.includes('moon')) return 'lunar';
  return 'leo';
}

export interface HazardContent {
  id: HazardId;
  label: string;
  summary: string;
  byEnvironment: Record<EnvironmentId, string>;
  effects: string[];
  relatedSystems: SystemId[];
  relatedMetrics: MetricKey[];
  relatedBehavior: DomainKey[];
  measurable: false | 'partial';
  cannotMeasure: string[];
  requiredAssessments: string[];
  countermeasures: string[];
  dataGap: string;
  references: string[];
}

export const HAZARDS: HazardContent[] = [
  {
    id: 'radiation',
    label: 'Radiation',
    summary:
      "Beyond Earth's surface, crews are exposed to ionizing radiation from galactic cosmic rays, from trapped particles near Earth, and from occasional solar particle events.",
    byEnvironment: {
      leo: "In low Earth orbit the planet's magnetic field gives partial protection, but crews are still exposed to trapped particles and cosmic rays. Exposure varies with orbit and with space weather.",
      lunar:
        "Lunar orbit and the lunar surface lie largely outside the protection of Earth's magnetic field. Galactic cosmic rays and solar particle events are a bigger planning concern, and solar events can begin with little warning.",
      'deep-space':
        'In deep-space transit the crew relies mainly on spacecraft shielding and shelter procedures. Exposure builds up over the whole mission, and a rapid return to Earth is not possible.',
    },
    effects: [
      'Long-term exposure is associated with increased long-term health risks that are tracked over a career, not seen in daily vitals.',
      'Very large, sudden exposures are a separate acute concern and need medical evaluation, not self-assessment.',
      'Radiation effects on the nervous system and other organs are an active area of research.',
    ],
    relatedSystems: ['immune', 'nervous', 'cardiovascular'],
    relatedMetrics: [],
    relatedBehavior: [],
    measurable: false,
    cannotMeasure: [
      'Radiation dose received or accumulated',
      'Radiation injury or damage to cells and tissue',
      'Long-term cancer or other health risk',
      'Whether a solar particle event has occurred or how large it was',
    ],
    requiredAssessments: [
      'Personal and area dosimetry, reviewed by qualified specialists',
      'Space weather monitoring and shelter procedures',
      'Clinical evaluation by a flight surgeon, and long-term medical surveillance',
    ],
    countermeasures: [
      'Shielding, shelter areas and mission planning that limit exposure',
      'Following shelter procedures when a solar event is announced',
      'Reporting symptoms that appear after a known event to the flight surgeon',
    ],
    dataGap:
      'This app is not connected to dosimeters or space-weather feeds, so no radiation value is shown. A real system would receive them through a SensorAdapter and show them to dosimetry specialists.',
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
  {
    id: 'microgravity',
    label: 'Microgravity',
    summary:
      'Without the constant pull of gravity, body fluids shift, and bones, muscles and the cardiovascular system carry far less load than on Earth.',
    byEnvironment: {
      leo: "Crews in low Earth orbit live in continuous microgravity for the whole stay, and most research on bone, muscle and fluid-shift effects comes from this setting.",
      lunar:
        "Lunar orbit is microgravity. On the Moon's surface the pull is about one sixth of Earth's, which is a partial load whose long-term effect on the body is still being studied.",
      'deep-space':
        'Deep-space transit is continuous microgravity, usually for longer than a typical orbital stay, so the need for effective exercise countermeasures is higher.',
    },
    effects: [
      'Fluid shifts toward the upper body early in a mission.',
      'Bone and muscle are loaded less, which is associated with loss of bone mineral and muscle mass.',
      'Balance and spatial orientation need to adapt, and some people notice vision changes on long missions.',
    ],
    relatedSystems: ['cardiovascular', 'skeletal', 'muscular', 'nervous'],
    relatedMetrics: ['hr', 'sbp', 'dbp', 'weightKg', 'hydrationL'],
    relatedBehavior: [],
    measurable: 'partial',
    cannotMeasure: [
      'Bone density or fracture risk',
      'Muscle mass or strength',
      'Heart structure or vessel changes',
      'Vision or balance changes',
    ],
    requiredAssessments: [
      'Bone-density scanning (DXA or QCT)',
      'Strength and body-composition testing',
      'Cardiac and vascular imaging',
      'Eye examination and vestibular testing',
    ],
    countermeasures: [
      'Regular resistance and aerobic exercise',
      'Nutrition and fluid intake planned with the flight surgeon',
      'Logging exercise so missed sessions are visible',
    ],
    dataGap:
      'Heart rate, blood pressure, weight and fluid intake are partly related, so flags on them appear below. The main effects need the dedicated assessments listed here.',
    references: ['nasa-hrr', 'nasa-hsrb', 'twins-2019'],
  },
  {
    id: 'isolation-confinement',
    label: 'Isolation and confinement',
    summary:
      'A small crew lives and works in a small space for months, with limited privacy, few new people and a repetitive routine.',
    byEnvironment: {
      leo: 'A low Earth orbit station has frequent contact with family and ground teams, and crew rotations happen, which eases but does not remove the strain of confinement.',
      lunar: 'A lunar mission has a smaller crew, a longer time away, and fewer chances to leave the habitat, so living in a confined space for long stretches matters more.',
      'deep-space':
        'In deep-space transit the crew is confined for the longest time with no outside visitors, and the view of Earth shrinks, which can add to the sense of isolation.',
    },
    effects: [
      'Mood, motivation and sleep can change over a long mission.',
      'Team tension and monotony can build up.',
      'Isolation interacts with workload, sleep loss and stress.',
    ],
    relatedSystems: ['nervous', 'immune'],
    relatedMetrics: ['sleepHrs'],
    relatedBehavior: ['mood', 'stress', 'fatigue', 'isolation', 'sleepQuality'],
    measurable: 'partial',
    cannotMeasure: [
      'Team dynamics or how well the crew works together',
      'Mental health conditions',
      'Sleep quality and circadian timing from duration alone',
    ],
    requiredAssessments: [
      'Behavioral health review by a specialist',
      'Sleep assessment (for example actigraphy)',
      'Team and crew-climate review',
    ],
    countermeasures: [
      'Keeping routines for sleep, meals and exercise',
      'Planned contact with family and friends where possible',
      'Raising concerns early with the flight surgeon or behavioral health support',
    ],
    dataGap:
      "This hazard is tracked with the daily behavioral check-in and sleep duration. These are self-reported and approximate, and they don't replace a specialist review.",
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
  {
    id: 'distance-from-earth',
    label: 'Distance from Earth',
    summary:
      'The farther a crew travels, the slower communication becomes and the harder it is to get help, supplies or a return trip.',
    byEnvironment: {
      leo: 'In low Earth orbit communication with the ground is close to real time, and a return to Earth is comparatively quick. Medical support from the ground is easier to reach.',
      lunar:
        "At the Moon's average distance a one-way signal takes roughly 1.3 seconds, so conversation is possible but noticeably delayed. A return to Earth takes days.",
      'deep-space':
        'At the distance of Mars a one-way signal delay is very roughly 3 to 22 minutes depending on planetary positions, so real-time conversation is not possible and a quick return or resupply is not available. The crew must manage more on its own.',
    },
    effects: [
      'More medical decisions must be made on board, without live specialist help.',
      'Delays and the lack of quick return can add to stress.',
      'Supplies, medicines and equipment must cover foreseeable needs.',
    ],
    relatedSystems: ['nervous'],
    relatedMetrics: [],
    relatedBehavior: ['stress', 'isolation', 'mood'],
    measurable: 'partial',
    cannotMeasure: [
      'How ready the crew and supplies are for a medical event',
      'Decision quality under delayed communication',
      'Stress caused by remoteness, beyond self-reported ratings',
    ],
    requiredAssessments: [
      'Mission medical planning and supply review',
      'Crew medical training and autonomy drills',
      'Behavioral health review by a specialist',
    ],
    countermeasures: [
      'Clear reporting steps that still work with message delays (see the simulated Comms page, Phase 11)',
      'Prepared procedures and on-board decision support',
      'Regular, planned contact with the ground team',
    ],
    dataGap:
      'Signal delays shown here are approximate and illustrative. Behavioral check-in flags for stress, isolation and mood are the only app signals linked to this hazard.',
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
  {
    id: 'closed-environment',
    label: 'Hostile closed environment',
    summary:
      'The crew depends on the spacecraft for air, water, temperature and safety. Small faults can matter quickly, and there is nowhere else to go.',
    byEnvironment: {
      leo: 'A low Earth orbit station has mature life-support systems and regular monitoring, but air quality, noise, water and surfaces still need constant attention.',
      lunar: 'On the Moon fine, sharp dust can be carried into the habitat, adding a concern for airways and eyes on top of normal cabin air and water management.',
      'deep-space':
        'In deep-space transit every life-support system must run reliably for the whole mission, with limited ability to resupply or repair, so small drifts in air or water quality matter more.',
    },
    effects: [
      'Carbon dioxide, trace contaminants and dust can affect breathing, alertness and comfort.',
      'Noise, temperature, humidity and light affect sleep and performance.',
      'Water and surface microbes need monitoring in a sealed habitat.',
    ],
    relatedSystems: ['respiratory', 'immune', 'nervous'],
    relatedMetrics: ['spo2', 'tempC'],
    relatedBehavior: [],
    measurable: 'partial',
    cannotMeasure: [
      'Carbon dioxide level in the cabin air or in the blood',
      'Trace contaminants, dust or microbes',
      'Noise or lighting problems',
      'Why a temperature or SpO2 reading changed',
    ],
    requiredAssessments: [
      'Cabin atmosphere, water and surface monitoring',
      'Lung-function testing when symptoms appear',
      'Clinical evaluation by a flight surgeon',
    ],
    countermeasures: [
      'Reporting changes in air quality, smell, noise or temperature promptly',
      'Regular maintenance and filter changes as scheduled',
      'Keeping the living space clean and dry',
    ],
    dataGap:
      'SpO2 and body temperature are non-specific and are the only related app signals. The cabin itself needs environmental sensors, which this app does not have.',
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
];