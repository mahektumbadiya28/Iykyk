"""
SkillOps - FastAPI Routers
All API route definitions
"""
from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from database import get_db, User, Task, StudyMaterial, DailyScore, MistakeLog, ChatMessage, InterviewRecord
from schemas import (
    UserCreate, UserUpdate, UserOut,
    TaskCreate, TaskUpdate, TaskOut,
    MaterialCreate, MaterialUpdate, MaterialOut,
    DailyScoreOut, QuizSubmit,
    MistakeCreate, MistakeUpdate, MistakeOut,
    ChatMessageIn, ChatMessageOut,
    InterviewStart, InterviewAnswerIn, InterviewOut,
    AIRequest
)
import ai_service

# ─── USERS ───────────────────────────────────────────────────────────────────

users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.post("", response_model=UserOut)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(**data.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@users_router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

@users_router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: int, data: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return user

@users_router.get("/{user_id}/dashboard")
async def get_dashboard(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    today = date.today()
    week_ago = today - timedelta(days=7)

    # Tasks today
    tasks_result = await db.execute(
        select(Task).where(Task.user_id == user_id)
    )
    all_tasks = tasks_result.scalars().all()
    today_tasks = [t for t in all_tasks if t.created_at.date() == today]

    # Weekly scores
    scores_result = await db.execute(
        select(DailyScore).where(
            DailyScore.user_id == user_id,
            DailyScore.score_date >= week_ago
        )
    )
    scores = scores_result.scalars().all()

    # Pending reviews
    pending_reviews = await db.execute(
        select(MistakeLog).where(
            MistakeLog.user_id == user_id,
            MistakeLog.resolved == False,
            or_(
                and_(MistakeLog.review_1_date == today, MistakeLog.review_1_done == False),
                and_(MistakeLog.review_3_date == today, MistakeLog.review_3_done == False),
                and_(MistakeLog.review_7_date == today, MistakeLog.review_7_done == False),
            )
        )
    )
    reviews = pending_reviews.scalars().all()

    # Materials count
    mats_result = await db.execute(
        select(func.count(StudyMaterial.id)).where(StudyMaterial.user_id == user_id)
    )
    materials_count = mats_result.scalar() or 0

    return {
        "user": UserOut.model_validate(user),
        "stats": {
            "total_tasks": len(all_tasks),
            "completed_tasks": sum(1 for t in all_tasks if t.completed),
            "today_tasks_total": len(today_tasks),
            "today_tasks_done": sum(1 for t in today_tasks if t.completed),
            "materials_count": materials_count,
            "pending_reviews": len(reviews),
            "total_xp": user.total_xp,
            "streak": user.streak_count,
        },
        "weekly_scores": [
            {
                "date": str(s.score_date),
                "quiz_score": s.quiz_score,
                "xp_earned": s.xp_earned,
                "tasks_completed": s.tasks_completed,
            }
            for s in sorted(scores, key=lambda x: x.score_date)
        ],
        "pending_review_items": [
            {"id": r.id, "title": r.title, "category": r.category}
            for r in reviews[:5]
        ]
    }


# ─── TASKS ───────────────────────────────────────────────────────────────────

tasks_router = APIRouter(prefix="/tasks", tags=["Tasks"])

@tasks_router.get("", response_model=List[TaskOut])
async def list_tasks(
    user_id: int = Query(...),
    completed: Optional[bool] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).where(Task.user_id == user_id)
    if completed is not None:
        query = query.where(Task.completed == completed)
    if category:
        query = query.where(Task.category == category)
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@tasks_router.post("", response_model=TaskOut)
async def create_task(data: TaskCreate, user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    task = Task(user_id=user_id, **data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@tasks_router.put("/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    update_data = data.model_dump(exclude_none=True)
    if update_data.get("completed") and not task.completed:
        update_data["completed_at"] = datetime.utcnow()
        # Grant XP
        user = await db.get(User, task.user_id)
        if user:
            user.total_xp += task.xp_reward
    for k, v in update_data.items():
        setattr(task, k, v)
    await db.commit()
    await db.refresh(task)
    return task

@tasks_router.delete("/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    await db.delete(task)
    await db.commit()
    return {"ok": True}

@tasks_router.get("/reminders/today")
async def get_todays_reminders(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    today_end = now.replace(hour=23, minute=59, second=59)
    result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            Task.completed == False,
            Task.due_date != None,
            Task.due_date <= today_end,
        )
    )
    tasks = result.scalars().all()
    return [{"id": t.id, "title": t.title, "due_date": t.due_date, "priority": t.priority} for t in tasks]


# ─── STUDY MATERIALS ─────────────────────────────────────────────────────────

materials_router = APIRouter(prefix="/materials", tags=["Materials"])

@materials_router.get("", response_model=List[MaterialOut])
async def list_materials(
    user_id: int = Query(...),
    liked: Optional[bool] = None,
    bookmarked: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(StudyMaterial).where(StudyMaterial.user_id == user_id)
    if liked is not None:
        query = query.where(StudyMaterial.liked == liked)
    if bookmarked is not None:
        query = query.where(StudyMaterial.bookmarked == bookmarked)
    query = query.order_by(StudyMaterial.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@materials_router.post("", response_model=MaterialOut)
async def create_material(data: MaterialCreate, user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    mat = StudyMaterial(user_id=user_id, **data.model_dump())
    db.add(mat)
    await db.commit()
    await db.refresh(mat)
    return mat

@materials_router.put("/{mat_id}", response_model=MaterialOut)
async def update_material(mat_id: int, data: MaterialUpdate, db: AsyncSession = Depends(get_db)):
    mat = await db.get(StudyMaterial, mat_id)
    if not mat:
        raise HTTPException(404, "Material not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(mat, k, v)
    mat.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(mat)
    return mat

@materials_router.delete("/{mat_id}")
async def delete_material(mat_id: int, db: AsyncSession = Depends(get_db)):
    mat = await db.get(StudyMaterial, mat_id)
    if not mat:
        raise HTTPException(404, "Material not found")
    await db.delete(mat)
    await db.commit()
    return {"ok": True}

@materials_router.post("/{mat_id}/summarize", response_model=MaterialOut)
async def summarize_material(mat_id: int, db: AsyncSession = Depends(get_db)):
    mat = await db.get(StudyMaterial, mat_id)
    if not mat:
        raise HTTPException(404, "Material not found")
    content = mat.content or mat.url or mat.title
    result = await ai_service.summarize_material(mat.title, content)
    mat.ai_summary = result.get("summary")
    mat.ai_key_points = result.get("key_points")
    mat.ai_flashcards = result.get("flashcards")
    mat.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(mat)
    return mat


# ─── DAILY SCORES & QUIZ ─────────────────────────────────────────────────────

quiz_router = APIRouter(prefix="/quiz", tags=["Quiz & Progress"])

@quiz_router.get("/generate")
async def generate_quiz(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    # Get today's studied materials
    today = date.today()
    mats_result = await db.execute(
        select(StudyMaterial).where(
            StudyMaterial.user_id == user_id,
            func.date(StudyMaterial.created_at) == today
        )
    )
    materials = mats_result.scalars().all()
    topics = [m.title for m in materials]
    contents = [m.content or "" for m in materials if m.content]

    # Also get completed tasks today for topic hints
    tasks_result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            Task.completed == True,
            func.date(Task.completed_at) == today
        )
    )
    tasks = tasks_result.scalars().all()
    topics.extend([t.title for t in tasks])

    questions = await ai_service.generate_daily_quiz(topics, contents)

    # Save quiz to daily score record
    existing = await db.execute(
        select(DailyScore).where(
            DailyScore.user_id == user_id,
            DailyScore.score_date == today
        )
    )
    score_record = existing.scalar_one_or_none()
    if not score_record:
        score_record = DailyScore(user_id=user_id, score_date=today)
        db.add(score_record)

    score_record.quiz_questions = questions
    score_record.materials_studied = len(materials)

    tasks_all = await db.execute(select(Task).where(Task.user_id == user_id, func.date(Task.created_at) == today))
    all_today = tasks_all.scalars().all()
    score_record.tasks_total = len(all_today)
    score_record.tasks_completed = sum(1 for t in all_today if t.completed)

    await db.commit()
    return {"questions": questions, "score_record_id": score_record.id}

@quiz_router.post("/submit")
async def submit_quiz(data: QuizSubmit, user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    today = data.score_date or date.today()
    existing = await db.execute(
        select(DailyScore).where(DailyScore.user_id == user_id, DailyScore.score_date == today)
    )
    score_record = existing.scalar_one_or_none()
    if not score_record or not score_record.quiz_questions:
        raise HTTPException(400, "No quiz found for today. Generate a quiz first.")

    questions = score_record.quiz_questions
    correct = 0
    results = []
    for i, q in enumerate(questions):
        user_ans = data.answers[i] if i < len(data.answers) else ""
        is_correct = user_ans.strip().upper().startswith(q.get("correct", "A").upper())
        if is_correct:
            correct += 1
        results.append({
            "question": q["question"],
            "user_answer": user_ans,
            "correct_answer": q.get("correct"),
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    score = int((correct / len(questions)) * 100)
    xp = score // 10 * 5  # up to 50 XP for quiz

    score_record.quiz_score = score
    score_record.quiz_answers = results
    score_record.xp_earned = (score_record.xp_earned or 0) + xp

    # Update user XP and streak
    user = await db.get(User, user_id)
    if user:
        user.total_xp += xp
        # Check streak: did they take a quiz yesterday too?
        yesterday = today - timedelta(days=1)
        yesterday_score = await db.execute(
            select(DailyScore).where(DailyScore.user_id == user_id, DailyScore.score_date == yesterday)
        )
        y_rec = yesterday_score.scalar_one_or_none()
        if y_rec and y_rec.quiz_score > 0:
            user.streak_count += 1
        else:
            user.streak_count = 1

    await db.commit()
    return {"score": score, "correct": correct, "total": len(questions), "xp_earned": xp, "results": results}

@quiz_router.get("/scores")
async def get_scores(user_id: int = Query(...), days: int = 30, db: AsyncSession = Depends(get_db)):
    since = date.today() - timedelta(days=days)
    result = await db.execute(
        select(DailyScore).where(
            DailyScore.user_id == user_id,
            DailyScore.score_date >= since
        ).order_by(DailyScore.score_date)
    )
    scores = result.scalars().all()
    return [
        {
            "date": str(s.score_date),
            "quiz_score": s.quiz_score,
            "tasks_completed": s.tasks_completed,
            "tasks_total": s.tasks_total,
            "materials_studied": s.materials_studied,
            "xp_earned": s.xp_earned
        }
        for s in scores
    ]


# ─── MISTAKE LOG ─────────────────────────────────────────────────────────────

mistakes_router = APIRouter(prefix="/mistakes", tags=["Mistake Log"])

@mistakes_router.get("", response_model=List[MistakeOut])
async def list_mistakes(
    user_id: int = Query(...),
    resolved: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(MistakeLog).where(MistakeLog.user_id == user_id)
    if resolved is not None:
        query = query.where(MistakeLog.resolved == resolved)
    query = query.order_by(MistakeLog.logged_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@mistakes_router.post("", response_model=MistakeOut)
async def log_mistake(data: MistakeCreate, user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    today = date.today()
    mistake = MistakeLog(
        user_id=user_id,
        review_1_date=today + timedelta(days=1),
        review_3_date=today + timedelta(days=3),
        review_7_date=today + timedelta(days=7),
        **data.model_dump()
    )
    db.add(mistake)
    await db.commit()
    await db.refresh(mistake)

    # Fire AI explanation in background-style (sync for now)
    explanation = await ai_service.explain_mistake(mistake.title, mistake.description)
    mistake.ai_explanation = explanation
    await db.commit()
    await db.refresh(mistake)
    return mistake

@mistakes_router.put("/{mistake_id}", response_model=MistakeOut)
async def update_mistake(mistake_id: int, data: MistakeUpdate, db: AsyncSession = Depends(get_db)):
    mistake = await db.get(MistakeLog, mistake_id)
    if not mistake:
        raise HTTPException(404, "Mistake not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(mistake, k, v)
    # Check if all reviews done → auto-resolve
    if mistake.review_1_done and mistake.review_3_done and mistake.review_7_done:
        mistake.resolved = True
    await db.commit()
    await db.refresh(mistake)
    return mistake

@mistakes_router.delete("/{mistake_id}")
async def delete_mistake(mistake_id: int, db: AsyncSession = Depends(get_db)):
    mistake = await db.get(MistakeLog, mistake_id)
    if not mistake:
        raise HTTPException(404, "Mistake not found")
    await db.delete(mistake)
    await db.commit()
    return {"ok": True}

@mistakes_router.get("/due-today")
async def get_due_reviews(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(
        select(MistakeLog).where(
            MistakeLog.user_id == user_id,
            MistakeLog.resolved == False,
            or_(
                and_(MistakeLog.review_1_date == today, MistakeLog.review_1_done == False),
                and_(MistakeLog.review_3_date == today, MistakeLog.review_3_done == False),
                and_(MistakeLog.review_7_date == today, MistakeLog.review_7_done == False),
            )
        )
    )
    items = result.scalars().all()
    return [MistakeOut.model_validate(m) for m in items]


# ─── CHAT ────────────────────────────────────────────────────────────────────

chat_router = APIRouter(prefix="/chat", tags=["AI Chat"])

@chat_router.get("", response_model=List[ChatMessageOut])
async def get_chat_history(user_id: int = Query(...), limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return list(reversed(messages))

@chat_router.post("", response_model=ChatMessageOut)
async def send_message(data: ChatMessageIn, user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    # Save user message
    user_msg = ChatMessage(user_id=user_id, role="user", content=data.content, context=data.context)
    db.add(user_msg)
    await db.commit()

    # Get conversation history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    history = list(reversed(history_result.scalars().all()))
    conv_history = [{"role": m.role, "content": m.content} for m in history[:-1]]

    # Get AI response
    ai_response = await ai_service.chat_with_mentor(data.content, conv_history, data.context)

    # Save AI response
    ai_msg = ChatMessage(user_id=user_id, role="assistant", content=ai_response, context=data.context)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)
    return ai_msg

@chat_router.delete("")
async def clear_chat(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatMessage).where(ChatMessage.user_id == user_id))
    for msg in result.scalars().all():
        await db.delete(msg)
    await db.commit()
    return {"ok": True}


# ─── INTERVIEWS ──────────────────────────────────────────────────────────────

interview_router = APIRouter(prefix="/interviews", tags=["Interview Simulator"])

@interview_router.get("", response_model=List[InterviewOut])
async def list_interviews(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(InterviewRecord)
        .where(InterviewRecord.user_id == user_id)
        .order_by(InterviewRecord.interview_date.desc())
    )
    return result.scalars().all()

@interview_router.post("/start", response_model=InterviewOut)
async def start_interview(data: InterviewStart, user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    questions = await ai_service.generate_interview_questions(data.job_role, data.domain)
    interview = InterviewRecord(
        user_id=user_id,
        job_role=data.job_role,
        domain=data.domain,
        questions=[{**q, "user_answer": "", "score": 0, "feedback": ""} for q in questions],
        completed=False
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return interview

@interview_router.post("/{interview_id}/answer")
async def submit_answer(interview_id: int, data: InterviewAnswerIn, db: AsyncSession = Depends(get_db)):
    interview = await db.get(InterviewRecord, interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    if interview.completed:
        raise HTTPException(400, "Interview already completed")

    questions = interview.questions or []
    if data.question_index >= len(questions):
        raise HTTPException(400, "Invalid question index")

    q = questions[data.question_index]
    evaluation = await ai_service.evaluate_interview_answer(
        q["question"],
        data.user_answer,
        q.get("evaluation_criteria", []),
        q.get("sample_answer", "")
    )
    questions[data.question_index].update({
        "user_answer": data.user_answer,
        "score": evaluation.get("score", 5),
        "feedback": evaluation.get("feedback", ""),
        "strengths": evaluation.get("strengths", []),
        "weaknesses": evaluation.get("weaknesses", []),
        "improved_answer": evaluation.get("improved_answer", ""),
    })
    interview.questions = questions
    await db.commit()
    return {"evaluation": evaluation, "question_index": data.question_index}

@interview_router.post("/{interview_id}/complete", response_model=InterviewOut)
async def complete_interview(interview_id: int, db: AsyncSession = Depends(get_db)):
    interview = await db.get(InterviewRecord, interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")

    questions = interview.questions or []
    evaluated_qs = [q for q in questions if q.get("score", 0) > 0]

    report = await ai_service.generate_interview_report(
        evaluated_qs, interview.job_role, interview.domain
    )

    scores = [q.get("score", 0) for q in evaluated_qs]
    interview.overall_score = sum(scores) / len(scores) if scores else 0
    interview.strengths = report.get("top_strengths", [])
    interview.weaknesses = report.get("top_weaknesses", [])
    interview.improvement_plan = report.get("improvement_plan", "")
    interview.completed = True
    await db.commit()
    await db.refresh(interview)
    return interview

@interview_router.get("/{interview_id}", response_model=InterviewOut)
async def get_interview(interview_id: int, db: AsyncSession = Depends(get_db)):
    interview = await db.get(InterviewRecord, interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    return interview


# ─── JOBS ────────────────────────────────────────────────────────────────────

jobs_router = APIRouter(prefix="/jobs", tags=["Job Opportunities"])

@jobs_router.get("/opportunities")
async def get_opportunities(user_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    skills = user.skills if user else []
    opportunities = await ai_service.find_job_opportunities(skills)
    return {"opportunities": opportunities}

@jobs_router.post("/match-resume")
async def match_resume(
    job_title: str = Query(...),
    job_description: str = Query(...),
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    user = await db.get(User, user_id)
    skills = user.skills if user else []
    result = await ai_service.match_resume_to_job(skills, job_title, job_description)
    return result
