"""User model — a member of the internal team."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import UserRole
from app.utils.datetime_utils import utcnow

if TYPE_CHECKING:  # pragma: no cover - import cycle guard for type checkers only
    from app.models.comment import Comment
    from app.models.task import Task


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum: [member.value for member in enum]),
        default=UserRole.MEMBER,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    # A user may be deleted while their tasks live on, so the task side uses
    # ON DELETE SET NULL rather than cascading the tasks away.
    assigned_tasks: Mapped[list["Task"]] = relationship(
        back_populates="assignee",
        foreign_keys="Task.assigned_to",
    )
    created_tasks: Mapped[list["Task"]] = relationship(
        back_populates="creator",
        foreign_keys="Task.created_by",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
