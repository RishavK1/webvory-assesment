"""Service layer — business rules, transaction boundaries, orchestration.

Services depend on repositories, never on FastAPI. That keeps every rule in
this package callable from a route, a CLI command, a background job or a test
without dragging HTTP along with it.
"""

from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.external_api_service import ExternalApiService
from app.services.task_service import TaskService
from app.services.user_service import UserService

__all__ = [
    "AuthService",
    "DashboardService",
    "ExternalApiService",
    "TaskService",
    "UserService",
]
