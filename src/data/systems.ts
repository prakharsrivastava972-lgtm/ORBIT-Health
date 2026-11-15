import type { MetricKey } from '@/types';

/**
 * General educational context for this prototype. NOT NASA guidance, NOT a diagnosis tool.
 * Individual responses to spaceflight vary. Sources are listed as unverified until Phase 15.
 */
export type SystemId = 'cardiovascular' | 'skeletal' | 'muscular' | 'immune' | 'respiratory' | 'nervous';

/** How much ordinary vital signs reflect this system. */
export type VitalsCoverage = 'none' | 'indirect' | 'partial';

export interface BodySystem {
  id: SystemId;
  label: string;
  summary: string;
  spaceflightContext: string[];
  relatedMetrics: MetricKey[];
  relatedNote: string;
  coverage: VitalsCoverage;
  cannotMeasure: string[];
  requiredAssessments: string[];
  hazards: string[];
  references: string[];
}

export const COVERAGE_LABEL: Record<VitalsCoverage, string> = {
  none: 'Not measurable from ordinary vitals',
  indirect: 'Indirect context only',
  partial: 'Partly reflected by vitals',
};

export const REFERENCE_LABEL: Record<string, string> = {
  'nasa-hrr': 'NASA Human Research Roadmap',
  'nasa-hsrb': 'NASA Human System Risk Board risk pages',
  'twins-2019': 'NASA Twins Study (Science, 2019)',
};

