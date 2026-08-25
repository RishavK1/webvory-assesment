"""Seed the database with a realistic demo workspace.

Run with:  python -m app.seed         (adds data, keeps anything existing)
           python -m app.seed --reset (drops every row first)

The dataset is deliberately shaped like a real agency backlog rather than
"Task 1 / Task 2": statuses, priorities and due dates are spread so the
dashboard, the filters and the overdue logic all have something to show.
Randomness is seeded, so every run produces the same workspace.
"""

import argparse
import random
from datetime import timedelta

from sqlalchemy import delete, inspect

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import Activity, Comment, Task, User
from app.models.enums import ActivityAction, TaskPriority, TaskStatus, UserRole
from app.utils.datetime_utils import utcnow

RANDOM_SEED = 20260813
DEMO_PASSWORD = "password123"

USERS = [
    ("Elena Vance", "elena@webvory.com", UserRole.ADMIN),
    ("Marcus Sterling", "marcus@webvory.com", UserRole.MANAGER),
    ("Kai Takahashi", "kai@webvory.com", UserRole.MEMBER),
    ("Zara O'Connor", "zara@webvory.com", UserRole.MEMBER),
    ("Liam Chen", "liam@webvory.com", UserRole.MEMBER),
    ("Sofia Morales", "sofia@webvory.com", UserRole.MANAGER),
    ("Dante Rossi", "dante@webvory.com", UserRole.MEMBER),
]

