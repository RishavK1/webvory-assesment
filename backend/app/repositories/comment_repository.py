"""Data access for task comments."""

from collections.abc import Sequence

from sqlalchemy import select

from app.models.comment import Comment
from app.repositories.base import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    model = Comment

    def list_for_task(self, task_id: int) -> Sequence[Comment]:
        stmt = (
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at.desc(), Comment.id.desc())
        )
        return self.db.scalars(stmt).unique().all()
