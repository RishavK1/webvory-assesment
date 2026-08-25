"""Activity/history schemas."""

from pydantic import BaseModel, ConfigDict

from app.models.enums import ActivityAction
from app.schemas.common import UTCDateTime
from app.schemas.user import UserSummary


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    action: ActivityAction
    field: str | None
    old_value: str | None
    new_value: str | None
    user: UserSummary | None
    created_at: UTCDateTime
