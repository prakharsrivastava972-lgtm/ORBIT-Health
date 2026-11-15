# Health intelligence engine: rules

All logic lives in `src/engine/` as pure functions. Demo data is SIMULATED.
The engine compares numbers with limits and with the person's own history. It does not diagnose.

## Rules
| Rule | Compares with | Highest severity |
|------|---------------|------------------|
| Limit check | General reference limit, or a mission-profile limit | Attention or Urgent |
| Personal baseline | Median of up to 28 earlier readings (needs 10 earlier + 3 recent) | Attention only |
| Drift check | Straight-line trend of the last 7 readings (4+ days, R-squared >= 0.65, change > 2.5x usual variation) | Attention only |
| Context filter | Post-exercise HR/BP and post-meal glucose are excluded | not a flag |

- Only a limit can produce Urgent.
- Usual variation = 1.4826 x median absolute deviation, with a minimum per metric (`SIGMA_FLOOR`).
- Baseline flag: latest reading >= 3x usual variation away, or last 3 readings all >= 2x away on the same side.
- Drift check is skipped when the baseline check already flagged the metric.
- Mission-profile thresholds replace the general limits for that metric. Nothing is labeled as a NASA threshold.
- General limits (`referenceRanges.ts`) are illustrative round numbers chosen for this prototype and must be reviewed by a clinician before any real use.

## Data quality and confidence
- Low: latest reading older than 72 h, or fewer than 3 usable readings.
- High: fresh (36 h or less) and a baseline built from 14 or more readings.
- Medium: everything else.
- Missing metrics are shown as "No data", never as normal. Overall status is marked incomplete.

## Not measurable from vitals
Bone density loss, immune dysfunction and radiation injury are never inferred from these readings.
See the Body Explorer for the dedicated assessments they need.