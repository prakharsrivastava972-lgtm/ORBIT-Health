# Warning Center and Recommendations

All demo data is SIMULATED. Suggestions are general wellbeing context written for this prototype.
They are not medical advice, not NASA guidance, and contain no doses or targets.

## Alert states
- Normal: no unresolved flags. Not a medical clearance.
- Attention: at least one unresolved Attention flag.
- Urgent: at least one unresolved Urgent flag. Only a limit breach or a support request can cause this.

## Handling a flag
- Acknowledge: marks it as seen. It stays listed and still counts toward the status.
- Resolve: hides it from the active status. A note is required for Urgent flags.
- A support request cannot be resolved with a button. It clears when a newer check-in replaces it.
- Resolving never edits data. A record applies only while the flag's severity and explanation are unchanged,
  so new data that changes the flag makes it Active again.
- Reopen restores a resolved flag.

## Recommendations
- Every triggered suggestion lists the flags that caused it. Duplicates are merged.
- Resolved flags stop generating suggestions.
- A general routine (one item per category) is always shown and labeled as not triggered by a flag.