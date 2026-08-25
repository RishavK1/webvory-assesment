"""Third-party API integration.

Rather than fetching a list and printing it somewhere decorative, this
integration does something the product actually needs: it exposes an external
staff directory that an admin can browse and **import** teammates from, so
imported people become assignable task owners.

The upstream is JSONPlaceholder, chosen because it needs no credentials and
is stable for review. Everything around the call — the auth header, timeout,
retry, rate-limit and cache — is provider-agnostic and lives in
`app/utils/http_client.py`, so swapping in a real, key-protected provider is
a base-URL and an API key, not a rewrite.
"""

import secrets

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.core.security import hash_password
from app.models.enums import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.external import (
    ExternalSourceMeta,
    ExternalUser,
    ExternalUserImportResult,
)
from app.utils.datetime_utils import to_utc_iso, utcnow
from app.utils.http_client import external_api_client


class ExternalApiService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.client = external_api_client

    async def fetch_directory(self) -> tuple[list[ExternalUser], ExternalSourceMeta]:
        """Fetch the upstream directory and reconcile it against local users."""
        payload, from_cache = await self.client.get_json("/users")

        if not isinstance(payload, list):
            # Defensive: never trust an upstream to keep its shape. A dict
            # where a list was expected should be a clean 502, not a
            # TypeError halfway through a comprehension.
            raise ExternalServiceError(
                "Unexpected response shape from the external provider.",
                {"expected": "array", "received": type(payload).__name__},
            )

        directory = [self._map_user(entry) for entry in payload if isinstance(entry, dict)]
        directory = [entry for entry in directory if entry is not None]

        # One query for the whole reconciliation instead of one per row.
        existing_emails = {
            user.email.lower() for user in self.users.list_all() if user.email
        }
        for entry in directory:
            entry.already_imported = entry.email.lower() in existing_emails

        meta = ExternalSourceMeta(
            source=settings.EXTERNAL_API_BASE_URL,
            fetched_at=to_utc_iso(utcnow()) or "",
            cached=from_cache,
            cache_ttl_seconds=settings.EXTERNAL_API_CACHE_TTL_SECONDS,
            rate_limit_per_minute=settings.EXTERNAL_API_RATE_LIMIT_PER_MINUTE,
            rate_limit_remaining=self.client.rate_limiter.remaining,
        )
        return directory, meta

    async def import_users(self, external_ids: list[int]) -> ExternalUserImportResult:
        """Create local accounts for the chosen directory entries."""
        directory, _ = await self.fetch_directory()
        wanted = {entry.external_id: entry for entry in directory}

        imported: list[str] = []
        skipped: list[str] = []

        for external_id in external_ids:
            entry = wanted.get(external_id)
            if entry is None:
                skipped.append(f"id {external_id} (not present upstream)")
                continue
            if self.users.get_by_email(entry.email):
                skipped.append(f"{entry.email} (already exists)")
                continue

            # Imported accounts get a random, unguessable password. They are
            # assignable immediately; the person sets a real password through
            # a reset flow rather than inheriting a shared default.
            self.users.create(
                name=entry.name,
                email=entry.email.lower(),
                role=UserRole.MEMBER,
                password_hash=hash_password(secrets.token_urlsafe(24)),
            )
            imported.append(entry.email)

        self.db.commit()

        return ExternalUserImportResult(
            imported=imported,
            skipped=skipped,
            message=f"Imported {len(imported)} user(s), skipped {len(skipped)}.",
        )

    @staticmethod
    def _map_user(entry: dict) -> ExternalUser | None:
        """Translate one upstream record into our own shape.

        Returns None for records missing the fields we require, so a single
        malformed row degrades that row instead of failing the whole request.
        """
        try:
            email = str(entry["email"]).strip().lower()
            return ExternalUser(
                external_id=int(entry["id"]),
                name=str(entry["name"]).strip(),
                email=email,
                username=str(entry.get("username") or "") or None,
                company=(entry.get("company") or {}).get("name"),
                website=str(entry.get("website") or "") or None,
                city=(entry.get("address") or {}).get("city"),
            )
        except (KeyError, TypeError, ValueError):
            return None
