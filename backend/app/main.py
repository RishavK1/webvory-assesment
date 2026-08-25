"""FastAPI application factory and entrypoint.

Run with:  uvicorn app.main:app --reload
Docs:      http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import inspect

from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import register_exception_handlers
from app.routes import api_router
from app.utils.http_client import external_api_client


@asynccontextmanager
async def lifespan(_app: FastAPI):
    tables = inspect(engine).get_table_names()
    if "tasks" not in tables:
        try:
            from app.core.database import Base
            from app.seed import seed
            Base.metadata.create_all(bind=engine)
            seed()
        except Exception as exc:
            print(f"Database initialization: {exc}")

    yield
    await external_api_client.aclose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=f"{settings.APP_DESCRIPTION}\n\nREST API for Webvory internal task management.",
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    @app.get("/health", tags=["System"], summary="Liveness probe")
    def health() -> dict[str, str]:
        return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

    return app


app = create_app()
