"""User request/response schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.common import UTCDateTime


class UserBase(BaseModel):
    name: str = Field(min_length=2, max_length=120, examples=["Elena Vance"])
    email: EmailStr = Field(examples=["alex@webvory.com"])
    role: UserRole = Field(default=UserRole.MEMBER)

    @field_validator("name")
    @classmethod
    def _name_must_not_be_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name cannot be blank")
        return cleaned

    @field_validator("email")
    @classmethod
    def _normalise_email(cls, value: str) -> str:
        # Emails are case-insensitive; store one canonical form so the unique
        # index actually prevents duplicates like Bob@x.com / bob@x.com.
        return value.strip().lower()


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72, examples=["password123"])

    @field_validator("password")
    @classmethod
    def _password_strength(cls, value: str) -> str:
        if value.strip() != value:
            raise ValueError("Password cannot start or end with whitespace")
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes")
        return value


class UserUpdate(BaseModel):
    """Every field optional — this is a partial update."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserSummary(BaseModel):
    """Slim representation embedded inside task payloads."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole


class UserRead(UserSummary):
    """Full user representation. Never includes `password_hash`."""

    is_active: bool
    created_at: UTCDateTime
    updated_at: UTCDateTime
