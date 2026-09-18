# KarmMitra AI - Frontend Context
This file combines context for both the Admin UI and the Learner UI.

## 1. Admin UI (Supervisor Dashboard)


**Status:** dYY FUNCTIONAL & DEMO-READY (Scaffolded with Synthetic Fallbacks)
**Directory:** dmin-ui/
**Target Audience:** Member 5 (Dashboard Developer) & Agent Assistants (Claude / Gemini)

## 1. Overview & Architecture
The Admin UI is a React 18 / Vite application (running on port 5174 typically) designed for MoSPI Institutional Leaders and NSSTA Supervisors. It visualizes the competency gaps, throughput, and LTI sync statuses of officials across the nation.

**Core Philosophy:** *Never show a broken screen to the SIH Judges.*
The dashboard is structurally complete. To guarantee resilience during the hackathon, both the frontend and the backend are equipped with graceful degradation mechanisms that inject highly realistic MoSPI synthetic data if real data is scarce or the network drops.

## 2. What is Present & Functional

### Frontend Structure (dmin-ui/)
- **Routing & Shell:** Uses 
eact-router-dom with AppLayout.jsx providing a persistent sidebar navigation shell.
- **Pages (Fully Scaffolded):**
  - Overview.jsx (Top-level KPIs and summaries)
  - CompetencyIntelligence.jsx
  - StateReadiness.jsx
  - DivisionReadinessPage.jsx
  - TrainingThroughput.jsx
  - CompetencyMatrix.jsx
  - Reports.jsx & Settings.jsx
- **Recharts Components (src/components/):**
  - CompetencyRadar.jsx (Maps required vs. current skill levels)
  - StateHeatmapTable.jsx (Sortable table of state-wise training completion)
  - DivisionReadiness.jsx (Stacked bar charts for FOD, SDRD, NAD)
  - CompetencyGapChart.jsx
- **Context Providers:**
  - AnalyticsContext.jsx: Global state manager that triggers the API fetch on load.

### Backend Integration (`backend/app/api/v1/endpoints/admin.py`)
- **Live Endpoint:** `GET /api/v1/admin/metrics` is live and registered in the FastAPI Gateway.
- **API Contract:** Returns a strict Pydantic `AdminMetricsOut` schema containing `AdminKPI`, `KCMRadarPoint`, `DivisionDataPoint`, `StateRanking`, and `RecentActivity`.
- **Dynamic Aggregations:** The endpoint has been fully modernized to execute real SQLAlchemy aggregations (`func.avg()`, `func.count()`) against the `AssessmentResult` and `OfficialProfile` tables, grouped by division and competency. It dynamically populates the radar and division charts based on live tests.

### Frontend API Client (`admin-ui/src/api/adminClient.js`)
- The Axios client pings `http://localhost:8000/api/v1/admin/metrics`.
- **Resilience:** It has a strict 2.5-second timeout. If the FastAPI backend is offline or unreachable, it catches the error and silently returns `buildMockAnalytics()` (local JS mock data) while injecting an `isLive: false` flag.

## 3. What Needs to be Built Next (Future Enhancements)

The UI renders perfectly and is wired to real backend SQL aggregations. For future expansion:

1. **Global Filter Wiring:**
   - Wire the existing `GlobalFilters.jsx` (Date Range, Division, State) to append query parameters to the Axios request, and update FastAPI to dynamically filter the SQL aggregations based on those params.


## 4. Tier 1 Polish Achievements (Completed)
- **Dynamic SQL Aggregations:** GET /api/v1/admin/metrics no longer relies on hardcoded data, fetching live func.count() and func.avg() aggregates from AssessmentResult.
- **Recent Activity Feed:** A 5-item recentActivity audit feed now populates from live LTI syncs.
- **Visual Fixes:** The Division Readiness table headers have been stripped of conflicting CSS, and the Competency Gap chart now displays accurate severity mapping colors.


## 2. Learner UI


## Overview
The Learner UI (learner-ui/) is the React frontend handling the officer experience, from baseline triage to 70:20:10 pathway enrollment.

## Tier 1 Polish Achievements
- **Formal Course Enrollment:** Selecting a 10% Formal Course now triggers a genuine LTI 1.3 redirect simulation overlay. It properly displays a spinner, the authentic course metadata (title, duration, mapped KCM competency), and a redirect message without relying on generic toasts or prohibited iframe embeds. A gracefully provided 'Mock iGOT Launch' button handles the exit.
- **Dynamic Assessment Rendering:** The UI dynamically renders varying JSON options shapes from the Sovereign AI without falling back to placeholder Option text.


## 3. Recent Updates (Tier 2 and Beyond)
- **Document Upload for Quiz (Learner UI):** Added an 'Upload PDF for Quiz' button to the dashboard that posts a file to the new /api/v1/assessment/generate-from-upload endpoint. The generated questions are routed dynamically into the existing AssessmentRunner.jsx.
- **Microservice Communication:** The FastAPI Gateway (backend) and the RAG engine (rag-service) communicate over a strictly enforced HTTP boundary (via POST /api/v1/rag/generate-from-text), resolving an earlier path-injection boundary violation.

