"""Task endpoints — the core of the API."""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, status

from app.routes.dependencies import CurrentUser, DbSession
from app.schemas.activity import ActivityRead
from app.schemas.comment import CommentCreate, CommentRead
from app.schemas.common import Page, PageMeta
from app.schemas.task import TaskCreate, TaskFilterParams, TaskRead, TaskUpdate, task_filter_params
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])

TaskId = Annotated[int, Path(ge=1, description="Task identifier")]


@router.get(
    "",
    response_model=Page[TaskRead],
    summary="List tasks with search, filters, sorting and pagination",
    description=(
        "All filtering, searching, sorting and pagination is executed in SQL. "
        "Only the requested page of rows ever leaves the database.\n\n"
        "**Examples**\n"
        "- `/api/tasks?status=in_progress`\n"
        "- `/api/tasks?priority=high&priority=urgent`\n"
        "- `/api/tasks?assignee=12`\n"
        "- `/api/tasks?search=postgres`\n"
        "- `/api/tasks?page=1&limit=20&sort_by=due_date&sort_order=asc`\n"
        "- `/api/tasks?overdue=true`"
    ),
)
def list_tasks(
    db: DbSession,
    _current_user: CurrentUser,
    params: Annotated[TaskFilterParams, Depends(task_filter_params)],
) -> Page[TaskRead]:
    items, total = TaskService(db).search(params)
    return Page[TaskRead](
        items=[TaskRead.model_validate(task) for task in items],
        meta=PageMeta.build(page=params.page, limit=params.limit, total=total),
    )


# Declared before `/{task_id}` — otherwise "board" would be captured as a
# path parameter and rejected as a non-integer id.
@router.get(
    "/board",
    response_model=list[TaskRead],
    summary="All tasks ordered for the Kanban board",
)
def task_board(db: DbSession, _current_user: CurrentUser) -> list[TaskRead]:
    return [TaskRead.model_validate(task) for task in TaskService(db).board()]


@router.get(
    "/{task_id}",
    response_model=TaskRead,
    summary="Fetch a single task",
    responses={404: {"description": "Task not found"}},
)
def get_task(task_id: TaskId, db: DbSession, _current_user: CurrentUser) -> TaskRead:
    return TaskRead.model_validate(TaskService(db).get(task_id))


@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
    responses={422: {"description": "Validation failed or assignee does not exist"}},
)
def create_task(payload: TaskCreate, db: DbSession, current_user: CurrentUser) -> TaskRead:
    task = TaskService(db).create(payload, actor_id=current_user.id)
    return TaskRead.model_validate(task)


@router.put(
    "/{task_id}",
    response_model=TaskRead,
    summary="Update a task (partial payload accepted)",
    responses={404: {"description": "Task not found"}, 422: {"description": "Validation failed"}},
)
def update_task(
    task_id: TaskId, payload: TaskUpdate, db: DbSession, current_user: CurrentUser
) -> TaskRead:
    task = TaskService(db).update(task_id, payload, actor_id=current_user.id)
    return TaskRead.model_validate(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task and its comments/history",
    responses={404: {"description": "Task not found"}},
)
def delete_task(task_id: TaskId, db: DbSession, _current_user: CurrentUser) -> None:
    TaskService(db).delete(task_id)


# --- comments -----------------------------------------------------------


@router.get(
    "/{task_id}/comments",
    response_model=list[CommentRead],
    tags=["Comments"],
    summary="List comments on a task, newest first",
)
def list_comments(task_id: TaskId, db: DbSession, _current_user: CurrentUser) -> list[CommentRead]:
    return [CommentRead.model_validate(c) for c in TaskService(db).list_comments(task_id)]


@router.post(
    "/{task_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Comments"],
    summary="Add a comment to a task",
)
def add_comment(
    task_id: TaskId, payload: CommentCreate, db: DbSession, current_user: CurrentUser
) -> CommentRead:
    comment = TaskService(db).add_comment(task_id, payload, actor_id=current_user.id)
    return CommentRead.model_validate(comment)


@router.delete(
    "/{task_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Comments"],
    summary="Delete your own comment",
    responses={422: {"description": "Attempted to delete another user's comment"}},
)
def delete_comment(
    task_id: TaskId,
    comment_id: Annotated[int, Path(ge=1)],
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    TaskService(db).delete_comment(task_id, comment_id, actor_id=current_user.id)


# --- activity -----------------------------------------------------------


@router.get(
    "/{task_id}/activity",
    response_model=list[ActivityRead],
    tags=["Activity"],
    summary="Audit trail for a task",
)
def list_activity(task_id: TaskId, db: DbSession, _current_user: CurrentUser) -> list[ActivityRead]:
    return [ActivityRead.model_validate(a) for a in TaskService(db).list_activity(task_id)]
