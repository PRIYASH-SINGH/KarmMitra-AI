"""
KarmMitra AI — Admin Analytics Schemas (Member 1: Priyash)
===========================================================

INTENT:
  Data contracts for GET /api/v1/admin/metrics — the endpoint that
  Member 5's Admin Dashboard consumes.

CRITICAL CONTRACT:
  These field names MUST match exactly what adminClient.js expects:
    - metrics.kpi.totalAssessed
    - metrics.kpi.averageReadiness
    - metrics.kpi.criticalSkillGaps
    - metrics.kpi.nsstaWorkshopsScheduled
    - metrics.kcmRadar[].subject / required / current
    - metrics.divisionData[].name / proficient / needTraining
    - metrics.stateRankings[].state / totalStaff / completionRate / status

  If any key name changes here, Member 5's dashboard will render
  blank cards or throw undefined property errors. Coordinate before modifying.
"""

from pydantic import BaseModel, Field
from typing import List, Literal


class AdminKPI(BaseModel):
    """Top-level KPI cards displayed at the top of the Admin Dashboard."""
    totalAssessed: int = Field(description="Total officials who completed triage + assessment")
    averageReadiness: float = Field(description="Mean competency readiness percentage")
    criticalSkillGaps: int = Field(description="Number of competency domains below threshold")
    nsstaWorkshopsScheduled: int = Field(description="Upcoming NSSTA training sessions")


class KCMRadarPoint(BaseModel):
    """
    Single data point for the Competency Radar Chart (CompetencyRadar.jsx).
    Maps to Recharts <Radar> dataKey: 'required' and 'current'.
    """
    subject: str = Field(description="Competency name, e.g., 'CAPI Data Entry'")
    required: float = Field(description="Required threshold score (0-100)")
    current: float = Field(description="Current workforce average score (0-100)")


class DivisionDataPoint(BaseModel):
    """
    Stacked bar chart data for DivisionReadiness.jsx.
    Maps to Recharts <Bar> dataKey: 'proficient' and 'needTraining'.
    """
    name: str = Field(description="Division name, e.g., 'FOD (Field Operations)'")
    proficient: int = Field(description="Staff count who cleared competency threshold")
    needTraining: int = Field(description="Staff count with active competency gaps")


class StateRanking(BaseModel):
    """
    State/UT row for the admin tracking table.
    `status` values match the <Chip> color logic in AdminDashboard.jsx:
      'Optimal' → primary, 'Review Needed' → warning, 'Critical Gap' → error
    """
    state: str
    totalStaff: int
    completionRate: str = Field(description="Percentage string, e.g., '78%'")
    status: Literal["Optimal", "Review Needed", "Critical Gap"] = Field(description="Optimal | Review Needed | Critical Gap")


class AdminMetricsOut(BaseModel):
    """
    INTENT: Complete response for GET /api/v1/admin/metrics.
    This is the single JSON object that fetchAdminMetrics() returns
    to AdminDashboard.jsx. Every nested key must match exactly.
    """
    kpi: AdminKPI
    kcmRadar: List[KCMRadarPoint]
    divisionData: List[DivisionDataPoint]
    stateRankings: List[StateRanking]
