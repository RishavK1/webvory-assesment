"""Comment schemas."""

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import UTCDateTime
from app.schemas.user import UserSummary


class CommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=2000, examples=["Blocked on the API key."])

    @field_validator("comment")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Comment cannot be blank")
        return cleaned


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    comment: str
    user: UserSummary
    created_at: UTCDateTime
