# KarmMitra AI — Admin & Governance Dashboard

Institutional workforce competency intelligence platform for MoSPI, NSSTA
and iGOT Karmayogi administrators. Multi-page React admin app with sidebar
navigation, global filters, drill-down drawers, and a mock-first API
architecture.

## Run it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5174`. Production build: `npm run build`
(output in `dist/`), preview with `npm run preview`.

To point the frontend at a different backend, create a `.env` file with:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Pages

| Route                        | Page                     | What it shows |
|-------------------------------|--------------------------|----------------|
| `/`                            | Overview                 | KPI cards (clickable → detail drawer), "What needs attention" worklist, KCM radar, division bar chart, state readiness table |
| `/competency-intelligence`     | Competency Gaps          | KCM radar, gap-distribution chart, top critical gaps, full required-vs-current register with Priority chips (click a row for affected workforce + recommended training) |
| `/state-readiness`             | State & UT Readiness     | Sortable, filterable state table with Priority chips and a per-state detail drawer |
| `/division-readiness`          | Division Readiness       | FOD/SDRD/NAD/NSSTA chart + register table, click a row for training-demand detail |
| `/training-throughput`         | Training Progress        | Training planned/in-progress/completed KPIs, monthly completion trend, training demand by competency, division-wise training status, workshop status table |
| `/competency-matrix`           | KCM Competency Matrix    | Searchable competency × division status matrix (Proficient/Developing/Needs Training/Critical), clickable rows |
| `/reports`                     | Reports                  | View Report preview drawer, real Export CSV (client-side, from live data), Export PDF placeholder clearly marked as not yet connected |
| `/settings`                    | Settings / Profile       | Administrator profile and dashboard preferences |

Sidebar collapses to icon-only on desktop and becomes a temporary drawer on
mobile/tablet (`AppLayout` + `Sidebar`). Top header has a page title, a
LIVE DATA / DEMO DATA indicator, global search, assessment-cycle/state/
division/competency filters, Refresh, Export Report, and a working profile
menu (Administrator / Dashboard preferences / Sign out).

## Architecture

- **`src/data/mockData.js`** — single source of truth for all demo data
  (KPIs, KCM competencies, division/state readiness, training progress,
  competency matrix, governance alerts, reports, filter option lists).
  Nothing is hardcoded per-component; every page reads through this file or
  the live API response, which mirrors the same shape.
- **`src/api/adminClient.js`** — calls `GET {VITE_API_BASE_URL}/api/v1/admin/analytics`
  (defaults to `http://localhost:8000`). On any failure (backend not up,
  network drop) it falls back to `buildMockAnalytics()` from `mockData.js`
  and tags the response `isLive: false` — the dashboard never shows a
  broken screen, and the UI always knows whether it's showing live or demo
  data.
- **`src/context/AnalyticsContext.jsx`** — fetches once on mount, exposes
  `{ analytics, loading, lastUpdated, refresh }`. `refresh()` is what the
  header's Refresh button calls.
- **`src/context/FilterContext.jsx`** — holds global filter state
  (state/division/competency/cycle/status/search) plus shared
  `applyStateFilters` / `applyDivisionFilters` / `applyCompetencyFilters`
  helpers so every page filters the same way.
- **`src/context/NotificationContext.jsx`** — app-wide Snackbar, used by
  Refresh, Export, Reports and Settings.
- **`src/layout/`** — `AppLayout` (shell + responsive offset),
  `Sidebar` (nav + collapse/mobile drawer), `TopHeader` (title, data status,
  search, filters, refresh, export, profile menu).
- **`src/components/`** — shared building blocks: `StatCard` (clickable KPI
  cell with description), `DetailDrawer` (generic right-hand drawer used by
  every drill-down), `StatRowList` (label/value rows inside a drawer),
  `StatusChip` (shared Priority/status vocabulary), `GlobalFilters`,
  `PageHeader`, and the chart components (`CompetencyRadar`,
  `DivisionReadiness`, `CompetencyGapChart`) plus `StateHeatmapTable`.

