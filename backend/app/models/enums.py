"""Shared domain enumerations.

Values are the lowercase snake_case strings used on the wire, so
`?status=in_progress` in a query string maps straight onto the enum.
"""

from enum import StrEnum


class TaskStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

    @property
    def rank(self) -> int:
        """Numeric weight so 'sort by priority' orders urgent -> low."""
        return {"low": 0, "medium": 1, "high": 2, "urgent": 3}[self.value]


class UserRole(StrEnum):
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"


class ActivityAction(StrEnum):
    CREATED = "created"
    UPDATED = "updated"
    STATUS_CHANGED = "status_changed"
    PRIORITY_CHANGED = "priority_changed"
    REASSIGNED = "reassigned"
    COMMENTED = "commented"
