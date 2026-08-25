# Webvory — Internal Task & Workspace Management Engine

![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19_+_Vite_6-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy_2.0-D71F00?style=flat-square&logo=python&logoColor=white)
![Database](https://img.shields.io/badge/Database-SQLite_%7C_PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

A full-stack, enterprise-grade internal workspace and task tracking system built with **FastAPI** and **React 19 / Vite**. Webvory provides product and engineering teams with real-time delivery metrics, an interactive Kanban board with drag-and-drop, threaded task discussions, immutable activity audit trails, and resilient third-party staff synchronization.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Setup Instructions](#4-setup-instructions)
5. [Environment Variables](#5-environment-variables)
6. [Database Setup & Schema](#6-database-setup--schema)
7. [How to Run the Backend](#7-how-to-run-the-backend)
8. [How to Run the Frontend](#8-how-to-run-the-frontend)
9. [API Documentation & cURL Samples](#9-api-documentation--curl-samples)
10. [Bonus Features Implemented](#10-bonus-features-implemented)
11. [Any Assumptions Made](#11-any-assumptions-made)

---

## 1. Project Overview

Webvory provides a centralized workspace for cross-functional teams to track, organize, and execute work efficiently.

### Key Capabilities
- **Executive Command Center:** Real-time KPI summary (Total Tasks, In Progress, Pending, Completed, Blocked, Overdue) alongside interactive charts (*Throughput Velocity, Status Composition, Priority Spectrum, and Team Workload Capacity*).
- **Task Management (Full CRUD):** Create, view, update, delete, and reassign tasks with rich markdown descriptions, multi-tiered priority indicators, and due dates.
- **Server-Side Backlog Search:** Real-time 350ms debounced text search, multi-criteria filtering, column sorting, and pagination executed in SQL.
- **Interactive Drag-and-Drop Kanban Board:** Fluid card transitions between status columns with optimistic UI updates and server rollback on failure.
- **Threaded Discussions & Activity Logs:** Deliverable discussion notes and an automated chronological audit log tracking every status, priority, and assignee change.
- **Team Directory & External Sync:** Workspace member provisioning with Role-Based Access Control (Admin, Manager, Member) and an external staff sync client with caching and rate limiting.
- **Universal Light / Dark Mode & Responsive Layout:** Zero-flicker theme persistence via `useSyncExternalStore` and responsive design across mobile, tablet, and desktop viewports.

---

## 2. Tech Stack & Architecture

### Frontend Architecture
- **Framework:** React 19 + Vite 6
- **Styling:** Custom CSS design tokens + Tailwind CSS v4 (Universal pointer cursors)
- **Routing & State:** React Router v7 with URL search-parameter synchronization
- **Icons & Motion:** Lucide React, Motion (spring animations & count-up metrics)

### Backend Architecture
- **Framework:** Python 3.11+ / FastAPI (Asynchronous ASGI)
- **Layering:** Strict separation of concerns (Routes ➔ Services ➔ Repositories ➔ Models/Schemas)
- **ORM & Migrations:** SQLAlchemy 2.0 (typed declarative mapping) + Alembic migrations
- **Security:** PyJWT bearer authentication + passlib/bcrypt password hashing
- **HTTP Client:** `httpx` (connection pooling, timeouts, exponential backoff, jitter, and TTL cache)

### Database & Deployment
- **Databases:** SQLite (local zero-config default) / PostgreSQL 16 (production containerized)
- **DevOps:** Multi-stage Dockerfiles + `docker-compose.yml`

---

## 3. Project Directory Structure

```
.
├── backend/
│   ├── alembic/                 # Schema migration scripts
│   ├── app/
│   │   ├── core/                # Config, database engine, security & exceptions
│   │   ├── models/              # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/             # Pydantic v2 request/response schemas
│   │   ├── repositories/        # SQL data access & query execution
│   │   ├── services/            # Business logic & transaction boundaries
│   │   ├── routes/              # FastAPI HTTP endpoints
│   │   ├── utils/               # Resilient HTTP client & date utilities
│   │   ├── seed.py              # Backlog seed script
│   │   └── main.py              # FastAPI application factory
│   ├── requirements.txt         # Backend Python dependencies
│   └── Dockerfile               # Backend container definition
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI kit & custom SVG charts
│   │   │   ├── layout/          # AppLayout, Topbar, Sidebar
│   │   │   └── tasks/           # TaskCard, TaskFilters, TaskFormModal, CommentList
│   │   ├── context/             # AuthContext (JWT & user state)
│   │   ├── hooks/               # useAsync, useDebounce, useTheme, useCountUp
│   │   ├── pages/               # Dashboard, Tasks, Board, TaskDetail, Team, Directory
│   │   ├── services/            # API client layer
│   │   └── utils/               # Date formatters, constants, cn helper
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.js           # Vite build & dev-server proxy configuration
│
├── docker-compose.yml           # Multi-service stack (FastAPI + Postgres + Vite)
└── README.md
```

---

## 4. Setup Instructions

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- *(Optional)* **Docker & Docker Compose**

### Step-by-Step Local Setup

#### Terminal 1 — Backend Setup
```bash
cd backend

# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations & seed demo workspace
alembic upgrade head
python -m app.seed --reset

# 4. Start the API server
uvicorn app.main:app --reload --port 8000
```
> API running at **http://localhost:8000** · Swagger docs at **http://localhost:8000/docs**

---

#### Terminal 2 — Frontend Setup
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
> Frontend running at **http://localhost:5173**

---

### Alternative: Run with Docker Compose (PostgreSQL)

To run the entire containerized stack on **PostgreSQL**:
```bash
docker compose up --build
```
The backend container automatically runs migrations and seeds the database on startup.

---

## 5. Environment Variables

All settings have working defaults in `backend/app/core/config.py`. To customize:

### Backend Variables (`backend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `APP_NAME` | `Webvory` | Application brand name |
| `DEBUG` | `false` | Enable SQL query echo and verbose errors |
| `DATABASE_URL` | `sqlite:///./webvory.db` | Database connection string |
| `JWT_SECRET` | `webvory-insecure-dev-secret` | Secret key used to sign JWT access tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | `1440` | Token lifetime (24 hours) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend browser origins |
| `EXTERNAL_API_BASE_URL` | `https://jsonplaceholder.typicode.com` | Upstream provider for external staff directory |
| `EXTERNAL_API_TIMEOUT_SECONDS` | `8.0` | Socket read timeout |
| `EXTERNAL_API_MAX_RETRIES` | `3` | Maximum retry attempts on 5xx/429 errors |
| `EXTERNAL_API_CACHE_TTL_SECONDS` | `300` | In-memory cache lifetime (5 minutes) |
| `EXTERNAL_API_RATE_LIMIT_PER_MINUTE`| `30` | Client-side outbound rate limit |

### Frontend Variables (`frontend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base API route proxy URL |

---

## 6. Database Setup & Schema

```
┌─────────────────────────┐         ┌─────────────────────────────────┐         ┌─────────────────────────┐
│ users                   │         │ tasks                           │         │ comments                │
├─────────────────────────┤         ├─────────────────────────────────┤         ├─────────────────────────┤
│ id           INTEGER PK │◄───┐     │ id                  INTEGER PK  │◄───┐     │ id           INTEGER PK │
│ name         VARCHAR    │    │     │ title               VARCHAR     │    │     │ task_id      INTEGER FK │
│ email        VARCHAR UQ │    ├─────┤ assigned_to         INTEGER FK  │    ├─────┤ user_id      INTEGER FK │
│ role         ENUM       │    │     │ created_by          INTEGER FK  │    │     │ comment      TEXT       │
│ password_hash VARCHAR   │    │     │ description         TEXT        │    │     │ created_at   DATETIME   │
│ is_active    BOOLEAN    │    │     │ status              ENUM        │    │     └─────────────────────────┘
│ created_at   DATETIME   │    │     │ priority            ENUM        │    │
│ updated_at   DATETIME   │    │     │ due_date            DATETIME    │    │     ┌─────────────────────────┐
└─────────────────────────┘    │     │ created_at          DATETIME    │    │     │ activities              │
                               │     │ updated_at          DATETIME    │    │     ├─────────────────────────┤
                               │     └─────────────────────────────────┘    │     │ id           INTEGER PK │
                               │                                            ├─────┤ task_id      INTEGER FK │
                               └────────────────────────────────────────────┴─────┤ user_id      INTEGER FK │
                                                                                  │ action       ENUM       │
                                                                                  │ field        VARCHAR    │
                                                                                  │ old_value    TEXT       │
                                                                                  │ new_value    TEXT       │
                                                                                  │ created_at   DATETIME   │
                                                                                  └─────────────────────────┘
```

### Pre-Seeded Demo Accounts (Password: `password123`)

| Email | Name | Role | Permissions |
|---|---|---|---|
| `elena@webvory.com` | **Elena Vance** | **Admin** | Full system control: delete tasks/members, invite staff |
| `marcus@webvory.com` | **Marcus Sterling** | **Manager** | Task management, member invite, external import |
| `sofia@webvory.com` | **Sofia Morales** | **Manager** | Task management, member invite, external import |
| `kai@webvory.com` | **Kai Takahashi** | **Member** | Task CRUD, Kanban drag-and-drop, comments |
| `zara@webvory.com` | **Zara O'Connor** | **Member** | Task CRUD, Kanban drag-and-drop, comments |
| `liam@webvory.com` | **Liam Chen** | **Member** | Task CRUD, Kanban drag-and-drop, comments |
| `dante@webvory.com` | **Dante Rossi** | **Member** | Task CRUD, Kanban drag-and-drop, comments |

---

## 7. How to Run the Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

- API Base URL: **http://localhost:8000/api**
- Swagger Documentation: **http://localhost:8000/docs**
- ReDoc Documentation: **http://localhost:8000/redoc**
- Health Probe: **http://localhost:8000/health**

---

## 8. How to Run the Frontend

```bash
cd frontend
npm run dev
```

- Web Application: **http://localhost:5173**
- Linter: `npm run lint`
- Production Build: `npm run build`

---

## 9. API Documentation & cURL Samples

### Endpoints Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with credentials and receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch current authenticated user profile | Authenticated |
| `GET` | `/api/dashboard` | Aggregated executive KPIs, trends, and queues | Authenticated |
| `GET` | `/api/tasks` | List tasks with search, filters, sort, and pagination | Authenticated |
| `POST` | `/api/tasks` | Create a new deliverable task | Authenticated |
| `GET` | `/api/tasks/{id}` | Retrieve complete task details with relations | Authenticated |
| `PUT` | `/api/tasks/{id}` | Update task attributes (supports partial payloads) | Authenticated |
| `DELETE`| `/api/tasks/{id}` | Remove task and cascade associated records | Authenticated |
| `POST` | `/api/tasks/{id}/comments` | Post discussion note to task deliverable | Authenticated |
| `DELETE`| `/api/tasks/{id}/comments/{cid}` | Delete note (author-validated) | Author Only |
| `GET` | `/api/tasks/{id}/activity` | Fetch chronological audit history | Authenticated |
| `GET` | `/api/users` | List and search workspace team members | Authenticated |
| `POST` | `/api/users` | Invite / provision a new workspace member | Admin / Manager |
| `DELETE`| `/api/users/{id}` | Remove workspace member | **Admin Only** |
| `GET` | `/api/external/users` | Fetch cached 3rd-party staff directory | Authenticated |
| `POST` | `/api/external/users/import` | Batch import staff into workspace | Admin / Manager |

---

### Command-Line cURL Demonstration

#### 1. Authenticate & Extract Token
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"elena@webvory.com","password":"password123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Bearer Token: $TOKEN"
```

#### 2. Query Tasks with Filters and Severity Sort
```bash
curl -s "http://localhost:8000/api/tasks?status=in_progress&priority=urgent&sort_by=due_date&sort_order=asc" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

#### 3. Create a Deliverable Task
```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy Distributed Redis Cache Cluster",
    "description": "Establish multi-node cache cluster with automated failover.",
    "status": "in_progress",
    "priority": "high",
    "due_date": "2026-09-15T18:00:00Z",
    "assigned_to": 1
  }' | python3 -m json.tool
```

---

## 10. Bonus Features Implemented

1. **Interactive Kanban Board:** Drag-and-drop status board with instant optimistic client updates.
2. **Task Discussion Thread:** Markdown-ready comment feed with author-validated deletion.
3. **Automated Activity Audit Trail:** Immutable historical changelog recording status, priority, assignee, and due date mutations.
4. **Persistent Dark/Light Mode:** System and manual theme syncing with `useSyncExternalStore` and zero layout flashing.
5. **Debounced Real-Time Search:** 350ms search debounce synchronized with browser URL parameters.
6. **Production Resilient API Client:** Token bucket rate limiter, exponential backoff with jitter, and TTL cache.
7. **Server-Enforced RBAC:** Three distinct authorization tiers (`Admin`, `Manager`, `Member`) verified in backend dependencies.
8. **Confirmation Protection Dialogs:** Destructive action confirmation gates across all record deletions.
9. **Animated Metric Count-Ups:** Dynamic spring number animations on dashboard load.
10. **Docker Containerization:** Complete multi-service `docker-compose.yml` for PostgreSQL and FastAPI.

---

## 11. Any Assumptions Made

1. **Database Flexibility:** SQLite is the default for instant zero-dependency local execution. PostgreSQL is fully supported via `DATABASE_URL` and `docker-compose.yml` using the same Alembic migration files.
2. **Overdue Definition:** A task is considered overdue if its `due_date` is strictly in the past and its status is **not** `completed` (even if blocked).
3. **Data Preservation on User Deletion:** Deleting a user sets `assigned_to = NULL` on their assigned tasks. Work items remain intact as unassigned deliverables to prevent accidental company data loss.
4. **Audit History Immutability:** Task activities are insert-only audit entries. When a user is removed, `user_id` on historical activity rows is set to `NULL` to preserve permanent audit integrity.
5. **Comment Permissions:** Comments and discussion notes can only be deleted by their original author, enforced with server-side HTTP 403 authorization checks.
6. **Task Update Method:** The assignment specification mentions `PUT /api/tasks/{id}`; the endpoint is implemented to support partial field updates for convenience.
7. **External API Resilience:** External staff directory requests are routed through a resilient async client with an in-memory 5-minute cache and client-side token bucket rate-limiting (30 req/min) to prevent upstream quota exhaustion.
8. **Role-Based Access Control (RBAC):** Everyday task creation and editing are available to all authenticated members, while team member provisioning is reserved for Managers/Admins and user deletion is restricted to Admins.