### Expected shape of `/api/v1/admin/analytics`

Backend field names are preserved exactly as documented below — the
frontend only relabels them for display, it never renames or restructures
them.

```json
{
  "kpi": { "totalAssessed": 12480, "averageReadiness": 68.4, "criticalSkillGaps": 3, "nsstaWorkshopsScheduled": 24 },
  "kpiDetails": { "totalAssessed": { "label": "...", "summary": "...", "unit": "count", "breakdown": [{ "label": "...", "value": 0 }] } },
  "kcmRadar": [{ "subject": "CAPI Data Entry", "required": 85, "current": 62 }],
  "kcmCompetencies": [{ "code": "KCM_FUNC_STAT_04", "subject": "...", "domain": "...", "required": 85, "current": 62, "affectedStaff": 2140, "recommendedTraining": "..." }],
  "divisionData": [{ "code": "FOD", "name": "Field Operations Division", "proficient": 4200, "needTraining": 2100, "readinessPercent": 67, "trainingDemand": "..." }],
  "stateRankings": [{ "state": "Uttar Pradesh", "totalStaff": 1840, "completionRate": 78, "readiness": 74, "criticalGaps": 1, "status": "Optimal" }],
  "stateDetails": { "Uttar Pradesh": { "topGap": "...", "workshopsHeld": 6, "nextWorkshop": "2026-10-02", "note": "..." } },
  "trainingThroughput": { "kpi": { }, "monthly": [{ "month": "Apr", "scheduled": 3, "completed": 3, "enrolled": 620, "completedStaff": 540 }], "workshops": [{ "name": "...", "division": "FOD", "date": "2026-09-12", "status": "Scheduled" }] },
  "competencyMatrix": { "divisions": ["FOD", "SDRD", "NAD", "NSSTA"], "rows": [{ "competency": "...", "cells": { "FOD": "Critical" } }] },
  "alerts": [{ "id": "alert-1", "severity": "critical", "title": "...", "description": "...", "linkType": "competency", "linkId": "KCM_FUNC_TECH_07" }],
  "reports": [{ "id": "report-institutional", "title": "...", "description": "..." }],
  "filterOptions": { "states": [], "divisions": [{ "code": "FOD", "name": "..." }], "competencies": [], "cycles": [], "statuses": [] }
}
```

The frontend additionally tags the response with `isLive: true` on a
successful fetch (or `false` on the demo-data fallback) — this is added by
`adminClient.js`, not expected from the backend.

## Design notes

Palette and type are a restrained government/institutional system: deep
institutional blue `#123B5D` primary, muted blue `#1F5A7A` secondary, a
restrained saffron/amber `#C97A1E` accent used only for emphasis (gap bars,
alerts, active states), on a light neutral background `#F5F7F9` with white
`#FFFFFF` cards, hairline borders `#D9E1E7`, and Inter for all type. Modest
8–12px border radius, no gradients, no glassmorphism, no beige/yellow
blocks. Status and priority language (Critical/High/Moderate/On Track,
On Track/Needs Attention/Priority Support) is centralized in `StatusChip`
so the same word always maps to the same colour everywhere in the app.

## Verification checklist

- [x] Every source file passes an isolated JSX/syntax transform check.
- [x] Every relative import in the app resolves (verified via a bundle
      dependency-graph check).
- [ ] `npm install && npm run build` completes with no errors in an
      environment with registry access (not verified in this sandbox —
      see note below).
- [ ] Radar, bar and line charts resize cleanly on a full-screen
      presentation monitor without clipping labels.
- [ ] Disconnect the backend (`localhost:8000`) and confirm every page
      falls back to demo data with no unhandled error.
- [ ] Sidebar collapses correctly on tablet/mobile widths.

> **Note:** `npm install` could not be run in the environment this change
> was made in (no registry access). Every `.jsx`/`.js` file has been
> individually syntax-checked and the full relative-import graph has been
> verified to resolve with esbuild, but a real `vite build` should still be
> run once before shipping to catch anything a static check can't (e.g.
> MUI/Recharts prop-level issues).
