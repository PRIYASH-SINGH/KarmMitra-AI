from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class TriageQuestion(Base):
    __tablename__ = "triage_questions"

    id = Column(Integer, primary_key=True, index=True)
    role_code = Column(String(50), index=True, nullable=False, comment="FRAC Role this question applies to")
    competency_code = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False, comment="List of options e.g. [{'key': 'A', 'text': '...'}, ...]")
    correct_option = Column(String(10), nullable=False)
