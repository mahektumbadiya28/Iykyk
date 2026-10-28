"""
SkillOps - FastAPI Main Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from database import init_db, AsyncSessionLocal, User
from routers import (
    users_router, tasks_router, materials_router,
    quiz_router, mistakes_router, chat_router,
    interview_router, jobs_router
)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    # Create default user if none exists
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).limit(1))
        if not result.scalar_one_or_none():
            default_user = User(
                name="Learner",
                email="learner@skillops.dev",
                skills=["Python", "Linux", "Azure", "DevOps", "Web Development"],
                avatar_color="#6366f1"
            )
            db.add(default_user)
            await db.commit()
            print("[OK] Default user created (ID: 1)")
    print("[OK] SkillOps API is running!")
    yield
    # Shutdown
    print("[INFO] SkillOps API shutting down.")


app = FastAPI(
    title="SkillOps API",
    description="Personal Career & Skill Operating System — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users_router)
app.include_router(tasks_router)
app.include_router(materials_router)
app.include_router(quiz_router)
app.include_router(mistakes_router)
app.include_router(chat_router)
app.include_router(interview_router)
app.include_router(jobs_router)


@app.get("/")
async def root():
    return {
        "app": "SkillOps API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
