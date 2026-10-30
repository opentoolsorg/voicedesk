"""
VoiceDesk FastAPI application entrypoint.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.core.config import get_settings
from app.core.database import engine, Base
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from app.api import agencies, businesses, calls, webhooks, numbers, workflows, receptionist
from app.models.agency import Agency
from app.models import Contact, FlowVersion, Campaign  # noqa: F401

logger = structlog.get_logger()
settings = get_settings()


def init_db(db_engine) -> None:
    """Create tables and the single OSS agency. Idempotent; runs on boot (uvicorn) or cold start (Workers)."""
    Base.metadata.create_all(db_engine)
    if db_engine.dialect.name in ("sqlite", "cloudflare_d1"):
        add_missing_columns(db_engine)
    # ponytail: one shared agency until real auth lands (see deps.get_current_agency).
    with Session(db_engine) as session:
        if not session.get(Agency, settings.dev_agency_id):
            session.add(
                Agency(id=settings.dev_agency_id, name=settings.dev_agency_name, subdomain="local-demo")
            )
            session.commit()
            logger.info("Bootstrapped agency", agency_id=settings.dev_agency_id)


def add_missing_columns(db_engine) -> None:
    """create_all never alters existing tables (e.g. the prod D1 db), so ADD COLUMN what the models gained."""
    with db_engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            have = {row[1] for row in conn.execute(text(f'PRAGMA table_info("{table.name}")'))}
            for col in table.columns:
                if have and col.name not in have:
                    ddl = f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {col.type.compile(db_engine.dialect)}'
                    if col.server_default is not None:
                        ddl += f" DEFAULT {col.server_default.arg.text}"
                    conn.execute(text(ddl))
                    if table.name == "businesses" and col.name == "telephony_provider":
                        conn.execute(
                            text('UPDATE "businesses" SET "telephony_provider" = :provider WHERE "telephony_provider" IS NULL'),
                            {"provider": "twilio"}
                        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VoiceDesk API starting", env=settings.app_env)
    if engine is not None:
        init_db(engine)
    yield
    if engine is not None:
        engine.dispose()
    logger.info("VoiceDesk API stopped")


def create_app() -> FastAPI:
    """Build the app from current settings (the Worker calls this again once its vars are loaded)."""
    app = FastAPI(
        title="VoiceDesk API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if not settings.is_production else [settings.public_base_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(agencies.router, prefix="/api/v1/agencies", tags=["agencies"])
    app.include_router(businesses.router, prefix="/api/v1/businesses", tags=["businesses"])
    app.include_router(calls.router, prefix="/api/v1/calls", tags=["calls"])
    app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
    app.include_router(numbers.router, prefix="/api/v1/numbers", tags=["numbers"])
    app.include_router(workflows.router, prefix="/api/v1", tags=["workflows"])
    app.include_router(receptionist.router, prefix="/api/v1", tags=["receptionist"])
    app.add_api_route("/health", health)
    return app


async def health():
    return {"status": "ok", "version": "0.1.0"}


app = create_app()
