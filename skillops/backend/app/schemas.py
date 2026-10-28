"""Pydantic schemas for all SkillOps models."""
from __future__ import annotations
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ── Tasks ─────────────────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    category: Optional[str] = "general"
    due_date: Optional[str] = None
    completed: Optional[bool] = False

class TaskCreate(TaskBase): pass
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None

class TaskResponse(TaskBase):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Study Materials ───────────────────────────────────────────────────────────

class MaterialBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: Optional[str] = None
    url: Optional[str] = None
    material_type: Optional[str] = "article"
    tags: Optional[str] = "[]"
    liked: Optional[bool] = False

class MaterialCreate(MaterialBase): pass
class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    material_type: Optional[str] = None
    tags: Optional[str] = None
    liked: Optional[bool] = None
    summary: Optional[str] = None
    key_points: Optional[str] = None
    flashcards: Optional[str] = None

class MaterialResponse(MaterialBase):
    id: int
    summary: Optional[str] = None
    key_points: Optional[str] = None
    flashcards: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Daily Progress ────────────────────────────────────────────────────────────

class ProgressCreate(BaseModel):
    date: str
    score: Optional[int] = 0
    tasks_completed: Optional[int] = 0
    topics_studied: Optional[str] = "[]"
    quiz_data: Optional[str] = None
    streak_count: Optional[int] = 0

class ProgressResponse(ProgressCreate):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Mistake Log ───────────────────────────────────────────────────────────────

class MistakeCreate(BaseModel):
    content: str = Field(..., min_length=1)
    category: Optional[str] = "general"
    context: Optional[str] = None

class MistakeUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    context: Optional[str] = None
    reviewed_1: Optional[bool] = None
    reviewed_2: Optional[bool] = None
    reviewed_3: Optional[bool] = None

class MistakeResponse(BaseModel):
    id: int
    content: str
    category: str
    context: Optional[str] = None
    interval_1_date: Optional[str] = None
    interval_2_date: Optional[str] = None
    interval_3_date: Optional[str] = None
    reviewed_1: bool
    reviewed_2: bool
    reviewed_3: bool
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ── AI Features ───────────────────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    material_id: int

class QuizGenerateRequest(BaseModel):
    topics: List[str]
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"

class QuizQuestion(BaseModel):
    question: str
    options: Optional[List[str]] = None   # None for short-answer
    answer: str
    explanation: Optional[str] = None
    type: Optional[str] = "multiple_choice"  # multiple_choice | short_answer

class QuizSubmitRequest(BaseModel):
    date: str
    questions: List[dict]
    answers: List[str]
    topics: List[str]


# ── Interview ─────────────────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    interview_type: Optional[str] = "technical"
    topics: Optional[List[str]] = ["Python", "Web Development"]

class InterviewAnswerRequest(BaseModel):
    record_id: int
    question_index: int
    answer: str

class InterviewResponse(BaseModel):
    id: int
    date: Optional[str] = None
    interview_type: str
    questions: str
    answers: str
    feedback: str
    overall_score: int
    overall_feedback: Optional[str] = None
    strengths: str
    weaknesses: str
    completed: bool
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ── Jobs ──────────────────────────────────────────────────────────────────────

class JobMatchRequest(BaseModel):
    skills: List[str]
    experience_level: Optional[str] = "junior"
    preferred_roles: Optional[List[str]] = []
