# Hazard Monitor model

All demo data is SIMULATED. Hazard text is general educational context written for this prototype.
It is not NASA guidance and contains no exposure limits or medical thresholds.

| Hazard | Linked app signals | Measurable from vitals |
|--------|--------------------|------------------------|
| Radiation | none | No |
| Microgravity | HR, BP, weight, fluid intake | Partly |
| Isolation and confinement | Behavioral check-in areas, sleep duration | Partly |
| Distance from Earth | Behavioral stress, isolation, mood | Partly |
| Closed environment | SpO2, body temperature | Partly |

- A hazard shows the highest severity among related engine flags, or "No related flags".
  "No related flags" is never presented as "normal" or "safe".
- Radiation has no linked signals. Dose, injury and long-term risk need dosimetry and clinical assessment.
- Exposure context depends on the mission environment (low Earth orbit, lunar, deep space), derived from the profile.
- No hazard flags are generated, because no hazard sensors are connected. They would arrive through a SensorAdapter.
- Signal delays on the Distance hazard are approximate and illustrative.