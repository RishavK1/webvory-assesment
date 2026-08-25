"""Authentication endpoints."""

from fastapi import APIRouter, status

from app.routes.dependencies import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign in and receive a JWT",
    responses={401: {"description": "Incorrect email or password"}},
)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user, token, expires_in = AuthService(db).authenticate(payload)
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=UserRead.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserRead,
    summary="Return the signed-in user",
    responses={401: {"description": "Missing, invalid or expired token"}},
)
def read_current_user(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
