"""Data access for the task activity log."""

from collections.abc import Sequence

from sqlalchemy import select

from app.models.activity import Activity
from app.repositories.base import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    model = Activity

    def list_for_task(self, task_id: int, limit: int = 50) -> Sequence[Activity]:
        stmt = (
            select(Activity)
            .where(Activity.task_id == task_id)
            .order_by(Activity.created_at.desc(), Activity.id.desc())
            .limit(limit)
        )
        return self.db.scalars(stmt).unique().all()
