"""External API integration endpoints."""

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.routes.dependencies import CurrentUser, DbSession, RequireManager
from app.schemas.external import (
    ExternalSourceMeta,
    ExternalUser,
    ExternalUserImportRequest,
    ExternalUserImportResult,
)
from app.services.external_api_service import ExternalApiService

router = APIRouter(prefix="/external", tags=["External API"])


class ExternalDirectoryResponse(BaseModel):
    items: list[ExternalUser]
    meta: ExternalSourceMeta


@router.get(
    "/users",
    response_model=ExternalDirectoryResponse,
    summary="Fetch the external staff directory",
    description=(
        "Proxies a third-party provider through a client that applies a request "
        "timeout, bounded retries with exponential backoff, a client-side rate "
        "limit and a short-lived response cache. Upstream failures are "
        "translated into a 502 with a readable message rather than surfacing "
        "as a 500.\n\n"
        "`meta` reports whether the response was served from cache and how much "
        "rate-limit budget remains."
    ),
    responses={502: {"description": "The upstream provider failed, timed out or rate-limited us"}},
)
async def external_users(db: DbSession, _current_user: CurrentUser) -> ExternalDirectoryResponse:
    items, meta = await ExternalApiService(db).fetch_directory()
    return ExternalDirectoryResponse(items=items, meta=meta)


@router.post(
    "/users/import",
    response_model=ExternalUserImportResult,
    status_code=status.HTTP_201_CREATED,
    summary="Import selected directory entries as team members",
    description=(
        "Imported accounts are created with a random password and the `member` "
        "role, and become immediately assignable. Entries whose email already "
        "exists locally are skipped rather than overwritten."
    ),
)
async def import_external_users(
    payload: ExternalUserImportRequest, db: DbSession, _actor: RequireManager
) -> ExternalUserImportResult:
    return await ExternalApiService(db).import_users(payload.external_ids)
