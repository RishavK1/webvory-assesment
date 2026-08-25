"""Immutable activity log for a task.

Rows are only ever inserted, never updated, which makes this table double as
a lightweight audit trail: every status change, reassignment and edit is
attributable to a user and a point in time.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ActivityAction
from app.utils.datetime_utils import utcnow

if TYPE_CHECKING:  # pragma: no cover
    from app.models.task import Task
    from app.models.user import User


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    action: Mapped[ActivityAction] = mapped_column(
        Enum(ActivityAction, values_callable=lambda enum: [member.value for member in enum]),
        nullable=False,
    )
    field: Mapped[str | None] = mapped_column(String(60), nullable=True)
    old_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    new_value: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    task: Mapped["Task"] = relationship(back_populates="activities")
    user: Mapped["User | None"] = relationship(lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Activity id={self.id} action={self.action} task_id={self.task_id}>"
