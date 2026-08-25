"""Task business logic.

Each public method is one transaction: the task change and its activity-log
entry are committed together, so the history can never disagree with the
record it describes.
"""

from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.activity import Activity
from app.models.comment import Comment
from app.models.enums import ActivityAction
from app.models.task import Task
from app.repositories.activity_repository import ActivityRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.comment import CommentCreate
from app.schemas.task import TaskCreate, TaskFilterParams, TaskUpdate

# Fields whose changes are worth a line in the activity feed. Editing the
# description of a task is noise; reassigning it is not.
TRACKED_FIELDS: dict[str, ActivityAction] = {
    "status": ActivityAction.STATUS_CHANGED,
    "priority": ActivityAction.PRIORITY_CHANGED,
    "assigned_to": ActivityAction.REASSIGNED,
}


class TaskService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.tasks = TaskRepository(db)
        self.users = UserRepository(db)
        self.comments = CommentRepository(db)
        self.activities = ActivityRepository(db)

    # --- reads -----------------------------------------------------------

    def get(self, task_id: int) -> Task:
        task = self.tasks.get(task_id)
        if task is None:
            raise NotFoundError(f"Task {task_id} was not found.")
        return task

    def search(self, params: TaskFilterParams) -> tuple[Sequence[Task], int]:
        return self.tasks.search(params)

    def board(self) -> Sequence[Task]:
        return self.tasks.board()

    def list_comments(self, task_id: int) -> Sequence[Comment]:
        self.get(task_id)  # 404 before returning an empty list for a missing task
        return self.comments.list_for_task(task_id)

    def list_activity(self, task_id: int) -> Sequence[Activity]:
        self.get(task_id)
        return self.activities.list_for_task(task_id)

    # --- writes ----------------------------------------------------------

    def create(self, payload: TaskCreate, *, actor_id: int) -> Task:
        self._assert_assignee_exists(payload.assigned_to)

        task = self.tasks.create(
            title=payload.title,
            description=payload.description,
            status=payload.status,
            priority=payload.priority,
            assigned_to=payload.assigned_to,
            due_date=payload.due_date,
            created_by=actor_id,
        )
        self._log(task.id, actor_id, ActivityAction.CREATED, new_value=task.title)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update(self, task_id: int, payload: TaskUpdate, *, actor_id: int) -> Task:
        task = self.get(task_id)
        changes = payload.model_dump(exclude_unset=True)

        if "assigned_to" in changes:
            self._assert_assignee_exists(changes["assigned_to"])

        # Snapshot the tracked fields before mutating, so the log records what
        # actually changed rather than what was merely submitted.
        previous = {field: getattr(task, field) for field in TRACKED_FIELDS}

        self.tasks.update(task, **changes)

        logged_specific_change = False
        for field, action in TRACKED_FIELDS.items():
            if field not in changes:
                continue
            old_value, new_value = previous[field], getattr(task, field)
            if old_value == new_value:
                continue  # submitted but unchanged — not worth a history entry
            self._log(
                task.id,
                actor_id,
                action,
                field=field,
                old_value=self._label(field, old_value),
                new_value=self._label(field, new_value),
            )
            logged_specific_change = True

        # Edits to untracked fields (title, description, due date) still get a
        # single generic entry so the feed never goes silent after a real edit.
        if not logged_specific_change and changes:
            self._log(task.id, actor_id, ActivityAction.UPDATED, field=", ".join(sorted(changes)))

        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task_id: int) -> None:
        task = self.get(task_id)
        # Comments and activities disappear with the task via ON DELETE CASCADE.
        self.tasks.delete(task)
        self.db.commit()

    def add_comment(self, task_id: int, payload: CommentCreate, *, actor_id: int) -> Comment:
        self.get(task_id)
        comment = self.comments.create(
            task_id=task_id, user_id=actor_id, comment=payload.comment
        )
        self._log(task_id, actor_id, ActivityAction.COMMENTED)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete_comment(self, task_id: int, comment_id: int, *, actor_id: int) -> None:
        comment = self.comments.get(comment_id)
        if comment is None or comment.task_id != task_id:
            raise NotFoundError(f"Comment {comment_id} was not found on task {task_id}.")
        if comment.user_id != actor_id:
            raise BusinessRuleError("You can only delete your own comments.")
        self.comments.delete(comment)
        self.db.commit()

    # --- helpers ---------------------------------------------------------

    def _assert_assignee_exists(self, user_id: int | None) -> None:
        """Reject assignment to a user that does not exist.

        The database FK would also catch this, but only as an opaque
        IntegrityError; raising here yields a 422 naming the offending field.
        """
        if user_id is None:
            return
        if self.users.get(user_id) is None:
            raise BusinessRuleError(
                f"Cannot assign the task to user {user_id}: no such user.",
                {"field": "assigned_to"},
            )

    def _log(
        self,
        task_id: int,
        actor_id: int | None,
        action: ActivityAction,
        *,
        field: str | None = None,
        old_value: str | None = None,
        new_value: str | None = None,
    ) -> None:
        self.activities.create(
            task_id=task_id,
            user_id=actor_id,
            action=action,
            field=field,
            old_value=old_value,
            new_value=new_value,
        )

    def _label(self, field: str, value) -> str | None:
        """Render a stored value for the history feed.

        Assignee ids mean nothing to a reader, so they are resolved to names.
        """
        if value is None:
            return "Unassigned" if field == "assigned_to" else None
        if field == "assigned_to":
            user = self.users.get(value)
            return user.name if user else f"User {value}"
        return str(value)