export const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    summary:
      'Heart and blood vessels. In microgravity, body fluids redistribute toward the upper body and the circulation no longer works against gravity.',
    spaceflightContext: [
      'Fluid shifts toward the head are a recognized feature of early spaceflight adaptation.',
      'Reduced gravitational load is associated with cardiovascular deconditioning on long missions, which can appear as reduced tolerance to standing after return to gravity.',
      'Exercise is a commonly used countermeasure. How well it works varies from person to person.',
    ],
    relatedMetrics: ['hr', 'sbp', 'dbp'],
    relatedNote:
      'Heart rate and blood pressure reflect cardiovascular state only partly. Resting values can look unremarkable while heart or vessel structure and function have changed.',
    coverage: 'partial',
    cannotMeasure: [
      'Changes in heart size, structure or pumping function',
      'Blood vessel stiffness or wall changes',
      'Heart rhythm abnormalities (a pulse reading is not a rhythm assessment)',
      'Tolerance to standing up after return to gravity',
    ],
    requiredAssessments: [
      'ECG and rhythm monitoring',
      'Echocardiography or other cardiac imaging',
      'Vascular ultrasound',
      'Orthostatic (stand) testing under medical direction',
    ],
    hazards: ['Microgravity'],
    references: ['nasa-hrr', 'nasa-hsrb', 'twins-2019'],
  },
  {
    id: 'skeletal',
    label: 'Skeletal',
    summary: 'Bones, especially weight-bearing sites such as the hips, spine and legs.',
    spaceflightContext: [
      'Without regular gravitational loading, bone is not stimulated as it is on Earth. Bone mineral loss at weight-bearing sites is a well-documented concern on long missions.',
      'Calcium released from bone can contribute to kidney-stone risk, which is one reason fluid intake is shown here as loose context.',
      'Resistance exercise and nutrition are common countermeasures. They do not remove the need for measurement.',
    ],
    relatedMetrics: ['hydrationL', 'weightKg'],
    relatedNote: 'No vital sign reflects bone density. Fluid intake and body weight are shown only as loose context.',
    coverage: 'none',
    cannotMeasure: [
      'Bone mineral density or bone strength',
      'Rate of bone turnover',
      'Fracture risk',
      'Kidney-stone formation (needs imaging or clinical assessment)',
    ],
    requiredAssessments: [
      'DXA or QCT bone-density scanning',
      'Blood and urine bone-turnover and calcium markers ordered by a clinician',
      'Renal imaging when clinically indicated',
    ],
    hazards: ['Microgravity'],
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
  {
    id: 'muscular',
    label: 'Muscular',
    summary: 'Skeletal muscle, especially the postural and leg muscles that work against gravity on Earth.',
    spaceflightContext: [
      'Reduced loading is associated with loss of muscle mass and strength, particularly in the legs and trunk.',
      'Exercise time and intensity are the main countermeasures. Skipped sessions matter more than any single vital sign.',
      'Body weight alone cannot separate muscle, fat and fluid changes.',
    ],
    relatedMetrics: ['weightKg'],
    relatedNote: 'Body weight is a very rough signal. It cannot show whether muscle, fat or fluid has changed.',
    coverage: 'indirect',
    cannotMeasure: [
      'Muscle mass or body composition',
      'Muscle strength or endurance',
      'Tendon and joint condition',
      'Ability to perform physically demanding mission tasks',
    ],
    requiredAssessments: [
      'Strength and functional testing',
      'Body-composition measurement (for example DXA, bioimpedance or imaging)',
      'Review of exercise logs by a flight surgeon or exercise specialist',
    ],
    hazards: ['Microgravity'],
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
  {
    id: 'immune',
    label: 'Immune',
    summary:
      'The immune system. Spaceflight combines several stressors that research has linked with changes in immune markers.',
    spaceflightContext: [
      'Studies of crewmembers have reported shifts in immune-cell and signaling markers during missions. Findings vary between people and studies.',
      'Stress, disrupted sleep, confinement and radiation exposure are all discussed as possible contributors.',
      'Reactivation of latent viruses has been reported in some crew studies, often without symptoms.',
    ],
    relatedMetrics: ['tempC', 'sleepHrs'],
    relatedNote:
      'Temperature and sleep are non-specific. A normal temperature does not show that immune function is normal, and a raised one does not identify a cause.',
    coverage: 'none',
    cannotMeasure: [
      'Immune function or immune-cell profile',
      'Viral reactivation or infection status',
      'Allergy or hypersensitivity changes',
      'The cause of a temperature change',
    ],
    requiredAssessments: [
      'Clinical blood tests and immune profiling ordered by a clinician',
      'Infection testing when symptoms appear',
      'Clinical examination by a flight surgeon',
    ],
    hazards: ['Isolation and confinement', 'Radiation', 'Closed environment'],
    references: ['nasa-hrr', 'nasa-hsrb', 'twins-2019'],
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    summary: 'Lungs and airways, and the air the crew breathes.',
    spaceflightContext: [
      'Without gravity, the distribution of air and blood flow in the lungs differs from that on Earth.',
      'In a sealed habitat, air quality (carbon dioxide, particulates, trace contaminants) matters directly for breathing and alertness.',
      'On surface missions, fine dust brought indoors is a recognized concern for airways and eyes.',
    ],
    relatedMetrics: ['spo2', 'hr'],
    relatedNote:
      'SpO2 shows blood oxygen saturation only. It can look normal while lung function, air quality or carbon dioxide exposure is a problem.',
    coverage: 'partial',
    cannotMeasure: [
      'Lung volumes and airflow',
      'Carbon dioxide level in the air or blood',
      'Cabin contaminants or dust exposure',
      'Airway inflammation',
    ],
    requiredAssessments: [
      'Spirometry and other lung-function tests',
      'Cabin atmosphere monitoring',
      'Clinical assessment if breathing symptoms occur',
    ],
    hazards: ['Closed environment', 'Microgravity'],
    references: ['nasa-hrr', 'nasa-hsrb'],
  },
  {
    id: 'nervous',
    label: 'Nervous',
    summary: 'Brain, spinal cord, balance and vision pathways, including sleep and circadian regulation.',
    spaceflightContext: [
      'Early in a mission many people have balance and motion-sickness symptoms while the vestibular system adapts.',
      'Vision changes on long missions have been described as spaceflight-associated neuro-ocular syndrome (SANS). Detecting it needs an eye examination.',
      'Sleep loss, circadian disruption, workload and isolation can affect mood, alertness and thinking. The behavioral check-in tracks self-reported signs.',
    ],
    relatedMetrics: ['sleepHrs'],
    relatedNote:
      'Sleep duration on its own says nothing about sleep quality, vision, balance or thinking performance.',
    coverage: 'indirect',
    cannotMeasure: [
      'Vision or eye-structure changes',
      'Balance and vestibular function',
      'Cognitive performance',
      'Sleep quality and circadian timing',
    ],
    requiredAssessments: [
      'Eye examination and retinal imaging',
      'Vestibular and balance testing',
      'Cognitive performance testing',
      'Sleep assessment (for example actigraphy) alongside the behavioral check-in',
    ],
    hazards: ['Microgravity', 'Isolation and confinement', 'Distance from Earth'],
    references: ['nasa-hrr', 'nasa-hsrb', 'twins-2019'],
  },
];

export const SYSTEM_IDS = BODY_SYSTEMS.map((s) => s.id);