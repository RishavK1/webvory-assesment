# syntax=docker/dockerfile:1
FROM python:3.13-slim

# Python behaviour inside a container: no .pyc files, unbuffered logs so
# output appears in `docker compose logs` immediately.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies are copied and installed before the source so that editing
# application code does not invalidate the (slow) pip layer.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Run as a non-root user.
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Migrate, seed if empty, then serve. Idempotent, so restarts are safe.
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
