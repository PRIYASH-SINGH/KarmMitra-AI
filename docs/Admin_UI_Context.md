# KarmMitra AI - Admin UI (Supervisor Dashboard) Context

**Status:** dYY FUNCTIONAL & DEMO-READY (Scaffolded with Synthetic Fallbacks)
**Directory:** dmin-ui/
**Target Audience:** Member 5 (Dashboard Developer) & Agent Assistants (Claude / Gemini)

## 1. Overview & Architecture
The Admin UI is a React 18 / Vite application (running on port 5174 typically) designed for MoSPI Institutional Leaders and NSSTA Supervisors. It visualizes the competency gaps, throughput, and LTI sync statuses of officials across the nation.

**Core Philosophy:** *Never show a broken screen to the SIH Judges.*
The dashboard is structurally complete. To guarantee resilience during the hackathon, both the frontend and the backend are equipped with graceful degradation mechanisms that inject highly realistic MoSPI synthetic data if real data is scarce or the network drops.

## 2. What is Present & Functional

### Frontend Structure (dmin-ui/)
- **Routing & Shell:** Uses eact-router-dom with AppLayout.jsx providing a persistent sidebar navigation shell.
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

### Backend Integration (ackend/app/api/v1/endpoints/admin.py)
- **Live Endpoint:** GET /api/v1/admin/metrics is live and registered in the FastAPI Gateway.
- **API Contract:** Returns a strict Pydantic AdminMetricsOut schema containing AdminKPI, KCMRadarPoint, DivisionDataPoint, and StateRanking.
- **Hybrid Data:** The endpoint currently reads the real user_count from the OfficialProfile Postgres table and adds it to the base metrics, but primarily returns a rich, hardcoded MoSPI dataset to ensure charts are beautifully populated for the demo.

### Frontend API Client (dmin-ui/src/api/adminClient.js)
- The Axios client pings http://localhost:8000/api/v1/admin/metrics.
- **Resilience:** It has a strict 2.5-second timeout. If the FastAPI backend is offline or unreachable, it catches the error and silently returns uildMockAnalytics() (local JS mock data) while injecting an isLive: false flag.

## 3. What Needs to be Built Next (Real-Time Wiring)

While the UI renders perfectly, it is currently displaying ~90% synthetic data. If time permits before the SIH submission, the following should be executed to make the dashboard entirely dynamic:

1. **Replace Backend Mocks with SQL Aggregations:**
   - In dmin.py, replace the hardcoded AdminMetricsOut response by executing GROUP BY SQL queries on the AssessmentResult and OfficialProfile tables using unc.avg() and unc.count().
2. **LTI AGS Passback Logging:**
   - Create a TriagePassbackTable.jsx in the frontend.
   - Add an endpoint GET /api/v1/admin/sync-status to query the gs_passback_status column in the database, allowing supervisors to monitor real-time syncs with the iGOT LMS.
3. **Global Filter Wiring:**
   - Wire the existing GlobalFilters.jsx (Date Range, Division, State) to append query parameters to the Axios request, and update FastAPI to dynamically filter the SQL aggregations based on those params.
