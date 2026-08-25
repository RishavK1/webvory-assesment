"""Shared route dependencies: database session, current user, role guards."""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository

# auto_error=False so a missing token reaches our handler and comes back in
# the same `{"error": {...}}` envelope as every other failure, instead of
# Starlette's default body.
bearer_scheme = HTTPBearer(auto_error=False, description="JWT from POST /api/auth/login")

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> User:
    if credentials is None or not credentials.credentials:
        raise UnauthorizedError("Authentication required. Provide a Bearer token.")

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedError("Your session is invalid or has expired. Please sign in again.")

    subject = payload.get("sub")
    if subject is None or not str(subject).isdigit():
        raise UnauthorizedError("Malformed authentication token.")

    # The user is re-read on every request rather than trusted from the token,
    # so a deactivated or deleted account loses access immediately instead of
    # staying valid until their JWT happens to expire.
    user = UserRepository(db).get(int(subject))
    if user is None:
        raise UnauthorizedError("The account for this token no longer exists.")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated.")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed: UserRole) -> Callable[[User], User]:
    """Build a dependency that admits only the listed roles."""

    def _guard(current_user: CurrentUser) -> User:
        if current_user.role not in allowed:
            raise ForbiddenError(
                "You do not have permission to perform this action.",
                {"required_roles": [role.value for role in allowed], "your_role": current_user.role.value},
            )
        return current_user

    return _guard


# Managing people is a privileged operation; ordinary members are read-only there.
RequireManager = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))]
RequireAdmin = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
