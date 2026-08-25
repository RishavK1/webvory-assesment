"""Generic repository.

Repositories own *persistence* and nothing else: they build and run queries,
and they `flush()` so generated ids become available — but they never
`commit()`. Committing is the service layer's job, which is what allows a
single service call to update a task **and** append its activity row inside
one atomic transaction.
"""

from collections.abc import Sequence
from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """CRUD operations shared by every concrete repository."""

    model: type[ModelT]

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, entity_id: int) -> ModelT | None:
        return self.db.get(self.model, entity_id)

    def list_all(self) -> Sequence[ModelT]:
        return self.db.scalars(select(self.model)).unique().all()

    def count(self) -> int:
        return self.db.scalar(select(func.count()).select_from(self.model)) or 0

    def exists(self, **filters: Any) -> bool:
        stmt = select(self.model.id).filter_by(**filters).limit(1)
        return self.db.scalar(stmt) is not None

    def create(self, **fields: Any) -> ModelT:
        instance = self.model(**fields)
        self.db.add(instance)
        self.db.flush()  # populates the primary key without ending the transaction
        return instance

    def update(self, instance: ModelT, **fields: Any) -> ModelT:
        for key, value in fields.items():
            setattr(instance, key, value)
        self.db.flush()
        return instance

    def delete(self, instance: ModelT) -> None:
        self.db.delete(instance)
        self.db.flush()
