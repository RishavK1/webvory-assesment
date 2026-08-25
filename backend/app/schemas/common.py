"""Shared schema building blocks: UTC datetimes and the pagination envelope."""

from datetime import datetime
from math import ceil
from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, Field, PlainSerializer

from app.utils.datetime_utils import to_utc_iso

# Stored datetimes are naive UTC; always emit them with an explicit `Z` so no
# client has to guess the zone.
UTCDateTime = Annotated[
    datetime,
    PlainSerializer(to_utc_iso, return_type=str, when_used="json"),
]

T = TypeVar("T")


class PageMeta(BaseModel):
    """Pagination metadata returned alongside every paginated list."""

    page: int = Field(description="Current 1-indexed page number", examples=[1])
    limit: int = Field(description="Items requested per page", examples=[10])
    total: int = Field(description="Total items matching the filters", examples=[42])
    pages: int = Field(description="Total number of pages", examples=[5])
    has_next: bool
    has_prev: bool

    @classmethod
    def build(cls, *, page: int, limit: int, total: int) -> "PageMeta":
        pages = ceil(total / limit) if limit else 0
        return cls(
            page=page,
            limit=limit,
            total=total,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1,
        )


class Page(BaseModel, Generic[T]):
    """Generic paginated response: `Page[TaskRead]`, `Page[UserRead]`, ..."""

    items: list[T]
    meta: PageMeta


class MessageResponse(BaseModel):
    """Simple acknowledgement body for endpoints with nothing else to say."""

    message: str
