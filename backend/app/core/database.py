import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session
from app.core.config import get_settings

settings = get_settings()

# API uses sync sessions: Pyodide (Python Workers) has no greenlet, so AsyncSession can't run there.
# ponytail: sync calls block the loop under uvicorn; fine for SQLite/one-box, async engine if that hurts.
sync_url = settings.database_url.replace("+aiosqlite", "").replace("+asyncpg", "+psycopg")
_is_sqlite = sync_url.startswith("sqlite")

# On Workers (emscripten) the D1 engine is injected by worker.py instead.
engine = None if sys.platform == "emscripten" else create_engine(
    sync_url,
    echo=settings.app_env == "development",
    **({"connect_args": {"check_same_thread": False}} if _is_sqlite else {"pool_pre_ping": True}),
)

# Set by worker.py to the D1-backed engine when running on Cloudflare.
d1_engine = None


class Base(DeclarativeBase):
    pass


# async on purpose: FastAPI runs sync deps in a threadpool, and Pyodide has no threads.
async def get_db():
    with Session(d1_engine or engine, expire_on_commit=False) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise


def __getattr__(name: str):
    # Voice agent + celery tasks stay async; built lazily so Workers never import aiosqlite/greenlet.
    if name == "AsyncSessionLocal":
        from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

        global AsyncSessionLocal
        AsyncSessionLocal = async_sessionmaker(
            create_async_engine(settings.database_url), expire_on_commit=False
        )
        return AsyncSessionLocal
    raise AttributeError(name)
