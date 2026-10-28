"""
SkillOps - Database Configuration & Models
Async SQLite via SQLAlchemy + aiosqlite
"""
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float,
    DateTime, Date, ForeignKey, JSON, create_engine, event
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.pool import StaticPool

DATABASE_URL = "sqlite+aiosqlite:///./skillops.db"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


# ─── MODELS ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, default="Learner")
    email = Column(String(200), unique=True, index=True, nullable=True)
    avatar_color = Column(String(20), default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)
    skills = Column(JSON, default=list)  # ["Python", "DevOps", "Azure"]
    streak_count = Column(Integer, default=0)
    total_xp = Column(Integer, default=0)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    materials = relationship("StudyMaterial", back_populates="user", cascade="all, delete-orphan")
    daily_scores = relationship("DailyScore", back_populates="user", cascade="all, delete-orphan")
    mistakes = relationship("MistakeLog", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("InterviewRecord", back_populates="user", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="general")   # study, job, review, personal
    priority = Column(String(20), default="medium")    # low, medium, high
    due_date = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    xp_reward = Column(Integer, default=10)

    user = relationship("User", back_populates="tasks")


class StudyMaterial(Base):
    __tablename__ = "study_materials"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)     # pasted text / doc content
    url = Column(String(500), nullable=True)  # external link
    material_type = Column(String(30), default="article")  # article, snippet, doc, link, pdf
    tags = Column(JSON, default=list)
    liked = Column(Boolean, default=False)
    bookmarked = Column(Boolean, default=False)
    ai_summary = Column(Text, nullable=True)
    ai_flashcards = Column(JSON, nullable=True)   # [{"q": ..., "a": ...}]
    ai_key_points = Column(JSON, nullable=True)    # [str]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="materials")


class DailyScore(Base):
    __tablename__ = "daily_scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score_date = Column(Date, default=date.today)
    quiz_score = Column(Integer, default=0)       # 0-100
    tasks_completed = Column(Integer, default=0)
    tasks_total = Column(Integer, default=0)
    materials_studied = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    quiz_questions = Column(JSON, nullable=True)   # full quiz data
    quiz_answers = Column(JSON, nullable=True)     # user answers
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="daily_scores")


class MistakeLog(Base):
    __tablename__ = "mistake_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="concept")  # concept, code, interview, quiz
    source = Column(String(100), nullable=True)        # quiz, interview, self-note
    logged_at = Column(DateTime, default=datetime.utcnow)
    # Spaced-repetition schedule (3 intervals)
    review_1_date = Column(Date, nullable=True)   # Day 1
    review_3_date = Column(Date, nullable=True)   # Day 3
    review_7_date = Column(Date, nullable=True)   # Day 7
    review_1_done = Column(Boolean, default=False)
    review_3_done = Column(Boolean, default=False)
    review_7_done = Column(Boolean, default=False)
    ai_explanation = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)

    user = relationship("User", back_populates="mistakes")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)   # "user" | "assistant"
    content = Column(Text, nullable=False)
    context = Column(String(50), default="general")  # general, interview, quiz
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")


class InterviewRecord(Base):
    __tablename__ = "interview_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    interview_date = Column(DateTime, default=datetime.utcnow)
    job_role = Column(String(100), default="Junior Developer")
    domain = Column(String(50), default="fullstack")  # fullstack, devops, salesforce
    questions = Column(JSON, nullable=True)            # [{question, user_answer, ai_feedback, score}]
    overall_score = Column(Float, default=0.0)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    improvement_plan = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=15)
    completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="interviews")


# ─── DB INIT ─────────────────────────────────────────────────────────────────

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
