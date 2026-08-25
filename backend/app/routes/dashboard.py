"""Dashboard endpoint."""

from fastapi import APIRouter

from app.routes.dependencies import CurrentUser, DbSession
from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardStats,
    summary="Team-wide and personal task statistics",
    description=(
        "Returns every figure the dashboard renders in a single request. "
        "The personal counts (`my_*`) are scoped to the authenticated user."
    ),
)
def get_dashboard(db: DbSession, current_user: CurrentUser) -> DashboardStats:
    return DashboardService(db).build(current_user_id=current_user.id)
