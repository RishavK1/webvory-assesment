"""User business logic."""

from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def get(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if user is None:
            raise NotFoundError(f"User {user_id} was not found.")
        return user

    def list_active(self) -> Sequence[User]:
        return self.users.list_active()

    def paginate(self, *, page: int, limit: int, search: str | None = None):
        return self.users.paginate(page=page, limit=limit, search=search)

    def create(self, payload: UserCreate) -> User:
        # Checked explicitly so a duplicate email produces a clean 409 with a
        # readable message, rather than a raw IntegrityError surfacing as 500.
        if self.users.get_by_email(payload.email):
            raise ConflictError(
                "A user with this email already exists.",
                {"field": "email", "value": payload.email},
            )

        user = self.users.create(
            name=payload.name,
            email=payload.email,
            role=payload.role,
            password_hash=hash_password(payload.password),
        )
        self.db.commit()
        return user

    def update(self, user_id: int, payload: UserUpdate) -> User:
        user = self.get(user_id)
        changes = payload.model_dump(exclude_unset=True)

        new_email = changes.get("email")
        if new_email:
            changes["email"] = new_email.strip().lower()
            existing = self.users.get_by_email(changes["email"])
            if existing and existing.id != user.id:
                raise ConflictError("A user with this email already exists.", {"field": "email"})

        self.users.update(user, **changes)
        self.db.commit()
        return user

    def delete(self, user_id: int) -> None:
        user = self.get(user_id)
        self.users.delete(user)
        self.db.commit()
