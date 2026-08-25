"""Data access repository for task entities."""

from collections.abc import Sequence
from typing import Any

from sqlalchemy import Select, case, func, select
from sqlalchemy.sql.elements import ColumnElement

from app.models.enums import TaskPriority, TaskStatus
from app.models.task import Task
from app.schemas.task import SortOrder, TaskFilterParams, TaskSortField
from app.utils.datetime_utils import utcnow


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


PRIORITY_RANK = case(
    (Task.priority == TaskPriority.URGENT, 4),
    (Task.priority == TaskPriority.HIGH, 3),
    (Task.priority == TaskPriority.MEDIUM, 2),
    (Task.priority == TaskPriority.LOW, 1),
    else_=0,
)

STATUS_RANK = case(
    (Task.status == TaskStatus.BLOCKED, 4),
    (Task.status == TaskStatus.IN_PROGRESS, 3),
    (Task.status == TaskStatus.PENDING, 2),
    (Task.status == TaskStatus.COMPLETED, 1),
    else_=0,
)


class TaskRepository:
    """Query builder and database operations for Task."""

    def __init__(self, db) -> None:
        self.db = db

    # --- reads -----------------------------------------------------------

    def get(self, task_id: int) -> Task | None:
        return self.db.get(Task, task_id)

    def search(self, params: TaskFilterParams) -> tuple[Sequence[Task], int]:
        """Return one page of tasks plus the total number of matches.

        The total is computed with a dedicated `COUNT(*)` over the same
        WHERE clause, so pagination metadata stays correct without fetching
        the rows twice.
        """
        conditions = self._build_conditions(params)

        total = self.db.scalar(select(func.count(Task.id)).where(*conditions)) or 0

        stmt = select(Task).where(*conditions)
        stmt = self._apply_ordering(stmt, params)
        stmt = stmt.offset((params.page - 1) * params.limit).limit(params.limit)

        items = self.db.scalars(stmt).unique().all()
        return items, total

    def _build_conditions(self, params: TaskFilterParams) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []

        if params.search:
            pattern = f"%{_escape_like(params.search)}%"
            conditions.append(
                Task.title.ilike(pattern, escape="\\")
                | Task.description.ilike(pattern, escape="\\")
            )

        # Repeated query params become an IN (...) rather than several
        # round trips, e.g. ?status=pending&status=blocked
        if params.status:
            conditions.append(Task.status.in_(params.status))
        if params.priority:
            conditions.append(Task.priority.in_(params.priority))
        if params.assignee:
            conditions.append(Task.assigned_to.in_(params.assignee))

        if params.overdue is not None:
            now = utcnow()
            is_overdue = (
                Task.due_date.is_not(None)
                & (Task.due_date < now)
                & (Task.status != TaskStatus.COMPLETED)
            )
            conditions.append(is_overdue if params.overdue else ~is_overdue)

        if params.due_before:
            conditions.append(Task.due_date <= params.due_before)
        if params.due_after:
            conditions.append(Task.due_date >= params.due_after)

        return conditions

    def _apply_ordering(self, stmt: Select, params: TaskFilterParams) -> Select:
        descending = params.sort_order == SortOrder.DESC

        if params.sort_by == TaskSortField.PRIORITY:
            column: Any = PRIORITY_RANK
        elif params.sort_by == TaskSortField.STATUS:
            column = STATUS_RANK
        else:
            column = getattr(Task, params.sort_by.value)

        order_by = [column.desc() if descending else column.asc()]

        if params.sort_by == TaskSortField.DUE_DATE:
            # Tasks with no due date belong at the end in either direction,
            # not mixed in with the earliest/latest dates. Expressed as a
            # boolean sort key because NULLS LAST is not portable.
            order_by.insert(0, Task.due_date.is_(None).asc())

        # Deterministic tiebreaker. Without it, rows sharing a sort value can
        # be returned in a different order per query, so the same row could
        # appear on page 1 and page 2 — or be skipped entirely.
        order_by.append(Task.id.desc())

        return stmt.order_by(*order_by)

    # --- aggregates used by the dashboard --------------------------------

    def count_by_status(self) -> dict[str, int]:
        rows = self.db.execute(select(Task.status, func.count(Task.id)).group_by(Task.status)).all()
        return {str(status): count for status, count in rows}

    def count_by_priority(self) -> dict[str, int]:
        rows = self.db.execute(
            select(Task.priority, func.count(Task.id)).group_by(Task.priority)
        ).all()
        return {str(priority): count for priority, count in rows}

    def count_overdue(self, assignee_id: int | None = None) -> int:
        conditions = [
            Task.due_date.is_not(None),
            Task.due_date < utcnow(),
            Task.status != TaskStatus.COMPLETED,
        ]
        if assignee_id is not None:
            conditions.append(Task.assigned_to == assignee_id)
        return self.db.scalar(select(func.count(Task.id)).where(*conditions)) or 0

    def count_for_assignee(self, user_id: int, *, open_only: bool = False) -> int:
        conditions = [Task.assigned_to == user_id]
        if open_only:
            conditions.append(Task.status != TaskStatus.COMPLETED)
        return self.db.scalar(select(func.count(Task.id)).where(*conditions)) or 0

    def count_due_between(self, start, end) -> int:
        return (
            self.db.scalar(
                select(func.count(Task.id)).where(
                    Task.due_date.is_not(None),
                    Task.due_date >= start,
                    Task.due_date <= end,
                    Task.status != TaskStatus.COMPLETED,
                )
            )
            or 0
        )

    def workload_by_user(self) -> Sequence[Any]:
        """One row per assignee: total, completed and overdue counts.

        Done as a single grouped query rather than a loop of per-user counts,
        which would be N+1 round trips.
        """
        now = utcnow()
        completed = func.sum(case((Task.status == TaskStatus.COMPLETED, 1), else_=0))
        overdue = func.sum(
            case(
                (
                    Task.due_date.is_not(None)
                    & (Task.due_date < now)
                    & (Task.status != TaskStatus.COMPLETED),
                    1,
                ),
                else_=0,
            )
        )
        stmt = (
            select(
                Task.assigned_to,
                func.count(Task.id).label("total"),
                completed.label("completed"),
                overdue.label("overdue"),
            )
            .where(Task.assigned_to.is_not(None))
            .group_by(Task.assigned_to)
        )
        return self.db.execute(stmt).all()

    def recent_for_user(self, user_id: int, limit: int = 5) -> Sequence[Task]:
        stmt = (
            select(Task)
            .where(Task.assigned_to == user_id, Task.status != TaskStatus.COMPLETED)
            .order_by(Task.due_date.is_(None).asc(), Task.due_date.asc(), Task.id.desc())
            .limit(limit)
        )
        return self.db.scalars(stmt).unique().all()

    def recently_updated(self, limit: int = 5) -> Sequence[Task]:
        stmt = select(Task).order_by(Task.updated_at.desc(), Task.id.desc()).limit(limit)
        return self.db.scalars(stmt).unique().all()

    def board(self) -> Sequence[Task]:
        """All tasks ordered for the Kanban view (urgent first per column)."""
        stmt = select(Task).order_by(PRIORITY_RANK.desc(), Task.due_date.is_(None).asc(), Task.due_date.asc())
        return self.db.scalars(stmt).unique().all()


    def created_since(self, cutoff) -> Sequence[Any]:
        """Creation timestamps inside the window, for the throughput chart.

        Bucketing is done in Python rather than with SQL date truncation
        because `date_trunc` (PostgreSQL) and `strftime` (SQLite) are not
        interchangeable. The window is small — a couple of weeks of an
        internal team's tasks — so the portability is worth more here than
        pushing the GROUP BY down.
        """
        return self.db.scalars(
            select(Task.created_at).where(Task.created_at >= cutoff)
        ).all()

    def completed_since(self, cutoff) -> Sequence[Any]:
        """When tasks actually reached 'completed', from the activity log.

        `updated_at` would be wrong: it moves on *any* later edit, so a task
        completed last week but re-titled today would report as completed
        today. The activity row is the real completion event.
        """
        from app.models.activity import Activity
        from app.models.enums import ActivityAction

        return self.db.scalars(
            select(Activity.created_at).where(
                Activity.action == ActivityAction.STATUS_CHANGED,
                Activity.new_value == TaskStatus.COMPLETED.value,
                Activity.created_at >= cutoff,
            )
        ).all()

    # --- writes ----------------------------------------------------------

    def create(self, **fields: Any) -> Task:
        task = Task(**fields)
        self.db.add(task)
        self.db.flush()
        return task

    def update(self, task: Task, **fields: Any) -> Task:
        for key, value in fields.items():
            setattr(task, key, value)
        self.db.flush()
        return task

    def delete(self, task: Task) -> None:
        self.db.delete(task)
        self.db.flush()
