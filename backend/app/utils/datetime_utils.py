"""Datetime helpers.

The whole application stores **naive UTC** datetimes. That choice keeps
SQLite and PostgreSQL byte-for-byte consistent (SQLite has no native
timezone-aware type, so a tz-aware value written there comes back naive and
blows up any later comparison with `TypeError`).

Everything is converted back to an explicit `...Z` ISO string at the API
boundary, so clients are never left guessing which zone a timestamp is in.
"""

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Current UTC time as a naive datetime."""
    return datetime.now(UTC).replace(tzinfo=None)


def as_naive_utc(value: datetime) -> datetime:
    """Normalise any datetime to naive UTC.

    Aware values are converted to UTC then stripped; naive values are assumed
    to already be UTC and returned unchanged.
    """
    if value.tzinfo is not None:
        return value.astimezone(UTC).replace(tzinfo=None)
    return value


def to_utc_iso(value: datetime | None) -> str | None:
    """Serialise a stored naive-UTC datetime as an unambiguous ISO-8601 string."""
    if value is None:
        return None
    return as_naive_utc(value).isoformat(timespec="seconds") + "Z"
