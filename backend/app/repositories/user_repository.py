"""Data access for users."""

from collections.abc import Sequence

from sqlalchemy import func, select

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        """Lookup is case-insensitive because emails are stored lowercased."""
        return self.db.scalar(select(User).where(User.email == email.strip().lower()))

    def list_active(self) -> Sequence[User]:
        stmt = select(User).where(User.is_active.is_(True)).order_by(User.name.asc())
        return self.db.scalars(stmt).unique().all()

    def paginate(self, *, page: int, limit: int, search: str | None = None):
        conditions = []
        if search:
            pattern = f"%{_escape_like(search)}%"
            conditions.append(
                User.name.ilike(pattern, escape="\\") | User.email.ilike(pattern, escape="\\")
            )

        total = self.db.scalar(select(func.count(User.id)).where(*conditions)) or 0
        stmt = (
            select(User)
            .where(*conditions)
            .order_by(User.name.asc(), User.id.asc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        return self.db.scalars(stmt).unique().all(), total


def _escape_like(term: str) -> str:
    """Neutralise LIKE wildcards typed by the user.

    Without this, searching for `%` would match every row and `_` would act
    as a single-character wildcard rather than a literal underscore.
    """
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
