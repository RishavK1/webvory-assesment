"""Domain exceptions and the handlers that turn them into HTTP responses.

Services raise semantic errors (`NotFoundError`, `ConflictError`, ...) and
never import FastAPI. The handlers registered here are the single place that
maps a domain failure onto a status code, so every error the API emits shares
one response shape:

    {"error": {"code": "not_found", "message": "...", "details": {...}}}
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings


class AppError(Exception):
    """Base class for every expected, non-bug failure in the application."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "bad_request"

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ConflictError(AppError):
    """A uniqueness or state constraint was violated (e.g. duplicate email)."""

    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class BusinessRuleError(AppError):
    """Input was well-formed but violates a domain rule."""

    status_code = 422  # named constant was renamed across Starlette versions
    code = "unprocessable_entity"


class ExternalServiceError(AppError):
    """An upstream third-party API failed, timed out or rate-limited us."""

    status_code = status.HTTP_502_BAD_GATEWAY
    code = "external_service_error"


def _error_body(code: str, message: str, details: dict | None = None) -> dict:
    body: dict = {"error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return body


def register_exception_handlers(app: FastAPI) -> None:
    """Attach every handler to the application instance."""

    @app.exception_handler(AppError)
    async def _handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Flatten Pydantic's error list into `field -> message` so the
        # frontend can drop messages straight onto the right input.
        field_errors: dict[str, str] = {}
        for error in exc.errors():
            location = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
            field_errors[".".join(location) or "body"] = error["msg"]
        return JSONResponse(
            status_code=422,
            content=_error_body(
                "validation_error",
                "The request contains invalid data.",
                {"fields": field_errors},
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http_exception(
        _request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        codes = {401: "unauthorized", 403: "forbidden", 404: "not_found", 405: "method_not_allowed"}
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(codes.get(exc.status_code, "http_error"), str(exc.detail)),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
        # Never leak a stack trace to the client in production; surface it in
        # development so debugging stays fast.
        message = str(exc) if settings.DEBUG else "An unexpected error occurred."
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body("internal_server_error", message),
        )
