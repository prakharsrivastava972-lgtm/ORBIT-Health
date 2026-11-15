# ORBIT Health: Requirements

ORBIT Health is a **self-monitoring and decision-support prototype**. It does not diagnose disease.
All demo data is **SIMULATED**.

## Modules
1. Mission Overview: profile, mission elapsed time, health summary, tasks, alerts
2. Biometrics: HR, BP, temperature, glucose, SpO2, sleep, hydration, weight (validated forms)
3. Body Explorer: clickable cardiovascular, skeletal, muscular, immune, respiratory, nervous systems
4. Health Intelligence Engine: baseline comparison, trends, explainable risk flags, uncertainty
5. Behavioral Check-in: mood, stress, fatigue, isolation, sleep quality
6. Hazards: radiation, microgravity, isolation/confinement, distance from Earth, closed environment
7. Recommendations: exercise, nutrition, hydration, sleep, stress, escalation
8. History and Charts: Recharts on stored data
9. Warning Center: Normal / Attention / Urgent with escalation steps
10. Tasks and Gamification: points, streaks, milestones
11. Reports and Comms: printable summary, simulated flight-surgeon thread with delay
12. Settings and Profiles

## Non-functional
- No paid APIs; runs offline after install
- Loading, empty and error states everywhere
- Keyboard accessible; status never conveyed by color alone
- Responsive, phone to wide monitor
- Data enters only through adapter interfaces (SensorAdapter, StorageAdapter)

## Honest-science guardrails
1. Every rule has a `basis`: general-reference, personal-baseline or mission-configured. No NASA-threshold value exists.
2. Bone density loss, immune dysfunction and radiation injury are **not** inferred from vitals. They need dedicated assessments (e.g. DXA/QCT, clinical labs, dosimetry and medical review).
3. Output wording uses "flag", "deviation" and "discuss with flight surgeon", never "you have X". Unit tests will check this.
4. Every citation is marked `verified: false` until checked against the live source.