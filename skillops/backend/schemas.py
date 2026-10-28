"""
SkillOps - Pydantic Schemas for Request/Response validation
"""
from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr


# ─── USER ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    skills: Optional[List[str]] = []

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_color: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    avatar_color: str
    skills: List[str]
    streak_count: int
    total_xp: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── TASKS ───────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "general"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None
    xp_reward: Optional[int] = 10

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    xp_reward: Optional[int] = None

class TaskOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    category: str
    priority: str
    due_date: Optional[datetime]
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
    xp_reward: int
    model_config = {"from_attributes": True}


# ─── STUDY MATERIAL ──────────────────────────────────────────────────────────

class MaterialCreate(BaseModel):
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    material_type: Optional[str] = "article"
    tags: Optional[List[str]] = []

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    material_type: Optional[str] = None
    tags: Optional[List[str]] = None
    liked: Optional[bool] = None
    bookmarked: Optional[bool] = None

class MaterialOut(BaseModel):
    id: int
    user_id: int
    title: str
    content: Optional[str]
    url: Optional[str]
    material_type: str
    tags: List[str]
    liked: bool
    bookmarked: bool
    ai_summary: Optional[str]
    ai_flashcards: Optional[List[Dict]]
    ai_key_points: Optional[List[str]]
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── DAILY SCORE ─────────────────────────────────────────────────────────────

class DailyScoreOut(BaseModel):
    id: int
    user_id: int
    score_date: date
    quiz_score: int
    tasks_completed: int
    tasks_total: int
    materials_studied: int
    xp_earned: int
    quiz_questions: Optional[List[Dict]]
    quiz_answers: Optional[List[Any]]
    model_config = {"from_attributes": True}

class QuizSubmit(BaseModel):
    answers: List[str]   # user's selected answers (index or text)
    score_date: Optional[date] = None


# ─── MISTAKE LOG ─────────────────────────────────────────────────────────────

class MistakeCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = "concept"
    source: Optional[str] = "self-note"

class MistakeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    resolved: Optional[bool] = None
    review_1_done: Optional[bool] = None
    review_3_done: Optional[bool] = None
    review_7_done: Optional[bool] = None

class MistakeOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category: str
    source: Optional[str]
    logged_at: datetime
    review_1_date: Optional[date]
    review_3_date: Optional[date]
    review_7_date: Optional[date]
    review_1_done: bool
    review_3_done: bool
    review_7_done: bool
    ai_explanation: Optional[str]
    resolved: bool
    model_config = {"from_attributes": True}


# ─── CHAT ────────────────────────────────────────────────────────────────────

class ChatMessageIn(BaseModel):
    content: str
    context: Optional[str] = "general"

class ChatMessageOut(BaseModel):
    id: int
    user_id: int
    role: str
    content: str
    context: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── INTERVIEW ───────────────────────────────────────────────────────────────

class InterviewStart(BaseModel):
    job_role: Optional[str] = "Junior Developer"
    domain: Optional[str] = "fullstack"

class InterviewAnswerIn(BaseModel):
    question_index: int
    user_answer: str

class InterviewOut(BaseModel):
    id: int
    user_id: int
    interview_date: datetime
    job_role: str
    domain: str
    questions: Optional[List[Dict]]
    overall_score: float
    strengths: Optional[List[str]]
    weaknesses: Optional[List[str]]
    improvement_plan: Optional[str]
    completed: bool
    model_config = {"from_attributes": True}


# ─── AI GENERIC ──────────────────────────────────────────────────────────────

class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

class JobOpportunity(BaseModel):
    title: str
    company: str
    location: str
    type: str
    domain: str
    match_score: int
    description: str
    skills_required: List[str]
    apply_url: str
