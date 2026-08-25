"""Task schemas, including the query-parameter model that drives filtering."""

from datetime import datetime
from enum import StrEnum
from typing import Annotated

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.config import settings
from app.models.enums import TaskPriority, TaskStatus
from app.schemas.common import UTCDateTime
from app.schemas.user import UserSummary
from app.utils.datetime_utils import as_naive_utc


class TaskSortField(StrEnum):
    """Whitelist of sortable columns.

    Restricting sorting to an enum means the value can be interpolated into
    an ORDER BY without any risk of SQL injection, and an unknown field is
    rejected with a 422 instead of silently ignored.
    """

    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    DUE_DATE = "due_date"
    PRIORITY = "priority"
    STATUS = "status"
    TITLE = "title"


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=200, examples=["Deploy GraphQL Gateway API"])
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: int | None = Field(default=None, description="User id of the assignee")
    due_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def _title_not_blank(cls, value: str) -> str:
        cleaned = " ".join(value.split())  # collapse runs of whitespace
        if len(cleaned) < 3:
            raise ValueError("Title must contain at least 3 non-whitespace characters")
        return cleaned

    @field_validator("description")
    @classmethod
    def _blank_description_is_null(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("due_date")
    @classmethod
    def _due_date_to_naive_utc(cls, value: datetime | None) -> datetime | None:
        # Browsers send ISO strings with an offset; normalise before storage
        # so every datetime in the database is naive UTC.
        return as_naive_utc(value) if value else None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    """Partial update — only the supplied fields are touched."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assigned_to: int | None = None
    due_date: datetime | None = None

    # Distinguishes "assigned_to was omitted" from "assigned_to was set to
    # null" (unassign), which a plain optional field cannot express.
    model_config = ConfigDict(extra="forbid")

    @field_validator("title")
    @classmethod
    def _title_not_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if len(cleaned) < 3:
            raise ValueError("Title must contain at least 3 non-whitespace characters")
        return cleaned

    @field_validator("due_date")
    @classmethod
    def _due_date_to_naive_utc(cls, value: datetime | None) -> datetime | None:
        return as_naive_utc(value) if value else None

    @model_validator(mode="after")
    def _reject_empty_payload(self) -> "TaskUpdate":
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update")
        return self


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: UTCDateTime | None
    created_at: UTCDateTime
    updated_at: UTCDateTime

    assignee: UserSummary | None = None
    creator: UserSummary | None = None

    # Derived server-side so the client never recomputes business rules.
    is_overdue: bool = False
    comment_count: int = 0


class TaskFilterParams(BaseModel):
    """Query parameters for `GET /api/tasks`.

    Declared as a model rather than loose function arguments so the same
    filter contract can be reused by exports, reports or a future bulk API.
    """

    model_config = ConfigDict(use_enum_values=False)

    search: str | None = None
    status: list[TaskStatus] | None = None
    priority: list[TaskPriority] | None = None
    assignee: list[int] | None = None
    overdue: bool | None = None
    due_before: datetime | None = None
    due_after: datetime | None = None

    sort_by: TaskSortField = TaskSortField.CREATED_AT
    sort_order: SortOrder = SortOrder.DESC

    page: int = 1
    limit: int = settings.DEFAULT_PAGE_SIZE


def task_filter_params(
    search: Annotated[
        str | None,
        Query(max_length=200, description="Case-insensitive match on title or description"),
    ] = None,
    status: Annotated[
        list[TaskStatus] | None,
        Query(description="Repeatable, e.g. ?status=pending&status=blocked"),
    ] = None,
    priority: Annotated[list[TaskPriority] | None, Query(description="Repeatable")] = None,
    assignee: Annotated[
        list[int] | None, Query(description="Repeatable user ids, e.g. ?assignee=12")
    ] = None,
    overdue: Annotated[
        bool | None, Query(description="true = only overdue, false = only on-track")
    ] = None,
    due_before: Annotated[datetime | None, Query()] = None,
    due_after: Annotated[datetime | None, Query()] = None,
    sort_by: Annotated[TaskSortField, Query()] = TaskSortField.CREATED_AT,
    sort_order: Annotated[SortOrder, Query()] = SortOrder.DESC,
    page: Annotated[int, Query(ge=1, description="1-indexed page number")] = 1,
    limit: Annotated[int, Query(ge=1, le=settings.MAX_PAGE_SIZE)] = settings.DEFAULT_PAGE_SIZE,
) -> TaskFilterParams:
    """FastAPI dependency that validates and bundles the query string.

    Bounds live here (`ge=1`, `le=MAX_PAGE_SIZE`) so a client cannot ask for
    `?limit=1000000` and pull the whole table into memory.
    """
    return TaskFilterParams(
        search=search.strip() if search and search.strip() else None,
        status=status,
        priority=priority,
        assignee=assignee,
        overdue=overdue,
        due_before=as_naive_utc(due_before) if due_before else None,
        due_after=as_naive_utc(due_after) if due_after else None,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
