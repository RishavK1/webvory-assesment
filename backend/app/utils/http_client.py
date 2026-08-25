"""Resilient HTTP client for outbound third-party API requests."""

import asyncio
import random
import time
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalServiceError

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


class TTLCache:
    """In-process cache with TTL expiration."""

    def __init__(self, ttl_seconds: int) -> None:
        self._ttl = ttl_seconds
        self._store: dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if entry.expires_at < time.monotonic():
                del self._store[key]
                return None
            return entry.value
            return entry.value

    async def set(self, key: str, value: Any) -> None:
        async with self._lock:
            self._store[key] = CacheEntry(value, time.monotonic() + self._ttl)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()


class TokenBucketRateLimiter:
    """Client-side token bucket rate limiter."""

    def __init__(self, rate_per_minute: int) -> None:
        self.capacity = float(rate_per_minute)
        self._tokens = float(rate_per_minute)
        self._refill_per_second = rate_per_minute / 60.0
        self._updated_at = time.monotonic()
        self._lock = asyncio.Lock()

    def _refill(self) -> None:
        now = time.monotonic()
        elapsed = now - self._updated_at
        self._tokens = min(self.capacity, self._tokens + elapsed * self._refill_per_second)
        self._updated_at = now

    @property
    def remaining(self) -> int:
        self._refill()
        return int(self._tokens)

    async def acquire(self, timeout: float = 5.0) -> None:
        deadline = time.monotonic() + timeout
        while True:
            async with self._lock:
                self._refill()
                if self._tokens >= 1:
                    self._tokens -= 1
                    return
                wait_for = (1 - self._tokens) / self._refill_per_second
            if time.monotonic() + wait_for > deadline:
                raise ExternalServiceError(
                    "Rate limit reached for the external provider. Please retry shortly.",
                    {"retry_after_seconds": round(wait_for, 1)},
                )
            await asyncio.sleep(min(wait_for, 0.25))


class ResilientHttpClient:
    """Asynchronous HTTP client with connection pooling, retries, and caching."""

    def __init__(
        self,
        base_url: str,
        *,
        api_key: str | None = None,
        timeout: float = 8.0,
        max_retries: int = 3,
        backoff: float = 0.5,
        cache_ttl: int = 300,
        rate_limit_per_minute: int = 30,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.max_retries = max_retries
        self.backoff = backoff
        self.cache = TTLCache(cache_ttl)
        self.rate_limiter = TokenBucketRateLimiter(rate_limit_per_minute)
        self._timeout = httpx.Timeout(timeout, connect=min(timeout, 5.0))
        self._client: httpx.AsyncClient | None = None

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json", "User-Agent": f"{settings.APP_NAME}/1.0"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _ensure_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self._timeout,
                headers=self._headers(),
                follow_redirects=True,
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            )
        return self._client

    async def aclose(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def get_json(self, path: str, params: dict | None = None) -> tuple[Any, bool]:
        """GET JSON payload with cache and retry handling."""
        cache_key = f"GET {path}?{sorted((params or {}).items())}"

        cached = await self.cache.get(cache_key)
        if cached is not None:
            return cached, True

        await self.rate_limiter.acquire()
        client = await self._ensure_client()

        last_error: str = "unknown error"
        for attempt in range(1, self.max_retries + 1):
            try:
                response = await client.get(path, params=params)

                if response.status_code in RETRYABLE_STATUS_CODES:
                    last_error = f"upstream returned {response.status_code}"
                    retry_after = _parse_retry_after(response.headers.get("Retry-After"))
                    if attempt < self.max_retries:
                        await asyncio.sleep(retry_after or self._backoff_delay(attempt))
                        continue
                    raise ExternalServiceError(
                        f"The external provider is unavailable ({response.status_code}).",
                        {"attempts": attempt, "status_code": response.status_code},
                    )

                if response.status_code >= 400:
                    raise ExternalServiceError(
                        f"The external provider rejected the request ({response.status_code}).",
                        {"status_code": response.status_code},
                    )

                try:
                    payload = response.json()
                except ValueError as exc:
                    raise ExternalServiceError(
                        "The external provider returned a malformed JSON response."
                    ) from exc

                await self.cache.set(cache_key, payload)
                return payload, False

            except httpx.TimeoutException as exc:
                last_error = "request timed out"
                if attempt >= self.max_retries:
                    raise ExternalServiceError(
                        "The external provider timed out.",
                        {"attempts": attempt, "timeout_seconds": self._timeout.read},
                    ) from exc
                await asyncio.sleep(self._backoff_delay(attempt))

            except httpx.HTTPError as exc:
                last_error = f"network error: {type(exc).__name__}"
                if attempt >= self.max_retries:
                    raise ExternalServiceError(
                        "Could not reach the external provider.",
                        {"attempts": attempt, "reason": type(exc).__name__},
                    ) from exc
                await asyncio.sleep(self._backoff_delay(attempt))

        raise ExternalServiceError(f"External request failed: {last_error}")

    def _backoff_delay(self, attempt: int) -> float:
        return self.backoff * (2 ** (attempt - 1)) * (1 + random.random() * 0.3)


def _parse_retry_after(value: str | None) -> float | None:
    if not value:
        return None
    try:
        # Only the delta-seconds form is handled; the HTTP-date form is rare
        # in practice and not worth the parsing surface here.
        return max(0.0, float(value))
    except ValueError:
        return None


# Module-level singleton: one connection pool, one cache and one rate-limit
# budget shared by the whole process.
external_api_client = ResilientHttpClient(
    base_url=settings.EXTERNAL_API_BASE_URL,
    api_key=settings.EXTERNAL_API_KEY,
    timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS,
    max_retries=settings.EXTERNAL_API_MAX_RETRIES,
    backoff=settings.EXTERNAL_API_BACKOFF_SECONDS,
    cache_ttl=settings.EXTERNAL_API_CACHE_TTL_SECONDS,
    rate_limit_per_minute=settings.EXTERNAL_API_RATE_LIMIT_PER_MINUTE,
)
