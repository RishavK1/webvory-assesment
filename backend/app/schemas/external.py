"""Schemas for the external (third-party) API integration."""

from pydantic import BaseModel, EmailStr, Field


class ExternalUser(BaseModel):
    """A directory entry fetched from the upstream provider.

    The upstream payload is far larger and more deeply nested than this; we
    map it down to the handful of fields the application actually uses so a
    change in their schema cannot ripple through our codebase.
    """

    external_id: int
    name: str
    email: EmailStr
    username: str | None = None
    company: str | None = None
    website: str | None = None
    city: str | None = None
    already_imported: bool = Field(
        default=False,
        description="True when a local user already exists with this email",
    )


class ExternalUserImportRequest(BaseModel):
    external_ids: list[int] = Field(min_length=1, max_length=50)


class ExternalUserImportResult(BaseModel):
    imported: list[str]
    skipped: list[str]
    message: str


class ExternalSourceMeta(BaseModel):
    """Transparency payload so the UI can show where data came from."""

    source: str
    fetched_at: str
    cached: bool
    cache_ttl_seconds: int
    rate_limit_per_minute: int
    rate_limit_remaining: int
