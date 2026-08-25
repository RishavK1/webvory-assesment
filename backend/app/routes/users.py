"""User / team-member endpoints."""

from typing import Annotated

from fastapi import APIRouter, Path, Query, status

from app.routes.dependencies import CurrentUser, DbSession, RequireAdmin, RequireManager
from app.schemas.common import Page, PageMeta
from app.schemas.user import UserCreate, UserRead, UserSummary, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=Page[UserRead], summary="List team members")
def list_users(
    db: DbSession,
    _current_user: CurrentUser,
    search: Annotated[str | None, Query(max_length=120)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[UserRead]:
    items, total = UserService(db).paginate(page=page, limit=limit, search=search)
    return Page[UserRead](
        items=[UserRead.model_validate(user) for user in items],
        meta=PageMeta.build(page=page, limit=limit, total=total),
    )


# Separate lightweight endpoint for assignee dropdowns: the picker needs every
# active teammate at once, which is exactly what a paginated list should not do.
@router.get(
    "/options",
    response_model=list[UserSummary],
    summary="All active users, for assignee pickers",
)
def user_options(db: DbSession, _current_user: CurrentUser) -> list[UserSummary]:
    return [UserSummary.model_validate(user) for user in UserService(db).list_active()]


@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Fetch a single user",
    responses={404: {"description": "User not found"}},
)
def get_user(
    user_id: Annotated[int, Path(ge=1)], db: DbSession, _current_user: CurrentUser
) -> UserRead:
    return UserRead.model_validate(UserService(db).get(user_id))


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a team member (manager or admin)",
    responses={409: {"description": "Email already registered"}},
)
def create_user(payload: UserCreate, db: DbSession, _actor: RequireManager) -> UserRead:
    return UserRead.model_validate(UserService(db).create(payload))


@router.put(
    "/{user_id}",
    response_model=UserRead,
    summary="Update a team member (manager or admin)",
    responses={404: {"description": "User not found"}, 409: {"description": "Email in use"}},
)
def update_user(
    user_id: Annotated[int, Path(ge=1)],
    payload: UserUpdate,
    db: DbSession,
    _actor: RequireManager,
) -> UserRead:
    return UserRead.model_validate(UserService(db).update(user_id, payload))


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a team member (admin only)",
    responses={403: {"description": "Requires the admin role"}},
)
def delete_user(
    user_id: Annotated[int, Path(ge=1)], db: DbSession, _actor: RequireAdmin
) -> None:
    UserService(db).delete(user_id)
