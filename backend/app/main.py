"""FastAPI application entry point."""
import logging
import logging.config
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import tasks, services, resources

# ── Logging Configuration ──────────────────────────────────────────────────────
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "level": "DEBUG",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "app.log",
            "formatter": "standard",
            "level": "INFO",
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
    "loggers": {
        "uvicorn": {"propagate": True},
        "sqlalchemy.engine": {"level": "WARNING", "propagate": True},
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)


# ── Lifespan: DB Init ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[START] Starting Dashboard API server...")
    init_db()
    logger.info("[OK] Database initialized.")
    yield
    logger.info("[STOP] Shutting down Dashboard API server.")


# ── App Instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="NexusDash API",
    description="Unified dashboard API for Task Management, Service Monitoring, and Resource Inventory.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(tasks.router)
app.include_router(services.router)
app.include_router(resources.router)


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
def health_check():
    """Returns API health status and current server timestamp."""
    return {
        "status": "OK",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "service": "NexusDash API",
    }


# ── Stats Overview ─────────────────────────────────────────────────────────────
@app.get("/api/stats", tags=["stats"])
def get_stats(db=None):
    """Returns aggregate counts for the dashboard overview cards."""
    from app.database import SessionLocal
    from app.models.task import Task
    from app.models.service import Service
    from app.models.resource import Resource

    db = SessionLocal()
    try:
        task_total = db.query(Task).count()
        task_completed = db.query(Task).filter(Task.status == "completed").count()
        task_in_progress = db.query(Task).filter(Task.status == "in_progress").count()

        service_total = db.query(Service).count()
        service_online = db.query(Service).filter(Service.status == "online").count()
        service_offline = db.query(Service).filter(Service.status == "offline").count()

        resource_total = db.query(Resource).count()
        resource_active = db.query(Resource).filter(Resource.status == "active").count()

        return {
            "tasks": {
                "total": task_total,
                "completed": task_completed,
                "in_progress": task_in_progress,
                "pending": task_total - task_completed - task_in_progress,
            },
            "services": {
                "total": service_total,
                "online": service_online,
                "offline": service_offline,
                "degraded": service_total - service_online - service_offline,
            },
            "resources": {
                "total": resource_total,
                "active": resource_active,
                "inactive": resource_total - resource_active,
            },
        }
    finally:
        db.close()
