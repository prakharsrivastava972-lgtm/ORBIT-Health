# Behavioral check-in rules

Ratings are self-reported on a 1-5 scale. Demo check-ins are SIMULATED.
The fixed-scale rules are illustrative choices for this prototype. They are not a validated screening
questionnaire and do not assess or diagnose any mental health condition.

Concerning direction: stress, fatigue, isolation high; mood, sleep quality low.

| Rule | Fires when | Severity |
|------|------------|----------|
| Support request | Latest check-in asks to talk to someone | Urgent |
| Sustained concern | Last 3 check-ins (within 7 days) all rated 4-5 (stress, fatigue, isolation) or 1-2 (mood, sleep quality) | Attention |
| Most concerning rating | Latest rating is 5 (stress, fatigue, isolation) or 1 (mood, sleep quality) | Attention |
| Personal baseline shift | Mean of last 3 is >= 1.5 points more concerning than the median of up to 28 earlier check-ins (needs 10 earlier + 3 recent) | Attention |
| Several areas | 3 or more areas in the concerning range in the latest check-in | Attention |

- Only a support request can produce Urgent.
- One flag per area (sustained, then most concerning, then baseline shift).
- Rules about the present apply only when the latest check-in is 3 days old or less.
- Confidence is low with fewer than 3 check-ins or an old latest check-in, high with 17+ check-ins and a check-in from the last day, medium otherwise.
- Behavioral flags are part of the same overall status as the vitals and appear on Health Insights and the Overview.