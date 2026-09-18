# KarmMitra AI — Master Brief for Gemini (Read This First, Every Session)

Paste this at the start of any new Gemini session for this project. **If anything in your own memory or an earlier conversation conflicts with this file, this file wins** — it reflects the actual, verified current state as of September 18, 2026.

## Deadline
**Sunday, September 20, 2026, 11:59 PM.** Hard stop, not a soft target. Everything below is scoped against having roughly 2.5 days left.

## What this project is
KarmMitra AI (SIH26101, Team Tech Trishul) — an AI-enabled competency-gap platform for MoSPI officials, integrated with iGOT Karmayogi via LTI 1.3. One backend gateway (FastAPI, unified monorepo), two separate React frontends (Learner UI for officials, Admin UI for supervisors), and a mock LMS for local testing.

## The 5 rules that must never be broken, no matter how small the task looks

1. **Never fabricate content to look impressive.** No embedding real external content (videos, APIs, data) that isn't actually part of the system, even if it would "wow" a judge. If a feature doesn't exist yet, either build the real minimal version or leave it honestly absent. A proposal to embed a random YouTube video to fake a course player already happened once this week and was rejected — don't repeat variations of this pattern.
2. **Never hide or remove an honesty indicator to make something look more finished than it is.** "Demo Data" / `isLive: false` badges stay, always. Make them visually smaller if they're too loud — never invisible, never removed.
3. **Before building or "fixing" any UI page or component, check whether it already exists first.** This codebase has been built across many sessions by multiple AI tools. More than once, a session has proposed rebuilding something — the entire Admin dashboard shell, specifically — that already existed under a different file name, because it never checked first. Read the actual current files before assuming something is missing.
4. **Never report something as "done," "verified," or "working" without showing the actual proof** — real command output, real status codes, a real screenshot of it running. A description of code changes you made is not verification that they work. If you didn't run it and watch it succeed, say so plainly instead of implying it's confirmed.
5. **Diagnose before fixing.** If you're not certain whether a bug is in the frontend, the backend, or a model limitation, add logging and check first — don't guess at a root cause and patch based on the guess.

## Current honest status
- ✅ **Learner UI:** live, functional, generating real triage + RAG assessments
- ⚠️ **RAG MCQ generation:** works, but the small model (Llama-3.2-1B, downgraded from 8B for CPU speed) doesn't reliably hit exact question counts — needs a server-side guarantee/retry, not just prompt tuning
- ⚠️ **Admin UI:** real layout and components already exist (do not rebuild) — `AppLayout.jsx`, `Overview.jsx`, `CompetencyRadar.jsx`, `StateHeatmapTable.jsx`, `DivisionReadiness.jsx`, `CompetencyGapChart.jsx`, and more. The problem is ~90% of its *data* is hardcoded rather than pulled from the real database — that's a backend query problem, not a missing-frontend problem.
- ❓ **Full LTI flow (launch → triage → assessment → AGS grade passback):** every individual piece is built, but the whole chain has never been confirmed working start-to-finish in one live, watched run.
- ❌ **Not built, and not being attempted:** upload-your-own-document quiz generation, AI conversational assistant, virtual labs, predictive analytics, LTI passback monitoring table, global filter wiring, full competency profile fields (qualifications/experience/training history). These are legitimate future features, already honestly logged as roadmap items in the pitch deck — building any of them now is scope risk, not progress.
- 🔲 **PPT:** being fixed separately by a teammate. Not your responsibility, don't touch it.

## The only work left, in priority order

**Tier 1 — must finish, roughly in this order:**
1. Run the full E2E flow live, once, and watch it actually work — including confirming the grade lands in Mock iGOT's gradebook, not just that the gateway logs "success."
2. RAG answer-key server-side caching — stop trusting the client's submitted `correct_answers`, cache the real key at generation time and grade against that.
3. Guarantee exactly 3 MCQs are returned every time — server-side retry-then-fallback, not just prompt wording, since the smaller model won't reliably comply on its own.
4. Admin UI: real SQL aggregation in `admin.py` (replace the hardcoded metrics with `func.avg()`/`func.count()` queries), plus a small "recent activity" feed of real assessment results included in the same response.
5. Admin UI visual bugs: broken `<th>` CSS on the Division Readiness table, monochrome bar chart on the Competency Gaps page (needs severity-based color).
6. Seed 4-5 more KCM competency rows covering the Technical and Digital Governance domains — currently only Statistical and Behavioural are seeded, and the official problem statement names all four.
7. Polish the course-enrollment confirmation to show the real course title/duration before the iGOT redirect message, instead of a bare toast.

**Tier 2 — attempt only after every Tier 1 item is finished and confirmed actually working:**
- A minimal version of upload-a-document-and-get-a-quiz.

**Tier 3 — do not build, at all, regardless of spare time:** AI virtual assistant, virtual labs, predictive analytics, LTI passback monitoring table, global filters wiring, full competency profile fields. Confirmed cut. Do not revisit unless explicitly told the deadline moved.

## On the two separate frontends (Learner UI vs. Admin UI)
This is correct, intentional architecture, not a bug. Real products routinely separate an end-user app from an admin console. Do not merge them into one app or one codebase. For demo-video purposes, the answer is clean scene transitions between the two — not a technical merge.

## One rule specific to this late stage
**Do not run any broad, unscoped "audit the entire project and fix everything you find" style prompt from here to the deadline.** That kind of prompt was reasonable weeks ago when there was runway to absorb surprises. With under 3 days left, every change should come from the Tier 1 list above or a specific, reported bug — nothing open-ended. If you think something outside this list needs fixing, say so and wait for confirmation instead of fixing it unprompted.
