"""
KarmMitra AI — Assessment Schemas (Member 1: Priyash)
======================================================

INTENT:
  Pydantic v2 data contracts for triage and assessment endpoints.
  These schemas define the EXACT JSON shape that Member 4's React
  components (BaselineTriage.jsx, AssessmentRunner.jsx) send and receive.

CONTRACT ALIGNMENT:
  - TriageQuestionOut matches what fetchTriageQuestions() in client.js expects
  - TriageResultOut matches what onComplete() callback in BaselineTriage.jsx parses
  - AssessmentRequestIn matches what AssessmentRunner.jsx submits
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# ─── Triage (Cold-Start Diagnostic) ──────────────────────────────────────

class TriageOption(BaseModel):
    """Single MCQ option for a triage question."""
    key: str = Field(description="Option letter: A, B, C, or D")
    text: str = Field(description="The answer text")


class TriageQuestionOut(BaseModel):
    """
    INTENT: Matches the shape that Member 4's BaselineTriage.jsx
    destructures: { id, questionText, options: [{key, text}], correctOption }
    """
    id: str = Field(description="Unique question identifier")
    competency_code: str = Field(description="KCM code this question evaluates")
    questionText: str = Field(description="The question prompt")  # camelCase for JS compat
    options: List[TriageOption] = Field(description="Exactly 4 answer choices")
    correctOption: str = Field(description="Key of the correct answer (A/B/C/D)")


class TriageQuestionPublicOut(BaseModel):
    """
    INTENT: Secure version of TriageQuestionOut that omits correctOption,
    preventing the answer key from leaking to the frontend.
    """
    id: str = Field(description="Unique question identifier")
    competency_code: str = Field(description="KCM code this question evaluates")
    questionText: str = Field(description="The question prompt")  # camelCase for JS compat
    options: List[TriageOption] = Field(description="Exactly 4 answer choices")


class TriageSubmitIn(BaseModel):
    """
    INTENT: Payload from Member 4 when the user finishes the 5-question triage.
    Includes the user identity (from LTI URL params) and computed score.

    WHY role_code is included:
      On first-ever submission, we auto-create the OfficialProfile.
      We need the FRAC role code to establish the FK relationship.
      (Blind Spot #1 fix — auto-upsert for new LTI-launched users)
    """
    user_id: str = Field(description="LTI sub claim, e.g., MOSPI_OFFICER_001")
    role_code: str = Field(description="FRAC role from LTI custom claims")
    score: Optional[float] = Field(default=None, ge=0, le=100, description="Triage score (0-100), optional if computed server-side")
    answers: dict = Field(
        default_factory=dict,
        description="Map of question_id → selected_option_key"
    )


class TriageResultOut(BaseModel):
    """
    INTENT: Response after triage submission. Member 4's onComplete callback
    uses this to transition from TriageView → DashboardView.
    """
    user_id: str
    score: float
    status: str = Field(description="completed | error")
    identified_gaps: List[str] = Field(
        default_factory=list,
        description="KCM competency codes where user scored below threshold"
    )


# ─── RAG Assessment (Full MCQ Quiz from Member 2) ────────────────────────

class AssessmentRequestIn(BaseModel):
    """
    INTENT: Gateway receives this from Member 4, proxies to Member 2's
    RAG service for MCQ generation against a specific competency.
    """
    user_id: str
    competency_code: str = Field(description="Which KCM competency to assess")
    competency_name: str = Field(description="Human-readable name for prompt context")
    question_count: int = Field(default=3, ge=1, le=10)


class MCQOptionOut(BaseModel):
    """Matches Member 2's GeneratedQuestion.options schema."""
    key: str
    text: str


class GeneratedQuestionOut(BaseModel):
    """
    INTENT: Mirror of Member 2's GeneratedQuestion Pydantic model.
    The gateway validates this shape before forwarding to the frontend.
    """
    competency_code: str
    question_text: str
    options: List[MCQOptionOut]
    correct_option: str
    justification: str


class AssessmentGenerateOut(BaseModel):
    """RAG-generated assessment payload returned to Member 4."""
    questions: List[GeneratedQuestionOut]


class AssessmentSubmitIn(BaseModel):
    """
    INTENT: Member 4 submits completed MCQ answers for scoring.
    The gateway scores them, stores the result, and triggers AGS passback.
    """
    user_id: str
    competency_code: str
    answers: dict = Field(description="Map of question_index → selected_option_key")
    correct_answers: dict = Field(description="Map of question_index → correct_option_key")
    lineitem_url: Optional[str] = Field(
        default=None,
        description="AGS lineitem URL from LTI session for grade passback"
    )


class AssessmentSubmitOut(BaseModel):
    """Response after assessment scoring and AGS passback attempt."""
    user_id: str
    competency_code: str
    score: float
    max_score: float
    ags_status: str = Field(description="pending | success | failed")
