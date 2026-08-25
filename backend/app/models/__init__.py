"""ORM models.

Every model is imported here so `Base.metadata` is fully populated before
`create_all` (or an Alembic autogenerate) inspects it, and so SQLAlchemy can
resolve the string-based relationship targets.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import column_property

from app.models.activity import Activity
from app.models.comment import Comment
from app.models.enums import ActivityAction, TaskPriority, TaskStatus, UserRole
from app.models.task import Task
from app.models.user import User

# Attached after both classes exist to avoid a circular import.
#
# Declaring the count as a correlated subquery means the task list renders
# "3 comments" from the same SELECT that fetched the tasks. The obvious
# alternative — `len(task.comments)` in the serializer — would issue one
# extra query per row (a classic N+1) on every page load.
Task.comment_count = column_property(
    select(func.count(Comment.id))
    .where(Comment.task_id == Task.id)
    .correlate_except(Comment)
    .scalar_subquery(),
)

__all__ = [
    "Activity",
    "ActivityAction",
    "Comment",
    "Task",
    "TaskPriority",
    "TaskStatus",
    "User",
    "UserRole",
]
