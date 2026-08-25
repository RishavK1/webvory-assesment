"""HTTP layer.

Routers stay thin on purpose: validate input, call one service, shape the
response. No business rule and no SQL lives in this package.
"""

from fastapi import APIRouter

from app.routes import auth, dashboard, external, tasks, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(tasks.router)
api_router.include_router(users.router)
api_router.include_router(external.router)

__all__ = ["api_router"]
