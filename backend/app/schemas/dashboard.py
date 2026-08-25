"""Dashboard aggregate schemas."""

from pydantic import BaseModel

from app.models.enums import TaskPriority, TaskStatus
from app.schemas.task import TaskRead


class StatusBreakdown(BaseModel):
    pending: int = 0
    in_progress: int = 0
    completed: int = 0
    blocked: int = 0


class PriorityBreakdown(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    urgent: int = 0


class TrendPoint(BaseModel):
    """One day of throughput, for the created-vs-completed chart."""

    date: str
    created: int
    completed: int


class WorkloadEntry(BaseModel):
    """Per-teammate workload, used by the dashboard bar chart."""

    user_id: int
    name: str
    total: int
    completed: int
    overdue: int


class DashboardStats(BaseModel):
    """Everything the dashboard needs, in a single round trip."""

    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    blocked_tasks: int
    overdue_tasks: int

    my_tasks: int
    my_open_tasks: int
    my_overdue_tasks: int

    completion_rate: float
    due_this_week: int

    by_status: StatusBreakdown
    by_priority: PriorityBreakdown
    workload: list[WorkloadEntry]
    trend: list[TrendPoint]

    my_recent_tasks: list[TaskRead]
    recently_updated: list[TaskRead]


__all__ = [
    "DashboardStats",
    "PriorityBreakdown",
    "StatusBreakdown",
    "TrendPoint",
    "TaskPriority",
    "TaskStatus",
    "WorkloadEntry",
]
