"""Dashboard aggregation.

Every number is produced by a COUNT/GROUP BY in the database. Nothing here
loads the task table into Python to count it, so the endpoint costs the same
whether the workspace holds 50 tasks or 500,000.
"""

from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models.enums import TaskStatus
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.dashboard import (
    DashboardStats,
    PriorityBreakdown,
    StatusBreakdown,
    TrendPoint,
    WorkloadEntry,
)
from app.schemas.task import TaskRead
from app.utils.datetime_utils import utcnow


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.tasks = TaskRepository(db)
        self.users = UserRepository(db)


    def _build_trend(self, *, days: int = 14) -> list[TrendPoint]:
        """Tasks created vs completed per day, oldest first.

        Every day in the window is emitted even when nothing happened —
        otherwise the chart's x-axis would silently compress quiet days and
        misrepresent the shape of the work.
        """
        today = utcnow().date()
        start_date = today - timedelta(days=days - 1)
        cutoff = datetime.combine(start_date, time.min)

        buckets: dict[date, dict[str, int]] = {
            start_date + timedelta(days=offset): {"created": 0, "completed": 0}
            for offset in range(days)
        }

        for created_at in self.tasks.created_since(cutoff):
            day = created_at.date()
            if day in buckets:
                buckets[day]["created"] += 1

        for completed_at in self.tasks.completed_since(cutoff):
            day = completed_at.date()
            if day in buckets:
                buckets[day]["completed"] += 1

        return [
            TrendPoint(date=day.isoformat(), created=counts["created"], completed=counts["completed"])
            for day, counts in sorted(buckets.items())
        ]

    def build(self, *, current_user_id: int) -> DashboardStats:
        status_counts = self.tasks.count_by_status()
        priority_counts = self.tasks.count_by_priority()

        total = sum(status_counts.values())
        completed = status_counts.get(TaskStatus.COMPLETED.value, 0)

        now = utcnow()
        week_ahead = now + timedelta(days=7)

        users_by_id = {user.id: user for user in self.users.list_active()}
        workload = [
            WorkloadEntry(
                user_id=row.assigned_to,
                name=users_by_id[row.assigned_to].name
                if row.assigned_to in users_by_id
                else f"User {row.assigned_to}",
                total=row.total or 0,
                completed=int(row.completed or 0),
                overdue=int(row.overdue or 0),
            )
            for row in self.tasks.workload_by_user()
        ]
        workload.sort(key=lambda entry: entry.total, reverse=True)

        return DashboardStats(
            total_tasks=total,
            pending_tasks=status_counts.get(TaskStatus.PENDING.value, 0),
            in_progress_tasks=status_counts.get(TaskStatus.IN_PROGRESS.value, 0),
            completed_tasks=completed,
            blocked_tasks=status_counts.get(TaskStatus.BLOCKED.value, 0),
            overdue_tasks=self.tasks.count_overdue(),
            my_tasks=self.tasks.count_for_assignee(current_user_id),
            my_open_tasks=self.tasks.count_for_assignee(current_user_id, open_only=True),
            my_overdue_tasks=self.tasks.count_overdue(assignee_id=current_user_id),
            completion_rate=round(completed / total * 100, 1) if total else 0.0,
            due_this_week=self.tasks.count_due_between(now, week_ahead),
            by_status=StatusBreakdown(
                pending=status_counts.get(TaskStatus.PENDING.value, 0),
                in_progress=status_counts.get(TaskStatus.IN_PROGRESS.value, 0),
                completed=completed,
                blocked=status_counts.get(TaskStatus.BLOCKED.value, 0),
            ),
            by_priority=PriorityBreakdown(
                low=priority_counts.get("low", 0),
                medium=priority_counts.get("medium", 0),
                high=priority_counts.get("high", 0),
                urgent=priority_counts.get("urgent", 0),
            ),
            workload=workload,
            trend=self._build_trend(),
            my_recent_tasks=[
                TaskRead.model_validate(task)
                for task in self.tasks.recent_for_user(current_user_id, limit=5)
            ],
            recently_updated=[
                TaskRead.model_validate(task) for task in self.tasks.recently_updated(limit=6)
            ],
        )