# (title, description, status, priority, days_until_due)
# Negative due offsets produce the overdue bucket reported on the dashboard.
TASKS = [
    ("Architect multi-region read replicas for PostgreSQL", "Deploy secondary read replicas in us-east and eu-central with automatic connection pool routing to reduce query latency.", TaskStatus.IN_PROGRESS, TaskPriority.URGENT, 3),
    ("Implement Redis sliding-window rate limiter for API gateway", "Construct distributed rate limiting middleware at the edge with dynamic Tier-based quotas and X-RateLimit headers.", TaskStatus.BLOCKED, TaskPriority.HIGH, -2),
    ("Decompose monolith auth service into standalone OAuth2 provider", "Extract JWT token issuer and session management into dedicated microservice with Redis revocation list.", TaskStatus.PENDING, TaskPriority.MEDIUM, 14),
    ("Implement WebAuthn passkey authentication", "Add FIDO2 biometric authentication support alongside TOTP multi-factor auth with hardware key fallbacks.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 5),
    ("Configure automated OpenTelemetry distributed tracing", "Instrument all FastAPI microservices and HTTP clients with OpenTelemetry collector and Jaeger visualization.", TaskStatus.COMPLETED, TaskPriority.MEDIUM, -12),
    ("Benchmark pgvector index parameters for AI search", "Optimize HNSW index parameters (m=16, ef_construction=64) for sub-15ms semantic search latency over 2M items.", TaskStatus.PENDING, TaskPriority.LOW, 21),
    ("Resolve memory leak in telemetry ingestion pipeline", "Fix unbounded deque buffer allocations causing worker OOM restarts under high streaming ingest loads.", TaskStatus.IN_PROGRESS, TaskPriority.URGENT, 1),
    ("Migrate Kubernetes ingress to Gateway API and Envoy", "Replace legacy NGINX ingress controllers with Gateway API specs and Envoy proxies for fine-grained routing.", TaskStatus.PENDING, TaskPriority.MEDIUM, 9),
    ("Zero-downtime database schema migration for subscriptions", "Execute expand-and-contract migration pattern with dual-writes and background backfill workers.", TaskStatus.BLOCKED, TaskPriority.HIGH, -5),
    ("Implement fine-grained RBAC permission matrix", "Enforce role-based and attribute-based access control with server-side authorization checks on all endpoints.", TaskStatus.COMPLETED, TaskPriority.HIGH, -8),
    ("Infrastructure provisioning for Nexus Cloud project", "Terraform modules for VPC peering, managed database clusters, and ECS Fargate compute pools.", TaskStatus.COMPLETED, TaskPriority.MEDIUM, -20),
    ("Reduce frontend Largest Contentful Paint below 1.8s", "Optimize SSR critical CSS extraction, defer non-critical bundle chunks, and implement responsive AVIF imagery.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 4),
    ("Automated disaster recovery drill for primary database", "Execute cross-region automated snapshot restore and verify data integrity checksums with zero data loss.", TaskStatus.PENDING, TaskPriority.URGENT, -1),
    ("Build real-time event streaming service with SSE", "Deliver sub-100ms server-sent event push notifications for workspace collaboration and build logs.", TaskStatus.PENDING, TaskPriority.MEDIUM, 16),
    ("Audit WCAG 2.2 AA accessibility compliance across portal", "Comprehensive audit covering keyboard navigation, screen reader ARIA landmarks, contrast, and focus rings.", TaskStatus.PENDING, TaskPriority.HIGH, 7),
    ("Refactor asynchronous webhook dispatch worker", "Implement exponential backoff retry queue with dead-letter queue routing and signature verification.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 6),
    ("Investigate concurrent race condition in inventory ledger", "Resolve idempotency key collision under burst concurrency causing double-allocation in order checkout.", TaskStatus.BLOCKED, TaskPriority.URGENT, -3),
    ("Standardize design system tokens across web applications", "Generate multi-brand theme tokens from Figma variables directly into Tailwind CSS presets.", TaskStatus.IN_PROGRESS, TaskPriority.LOW, 25),
    ("Audit AWS resource sizing and compute reservations", "Review compute instance utilization across staging and production to achieve targeted 25% cost reduction.", TaskStatus.COMPLETED, TaskPriority.LOW, -15),
    ("Build interactive Kanban board with optimistic status sync", "Deliver drag-and-drop task progression with optimistic UI updates and server-side conflict rollback.", TaskStatus.PENDING, TaskPriority.MEDIUM, 11),
    ("Fix viewport overflow and touch scroll friction on iOS", "Eliminate rubber-band scroll interference and mobile safari navigation clipping on iOS 18.", TaskStatus.COMPLETED, TaskPriority.MEDIUM, -6),
    ("Write Playwright end-to-end integration test suite", "Automate full user onboarding, payment verification, and task dispatch workflows in parallel CI runs.", TaskStatus.PENDING, TaskPriority.MEDIUM, 18),
    ("Deploy Sentry error tracking with automated alert routing", "Configure source map uploads, release tracking, and automated Slack escalation policies.", TaskStatus.COMPLETED, TaskPriority.HIGH, -10),
    ("Prepare client delivery demo for Horizon FinTech", "Rehearse staging deployment walkthrough, seed isolated sandbox data, and draft architecture report.", TaskStatus.PENDING, TaskPriority.URGENT, 2),
    ("Implement Cloudflare image optimization pipeline", "Route asset requests through Cloudflare Polish for automated next-gen format conversion and edge caching.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 8),
    ("Draft engineering architecture roadmap for Q4", "Consolidate platform reliability objectives, security compliance milestones, and hiring targets.", TaskStatus.PENDING, TaskPriority.LOW, 30),
    ("Resolve broken canonical URLs after routing migration", "Audit 301 redirect map in edge CDN to clear orphaned routing loops reported in search analytics.", TaskStatus.BLOCKED, TaskPriority.HIGH, -4),
    ("Build Slack workflow integration for incident alerts", "Two-way webhook integration allowing on-call engineers to acknowledge and escalate alerts from Slack.", TaskStatus.PENDING, TaskPriority.MEDIUM, 13),
    ("Security audit of multipart file upload endpoints", "Enforce magic byte MIME validation, clamAV scanning, chunked streaming, and presigned S3 uploads.", TaskStatus.PENDING, TaskPriority.URGENT, 5),
    ("Update internal engineering handbook and runbooks", "Document incident response protocols, release management cycles, and local development standards.", TaskStatus.COMPLETED, TaskPriority.LOW, -25),
    ("Implement asynchronous CSV analytics export engine", "Background task worker utilizing streaming response generation to export multi-million row reports.", TaskStatus.IN_PROGRESS, TaskPriority.LOW, 17),
    ("Eliminate Cumulative Layout Shift on dashboard widgets", "Reserve explicit aspect ratio dimensions on dynamic chart panels to achieve CLS under 0.02.", TaskStatus.PENDING, TaskPriority.HIGH, 3),
    ("Containerize local development environment with Docker", "Provide unified docker compose environment with hot reload for backend, frontend, and PostgreSQL.", TaskStatus.PENDING, TaskPriority.MEDIUM, 12),
    ("Client infrastructure handover: Project Horizon", "Complete KMS key handover, IAM ownership transfer, and conduct recorded administrator walkthrough.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 6),
    ("Third-party script performance audit and tag cleanup", "Profile bundle impact of external analytics tags and migrate tracking to server-side GTM container.", TaskStatus.PENDING, TaskPriority.MEDIUM, 15),
    ("Implement immutable audit logging for security events", "Append-only database journal tracking permission escalations, token generation, and account deletes.", TaskStatus.PENDING, TaskPriority.LOW, 22),
    ("Fix UTC timezone offset calculation in calendar sync", "Correct calendar export timestamp conversion for daylight saving transitions across international regions.", TaskStatus.IN_PROGRESS, TaskPriority.URGENT, -1),
    ("Deploy Unleash feature flag toggle system", "Enable percentage-based canary rollouts and instant feature kills with zero downtime deployment.", TaskStatus.PENDING, TaskPriority.LOW, 28),
    ("Enable Brotli compression and HTTP/3 on reverse proxy", "Upgrade edge proxy configuration to support Brotli compression level 6 and QUIC transport protocol.", TaskStatus.COMPLETED, TaskPriority.MEDIUM, -7),
    ("Automate TLS certificate renewal with Let's Encrypt", "Configure cert-manager in Kubernetes cluster with automated DNS-01 challenge verification.", TaskStatus.PENDING, TaskPriority.URGENT, 4),
    ("Harden bot detection and honeypot on public forms", "Implement invisible proof-of-work challenges and IP velocity throttling to eliminate spam submissions.", TaskStatus.BLOCKED, TaskPriority.MEDIUM, -9),
    ("Create automated rollback runbook for canary deploys", "Automated health check probes triggering automatic traffic draining when error rate exceeds 0.5%.", TaskStatus.PENDING, TaskPriority.HIGH, 10),
    ("Implement system-aware dark mode theme engine", "Full theme engine supporting system preference matching and instant persisted toggle without layout flash.", TaskStatus.COMPLETED, TaskPriority.LOW, -3),
    ("Migrate asset storage from local volume to Ceph/S3", "Migrate 350GB of tenant assets with MD5 checksum validation and zero read downtime.", TaskStatus.PENDING, TaskPriority.MEDIUM, 20),
    ("Fix cursor pagination boundary conditions in task query", "Resolve duplicate record emission across page boundaries when ordering by non-unique columns.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 2),
]

COMMENTS = [
    "Started initial spike and schema draft — expect pull request by end of day.",
    "Blocked: awaiting IAM role delegation and VPC peering approval from devops.",
    "Architecture proposal reviewed and approved. Added feedback regarding edge case handling.",
    "Sprint priority adjusted following customer discovery session; rescheduling for next cycle.",
    "Root cause identified in connection pool exhaustion; patch prepared with eager cleanup.",
    "Staging deployment validated against integration test suite; ready for production release.",
    "Design review requested with frontend leads before committing token structure.",
    "Split scope into primary deliverable and follow-up enhancement to unblock deployment.",
    "Validated fix in production monitoring dashboard; error rate returned to baseline zero.",
    "Security sign-off required prior to merging due to credential handling alterations.",
]


def _moment_between(start, end, *, max_hours: int):
    """Pick a random time after `start` but never after `end`.

    Seeded history has to stay in the past — a comment dated in the future
    renders as "in 3 hours", which immediately reads as fake data.
    """
    available_hours = int((end - start).total_seconds() // 3600)
    return start + timedelta(hours=random.randint(0, max(0, min(max_hours, available_hours))))


def _reset(session) -> None:
    """Delete every row, children first so foreign keys stay satisfied."""
    for model in (Activity, Comment, Task, User):
        session.execute(delete(model))
    session.commit()
    print("  cleared existing data")


def seed(reset: bool = False) -> None:
    random.seed(RANDOM_SEED)

    if "tasks" not in inspect(engine).get_table_names():
        # Convenience for anyone who runs the seed before the migration.
        print("  schema missing — creating tables from the models")
        Base.metadata.create_all(engine)

    session = SessionLocal()
    try:
        if reset:
            _reset(session)

        if session.query(User).count() > 0:
            print("  database already contains users — nothing to do")
            print("  (run with --reset to rebuild the demo workspace)")
            return

        now = utcnow()

        users = [
            User(
                name=name,
                email=email,
                role=role,
                password_hash=hash_password(DEMO_PASSWORD),
                is_active=True,
                created_at=now - timedelta(days=random.randint(60, 400)),
            )
            for name, email, role in USERS
        ]
        session.add_all(users)
        session.flush()
        print(f"  created {len(users)} users")

        tasks: list[Task] = []
        for index, (title, description, status, priority, due_offset) in enumerate(TASKS):
            assignee = users[index % len(users)]
            creator = random.choice(users[:2])  # admin or the lead manager
            created_at = now - timedelta(days=random.randint(1, 45), hours=random.randint(0, 23))

            # Clamp the edit time to the window between creation and now.
            # Adding a flat offset to created_at would push recently-created
            # tasks into the future, and the UI would render "updated in 24
            # hours" — a timestamp that cannot exist.
            hours_since_creation = int((now - created_at).total_seconds() // 3600)
            updated_at = created_at + timedelta(hours=random.randint(0, min(72, hours_since_creation)))

            task = Task(
                title=title,
                description=description,
                status=status,
                priority=priority,
                assigned_to=assignee.id,
                created_by=creator.id,
                due_date=now + timedelta(days=due_offset, hours=random.randint(-6, 6)),
                created_at=created_at,
                updated_at=updated_at,
            )
            tasks.append(task)

        # A few unassigned tasks so the "Unassigned" state is visible in the UI
        # and the assignee filter has something to contrast against.
        for title, description in [
            ("Triage inbound support requests", "Weekly rotation through the shared support inbox."),
            ("Research CDN alternatives", "Compare pricing and edge coverage against the current provider."),
        ]:
            tasks.append(
                Task(
                    title=title,
                    description=description,
                    status=TaskStatus.PENDING,
                    priority=TaskPriority.LOW,
                    assigned_to=None,
                    created_by=users[0].id,
                    due_date=None,
                    created_at=now - timedelta(days=random.randint(1, 10)),
                )
            )

        session.add_all(tasks)
        session.flush()
        print(f"  created {len(tasks)} tasks")

        comment_count = 0
        activity_count = 0
        for task in tasks:
            session.add(
                Activity(
                    task_id=task.id,
                    user_id=task.created_by,
                    action=ActivityAction.CREATED,
                    new_value=task.title,
                    created_at=task.created_at,
                )
            )
            activity_count += 1

            if task.status != TaskStatus.PENDING:
                session.add(
                    Activity(
                        task_id=task.id,
                        user_id=task.assigned_to,
                        action=ActivityAction.STATUS_CHANGED,
                        field="status",
                        old_value=TaskStatus.PENDING.value,
                        new_value=task.status.value,
                        created_at=_moment_between(task.created_at, now, max_hours=48),
                    )
                )
                activity_count += 1

            for _ in range(random.randint(0, 3)):
                author = random.choice(users)
                session.add(
                    Comment(
                        task_id=task.id,
                        user_id=author.id,
                        comment=random.choice(COMMENTS),
                        created_at=_moment_between(task.created_at, now, max_hours=120),
                    )
                )
                comment_count += 1

        session.commit()
        print(f"  created {comment_count} comments and {activity_count} activity entries")

        overdue = sum(1 for t in tasks if t.is_overdue)
        print("\n  Demo workspace ready.")
        print(f"    {len(tasks)} tasks · {overdue} overdue · {len(users)} team members")
        print(f"\n  Sign in with any of these (password: {DEMO_PASSWORD}):")
        for name, email, role in USERS[:3]:
            print(f"    {email:<24} {role.value:<8} {name}")

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Webvory demo workspace.")
    parser.add_argument("--reset", action="store_true", help="delete all existing rows first")
    args = parser.parse_args()
    seed(reset=args.reset)
