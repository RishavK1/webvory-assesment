"""Authentication logic."""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def authenticate(self, payload: LoginRequest) -> tuple[User, str, int]:
        user = self.users.get_by_email(payload.email)

        # The same generic message is returned whether the email is unknown or
        # the password is wrong. Distinguishing the two would let an attacker
        # enumerate which addresses have accounts.
        invalid = UnauthorizedError("Incorrect email or password.")
        if user is None or not verify_password(payload.password, user.password_hash):
            raise invalid
        if not user.is_active:
            raise UnauthorizedError("This account has been deactivated.")

        token = create_access_token(user.id, {"role": user.role.value, "email": user.email})
        return user, token, settings.JWT_EXPIRE_MINUTES * 60

    def get_by_id(self, user_id: int) -> User | None:
        return self.users.get(user_id)
