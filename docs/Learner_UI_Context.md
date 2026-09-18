# Learner UI Context

## Overview
The Learner UI (learner-ui/) is the React frontend handling the officer experience, from baseline triage to 70:20:10 pathway enrollment.

## Tier 1 Polish Achievements
- **Formal Course Enrollment:** Selecting a 10% Formal Course now triggers a genuine LTI 1.3 redirect simulation overlay. It properly displays a spinner, the authentic course metadata (title, duration, mapped KCM competency), and a redirect message without relying on generic toasts or prohibited iframe embeds. A gracefully provided 'Mock iGOT Launch' button handles the exit.
- **Dynamic Assessment Rendering:** The UI dynamically renders varying JSON options shapes from the Sovereign AI without falling back to placeholder Option text.
