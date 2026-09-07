"""
Zero-Hallucination MCQ Generator & Sovereign AI Engine.
Interacts with local Llama-3-8B (via Ollama/vLLM /api/generate endpoint),
enforces a strict zero-hallucination prompt grounded purely on retrieved MoSPI context,
and validates all outputs against Pydantic schemas.
"""

import json
import re
from typing import List, Optional
import httpx
from pydantic import BaseModel, Field, field_validator

# Support relative import when running as part of a package, or direct script execution
if __package__:
    from .config import LLM_HOST, LLM_MODEL
else:
    import sys
    from pathlib import Path
    _pkg_root = Path(__file__).resolve().parent.parent
    if str(_pkg_root) not in sys.path:
        sys.path.insert(0, str(_pkg_root))
    from app.config import LLM_HOST, LLM_MODEL



class MCQOption(BaseModel):
    """Represents a single multiple-choice option."""
    key: str = Field(..., description="Option key, typically 'A', 'B', 'C', or 'D'")
    text: str = Field(..., description="Option answer text")


class GeneratedQuestion(BaseModel):
    """Represents a single zero-hallucination competency assessment question."""
    competency_code: str = Field(..., description="KCM official competency code")
    question_text: str = Field(..., description="Assessment question stem")
    options: List[MCQOption] = Field(..., description="Exactly 4 multiple-choice options")
    correct_option: str = Field(..., description="Correct option identifier ('A', 'B', 'C', or 'D')")
    justification: str = Field(..., description="Source-grounded evidence quoting/paraphrasing context")

    @field_validator("options")
    @classmethod
    def validate_four_options(cls, v: List[MCQOption]) -> List[MCQOption]:
        if len(v) != 4:
            raise ValueError(f"Each question must have exactly 4 options; received {len(v)}")
        return v

    @field_validator("correct_option")
    @classmethod
    def validate_correct_key(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if cleaned not in {"A", "B", "C", "D"}:
            raise ValueError(f"correct_option must be one of 'A', 'B', 'C', or 'D'; got '{v}'")
        return cleaned


class AssessmentPayload(BaseModel):
    """Full assessment payload containing a list of validated questions."""
    questions: List[GeneratedQuestion] = Field(..., description="List of validated MCQ questions")


class SovereignAIEngine:
    """
    Client for local LLM inference (Llama-3-8B) hosted via Ollama or vLLM.
    Enforces zero-hallucination constraint and validates against Pydantic schema.
    """

    def __init__(self, host: Optional[str] = None, model: Optional[str] = None):
        self.host = (host or LLM_HOST).rstrip("/")
        self.model = model or LLM_MODEL

    def build_prompt(
        self,
        context: str,
        competency_name: str,
        competency_code: str,
        count: int = 3
    ) -> str:
        """
        Constructs a specialized psychometric evaluation prompt strictly forbidding
        hallucination or external assumptions beyond the provided context.
        """
        return f"""You are an elite psychometric assessment creator and senior statistical evaluator for the National Statistical Systems Training Academy (NSSTA) and Ministry of Statistics and Programme Implementation (MoSPI), Government of India.

Your mission is to generate exactly {count} rigorous multiple-choice assessment questions for the following competency:
COMPETENCY NAME: {competency_name}
COMPETENCY CODE: {competency_code}

=========================================
CRITICAL ZERO-HALLUCINATION POLICY:
=========================================
1. PURE SOURCE GROUNDING: Every question stem, correct option, and distractor MUST BE SOLELY and EXCLUSIVELY derived from the REFERENCE CONTEXT provided below.
2. ABSOLUTELY NO OUTSIDE KNOWLEDGE: You are strictly forbidden from utilizing any external knowledge, outside world facts, unmentioned statistical formulas, or assumptions not explicitly present in the text.
3. If an operational procedure, threshold, or concept is not stated in the reference context, DO NOT ask questions about it.
4. GROUNDED JUSTIFICATION: Every question must include a 'justification' field that directly quotes or faithfully paraphrases the exact sentence(s) in the REFERENCE CONTEXT supporting the answer.
5. FORMAT INTEGRITY: Generate exactly {count} questions. Each question MUST contain exactly 4 options with keys "A", "B", "C", "D".

=========================================
REFERENCE CONTEXT FROM MoSPI / NSSTA MANUALS:
=========================================
{context}
=========================================
END OF REFERENCE CONTEXT
=========================================

REQUIRED JSON OUTPUT FORMAT:
{{
  "questions": [
    {{
      "competency_code": "{competency_code}",
      "question_text": "Detailed question stem based exclusively on the context above?",
      "options": [
        {{"key": "A", "text": "Option A text"}},
        {{"key": "B", "text": "Option B text"}},
        {{"key": "C", "text": "Option C text"}},
        {{"key": "D", "text": "Option D text"}}
      ],
      "correct_option": "A",
      "justification": "Exact quote or direct reference from context explaining why option A is correct."
    }}
  ]
}}

Return ONLY the raw JSON object conforming strictly to the schema above. Do NOT wrap in markdown code fences (no ```json or ```). Do NOT provide commentary, intro, or outro.
"""

    async def generate_mcqs(
        self,
        context: str,
        competency_name: str,
        competency_code: str,
        count: int = 3
    ) -> AssessmentPayload:
        """
        POSTs the prompt to the local LLM endpoint ({host}/api/generate), parses the
        resulting JSON response, and validates it against AssessmentPayload.
        Validation errors are propagated directly to the caller.
        """
        prompt = self.build_prompt(
            context=context,
            competency_name=competency_name,
            competency_code=competency_code,
            count=count,
        )

        url = f"{self.host}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        raw_response_text = data.get("response", "").strip()

        # Clean optional markdown code blocks if present
        if raw_response_text.startswith("```"):
            raw_response_text = re.sub(r"^```(?:json)?\s*", "", raw_response_text)
            raw_response_text = re.sub(r"\s*```$", "", raw_response_text)

        parsed_json = json.loads(raw_response_text)

        # Accommodate top-level list if LLM returns a list directly
        if isinstance(parsed_json, list):
            parsed_json = {"questions": parsed_json}

        # Validate with strict Pydantic schema; propagate ValidationError if malformed
        return AssessmentPayload.model_validate(parsed_json)
