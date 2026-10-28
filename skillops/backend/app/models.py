"""All SQLAlchemy ORM models for SkillOps."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(300), nullable=False)
    description   = Column(Text, nullable=True)
    priority      = Column(String(20), default="medium")   # low | medium | high | critical
    category      = Column(String(60), default="general")  # study | practice | career | devops | general
    due_date      = Column(String(20), nullable=True)       # YYYY-MM-DD
    completed     = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)


class StudyMaterial(Base):
    __tablename__ = "study_materials"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(300), nullable=False)
    content       = Column(Text, nullable=True)
    url           = Column(String(1000), nullable=True)
    material_type = Column(String(30), default="article")  # article | code | doc | pdf_text | link
    tags          = Column(Text, default="[]")              # JSON array
    liked         = Column(Boolean, default=False)
    summary       = Column(Text, nullable=True)             # AI-generated summary
    key_points    = Column(Text, nullable=True)             # JSON array of key takeaways
    flashcards    = Column(Text, nullable=True)             # JSON array of {q, a}
    created_at    = Column(DateTime, default=datetime.utcnow)


class DailyProgress(Base):
    __tablename__ = "daily_progress"
    id              = Column(Integer, primary_key=True, index=True)
    date            = Column(String(20), nullable=False, unique=True)  # YYYY-MM-DD
    score           = Column(Integer, default=0)         # quiz score 0-100
    tasks_completed = Column(Integer, default=0)
    topics_studied  = Column(Text, default="[]")         # JSON array of topic strings
    quiz_data       = Column(Text, nullable=True)         # JSON: {questions, answers, correct}
    streak_count    = Column(Integer, default=0)
    created_at      = Column(DateTime, default=datetime.utcnow)


class MistakeLog(Base):
    __tablename__ = "mistake_log"
    id              = Column(Integer, primary_key=True, index=True)
    content         = Column(Text, nullable=False)        # The mistake / missed concept
    category        = Column(String(60), default="general")  # coding | concept | interview | quiz
    context         = Column(Text, nullable=True)         # Additional context
    interval_1_date = Column(String(20), nullable=True)   # Day 1 review date
    interval_2_date = Column(String(20), nullable=True)   # Day 3 review date
    interval_3_date = Column(String(20), nullable=True)   # Day 7 review date
    reviewed_1      = Column(Boolean, default=False)
    reviewed_2      = Column(Boolean, default=False)
    reviewed_3      = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=datetime.utcnow)


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=True)
    role       = Column(String(20), nullable=False)   # user | assistant
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewRecord(Base):
    __tablename__ = "interview_records"
    id               = Column(Integer, primary_key=True, index=True)
    date             = Column(String(20), nullable=True)
    interview_type   = Column(String(30), default="technical")  # technical | behavioral | mixed
    questions        = Column(Text, default="[]")   # JSON array of question strings
    answers          = Column(Text, default="[]")   # JSON array of answer strings
    feedback         = Column(Text, default="[]")   # JSON array of per-question feedback
    overall_score    = Column(Integer, default=0)   # 0-100
    overall_feedback = Column(Text, nullable=True)
    strengths        = Column(Text, default="[]")   # JSON array
    weaknesses       = Column(Text, default="[]")   # JSON array
    completed        = Column(Boolean, default=False)
    created_at       = Column(DateTime, default=datetime.utcnow)
