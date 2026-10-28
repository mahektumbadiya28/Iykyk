"""SQLAlchemy database configuration and session management."""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skillops.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed default data if empty."""
    import app.models as _  # noqa: ensure models registered
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")
    _seed_if_empty()


def _seed_if_empty():
    """Add sample data on first run so the dashboard isn't blank."""
    from app.models import Task, StudyMaterial, DailyProgress, MistakeLog
    from app.services.spaced_repetition import compute_review_dates
    from datetime import datetime, timedelta
    import json

    db = SessionLocal()
    try:
        if db.query(Task).count() > 0:
            return  # Already seeded

        today = datetime.utcnow().date()

        # Sample tasks
        sample_tasks = [
            Task(title="Complete Python OOP module", priority="high", category="study",
                 due_date=str(today), completed=False),
            Task(title="Solve 2 LeetCode problems", priority="medium", category="practice",
                 due_date=str(today), completed=True),
            Task(title="Read FastAPI docs – dependency injection", priority="high", category="study",
                 due_date=str(today), completed=False),
            Task(title="Update GitHub portfolio README", priority="low", category="career",
                 due_date=str(today + timedelta(days=1)), completed=False),
            Task(title="Watch Docker networking tutorial", priority="medium", category="devops",
                 due_date=str(today + timedelta(days=1)), completed=False),
        ]
        db.add_all(sample_tasks)

        # Sample study material
        material = StudyMaterial(
            title="Python Decorators Explained",
            content="A decorator is a design pattern that allows a user to add functionality to an existing object without modifying its structure. Decorators are usually called before the definition of a function you want to decorate. In Python, functions are first-class objects, meaning they can be passed as arguments, returned from functions, and assigned to variables.",
            material_type="article",
            tags=json.dumps(["python", "decorators", "advanced"]),
            liked=True,
            summary="Python decorators add functionality to functions without modifying them. They use the @syntax and work because functions are first-class objects.",
            key_points=json.dumps(["Decorators wrap functions", "Use @syntax", "Functions are first-class objects", "Can stack multiple decorators"]),
        )
        db.add(material)

        # Sample daily progress (last 7 days)
        for i in range(7, 0, -1):
            import random
            day = today - timedelta(days=i)
            prog = DailyProgress(
                date=str(day),
                score=random.randint(55, 95),
                tasks_completed=random.randint(2, 6),
                topics_studied=json.dumps(["Python", "FastAPI", "Docker"][:(i % 3 + 1)]),
                streak_count=i,
            )
            db.add(prog)

        # Sample mistake log
        m1_dates = compute_review_dates(datetime.utcnow() - timedelta(days=2))
        mistake = MistakeLog(
            content="Forgot to close database sessions in FastAPI dependency injectors – always use try/finally.",
            category="coding",
            context="Building FastAPI app",
            interval_1_date=m1_dates[0],
            interval_2_date=m1_dates[1],
            interval_3_date=m1_dates[2],
            reviewed_1=True,
        )
        db.add(mistake)

        db.commit()
        logger.info("Seeded default data.")
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
    finally:
        db.close()
