"""Task model — the central record of the application."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TaskPriority, TaskStatus
from app.utils.datetime_utils import utcnow

if TYPE_CHECKING:  # pragma: no cover
    from app.models.activity import Activity
    from app.models.comment import Comment
    from app.models.user import User


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, values_callable=lambda enum: [member.value for member in enum]),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority, values_callable=lambda enum: [member.value for member in enum]),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True,
    )

    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    assignee: Mapped["User | None"] = relationship(
        back_populates="assigned_tasks",
        foreign_keys=[assigned_to],
        lazy="joined",  # assignee is rendered in every list row; avoid N+1
    )
    creator: Mapped["User | None"] = relationship(
        back_populates="created_tasks",
        foreign_keys=[created_by],
        lazy="joined",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Comment.created_at.desc()",
    )
    activities: Mapped[list["Activity"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Activity.created_at.desc()",
    )

    # The dashboard filters on (status, due_date) constantly; a composite
    # index keeps the overdue count cheap as the table grows.
    __table_args__ = (Index("ix_tasks_status_due_date", "status", "due_date"),)

    @property
    def is_overdue(self) -> bool:
        """Past its due date and not yet completed.

        A blocked task can still be overdue — only completion stops the clock.
        """
        if self.due_date is None or self.status == TaskStatus.COMPLETED:
            return False
        return self.due_date < utcnow()

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Task id={self.id} title={self.title!r} status={self.status}>"
