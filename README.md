# ntu-cloudnative-pms

> A Performance Management System for managing employee performance evaluations — built for NTU x TSMC Spring 2026 Cloud Native Development and Best Practice (IM5072 / CSIE5217).

**Live demo:** https://pms-frontend-production-f2a8.up.railway.app

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [API Contract & Code Generation](#api-contract--code-generation)
- [CI / CD](#ci--cd)
- [Modules](#modules)
- [Non-Functional Requirements](#non-functional-requirements)
- [Team](#team)

---

## Overview

The Performance Management System (PMS) supports the full lifecycle of employee performance evaluations. It covers template creation by HR, goal drafting and submission by employees, manager reviews, and HR finalization — all with role-based access control, immutable audit logging, and a containerized cloud-native deployment.

---

## Features

| Module | Description |
|---|---|
| **Login** | JWT stored in `HttpOnly; SameSite=Lax; Secure` cookie. CSRF protection via `SameSite=Lax` + CORS allow-list (no separate CSRF token needed). |
| **Registration** | Admin-managed user account creation, including probation flow that auto-generates a probation evaluation. |
| **Template** | HR creates / updates evaluation templates per job and evaluation type. |
| **Evaluation** | Full 7-state lifecycle: goal drafting → manager approval → progress updates → manager review → employee confirmation → HR closure. |
| **Access Control** | Role-based enforcement via `@PreAuthorize` at the controller layer for ADMIN / HR / MANAGER endpoints; employee actions are authorized in the service layer (`EvaluationAuthorizationService`). HTTP 403 on violation. |
| **Audit Log** | Immutable, append-only audit trail via Hibernate Envers. A custom `REVINFO` table records `username` (from `SecurityContextHolder`) and `ipAddress` (from `X-Forwarded-For` / `RemoteAddr`) per revision. `User.passwordHash` is marked `@NotAudited` so passwords never enter the audit history. |

---

## Tech Stack

**Frontend**
- React 18 (SPA) with Vite + TypeScript
- shadcn/ui components on Tailwind CSS
- Native `fetch` with `credentials: 'include'`
- Orval — auto-generates TypeScript API client from the OpenAPI spec
- nginx (Alpine) serves the built static files in production; `envsubst` injects `VITE_API_URL` into `/config.js` at container startup

**Backend**
- Java 25 / Spring Boot 4.0.5
- Spring Data JPA + Hibernate ORM
- Spring Security with JWT for authentication
- Method-level role-based access control via `@PreAuthorize`
- Hibernate Envers (via `spring-data-envers`) for audit logging
- springdoc-openapi to expose `/v3/api-docs.yaml`
- MapStruct for DTO ↔ entity mapping

**Database**
- MySQL 8

**Infrastructure (current — Stage 1)**
- Docker (multi-stage builds; non-root user; JRE-only runtime)
- GitHub Container Registry (GHCR) for image storage
- Railway PaaS for hosting
- GitHub Actions for CI / CD

**Planned (Stage 2 / 3)**
- Nginx load balancer + horizontal scaling (Stage 2)
- Redis cache (Stage 2)
- Kubernetes orchestration (Stage 3)
- CDN for static assets (Stage 3)

---

## System Architecture

### Current deployment (Stage 1)

```
Browser → nginx (frontend container, serves React SPA)
           │
           └─► Spring Boot (backend container)
                 │
                 └─► MySQL 8

         ┌────────── Railway PaaS ──────────┐
         │  Images pulled from GHCR         │
         │  Config injected via env vars    │
         └──────────────────────────────────┘
```

- Frontend image: nginx serving static React build; `VITE_API_URL` resolved at container startup via `envsubst` into `/config.js`, so the same image runs in any environment.
- Backend image: JRE-only Alpine, non-root user; activated profile (`SPRING_PROFILES_ACTIVE=prod` in production) merges `application-prod.yaml` on top of `application.yaml`.
- Production profile tightens `ddl-auto=validate`, disables Swagger UI, and enforces `cookie.secure=true`.

### Growth roadmap (designed but not yet implemented)

#### Stage 2 — Growth (20,000 DAU)

```
Browser → React SPA → Nginx (Load Balancer) → Spring Boot × 2 → Redis Cache → MySQL
```

- ~10 QPS average / 30 QPS peak
- Redis caches frequently accessed goals and progress
- Redundant Nginx instances to eliminate single point of failure

#### Stage 3 — Full Expansion (100,000 DAU)

```
Browser → CDN (React SPA) → Kubernetes Ingress → Spring Boot Pods (5–10 replicas)
                                                → Redis Cache
                                                → MySQL Master + Read Replica
```

- ~100 QPS average / 500 QPS peak
- Horizontal Pod Autoscaling (HPA)
- Database read replica for read-heavy traffic
- Infrastructure as Code + observability for cluster management

---

## Getting Started

> Prerequisites: Docker Desktop, VS Code with the Dev Containers extension. Java 25 and Node.js 24 are installed inside the dev container.

### Recommended — VS Code Dev Container

1. Clone the repository.
2. Copy the env sample:
   ```bash
   cp .devcontainer/.env.sample .devcontainer/.env
   ```
   The defaults work for local development.
3. Open the folder in VS Code → **Reopen in Container** (or run `Dev Containers: Reopen in Container` from the Command Palette).
4. Once the container is up, open two terminals:

   **Backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install   # first run only
   npm run dev
   ```
5. Visit `http://localhost:5173` and log in with one of the seeded accounts:

   | Username | Password | Role |
   |---|---|---|
   | `admin` | `admin123` | ADMIN |
   | `seniorhr` | `seniorhr123` | HR |
   | `juniorhr` | `juniorhr123` | HR |
   | `manager` | `manager123` | MANAGER |
   | `employee` | `employee123` | EMPLOYEE |

   `DataSeeder` runs on first startup against a fresh database and is idempotent.

### Manual setup (without the dev container)

Install Java 25, Node 24, and a local MySQL 8. Set the env vars from `.devcontainer/.env.sample` in your shell, then run the backend and frontend commands above.

### Swagger UI

While the backend is running, browse `http://localhost:8080/api/swagger-ui/index.html` to explore and exercise the API. Swagger UI is disabled in the production profile.

---

## API Contract & Code Generation

The project follows a **code-first OpenAPI** workflow:

1. Backend controllers + DTOs are annotated for springdoc, which serves `/v3/api-docs.yaml`.
2. A scheduled CI job (`ci-openapi-sync.yml`) starts the backend, downloads the spec, and commits any changes back to `docs/api/openapi.yaml` on `main`.
3. Frontend uses **Orval** to regenerate `src/api/generated/orvalClient.ts` (URLs + TypeScript types) from that yaml, so the typed client always matches the running backend.
4. `ci-openapi.yml` runs `@redocly/cli lint` on any change to `docs/api/**`.

This eliminates spec drift without forcing the team to hand-author the contract.

---

## CI / CD

Four GitHub Actions workflows guard `main` and trigger deployments:

| Workflow | Triggers | What it does |
|---|---|---|
| `ci-cd-backend.yml` | `backend/**` push / PR | Unit tests + integration tests + Docker build (3 jobs in parallel); on `main`, pushes the image to GHCR and triggers `railway redeploy` for the backend service |
| `ci-cd-frontend.yml` | `frontend/**` push / PR | Lint, type-check, vitest, build + Docker build; on `main`, pushes the image to GHCR and triggers `railway redeploy` for the frontend service |
| `ci-openapi.yml` | `docs/api/**` push / PR | Redocly lint of `openapi.yaml` |
| `ci-openapi-sync.yml` | `backend/**` push to `main` | Boots the backend, scrapes `/v3/api-docs.yaml`, commits diff back to `main` |

All workflows use `concurrency: cancel-in-progress: true` so superseded runs are cancelled. Backend tests are split into **unit** (`@Tag` excluded) and **integration** (`@Tag("integration")`) jobs — integration tests use an H2 in-memory database. Pushed images are tagged `sha-<commit>` and `latest`, and the GHCR action prunes everything older than the most recent 10 versions.

---

## Modules

### Evaluation Lifecycle

An evaluation transitions through the following 7 statuses:

```
INITIAL
  → PENDING_GOAL_APPROVAL
  → WORKING
  → REVIEW
  → PENDING_REVIEW_CONFIRMATION
  → PENDING_CLOSURE
  → CLOSED
```

| Status | Description |
|---|---|
| `INITIAL` | Employee drafts goals |
| `PENDING_GOAL_APPROVAL` | Goals submitted, awaiting manager approval |
| `WORKING` | Goals approved; employee updates progress |
| `REVIEW` | Employee submits progress; manager drafts feedback and rating |
| `PENDING_REVIEW_CONFIRMATION` | Manager submitted review; awaiting employee confirmation |
| `PENDING_CLOSURE` | Employee confirmed review; awaiting HR finalization |
| `CLOSED` | Evaluation finalized by HR; employee / supervisor / HR identity snapshotted onto the evaluation row |

Each transition is guarded by `EvaluationStatus.assertCanTransitionTo(...)` so illegal jumps throw `IllegalStateException`.

### Roles

| Role | Key Permissions |
|---|---|
| `ADMIN` | Register users, start evaluation cycles, view audit logs |
| `HR` | Create / update templates, finalize evaluations (approve / reject) |
| `MANAGER` | Approve / reject goals, draft and submit reviews |
| `EMPLOYEE` | Draft goals, update progress, confirm review result |

Department and Job CRUD endpoints are shared between `ADMIN` and `HR`.

---

## Non-Functional Requirements

| Requirement | Status |
|---|---|
| Stateless authentication | JWT in `HttpOnly; SameSite=Lax; Secure` cookie |
| Method-level RBAC | `@PreAuthorize` (controller) + service-layer checks for employee actions |
| Audit log writes | Atomic with the originating transaction (Hibernate Envers); append-only via `REVTYPE` (`0` = INSERT, `1` = UPDATE, `2` = DELETE); `User.passwordHash` excluded |
| Schema safety in production | `application-prod.yaml` sets `ddl-auto=validate` — startup fails fast on schema drift |

---

---
## Test
### Load Test
- `BASE_URL=https://pms-frontend-production-f2a8.up.railway.app PMS_USER=xxx PMS_PASS=xxx k6 run loadtest/load-test.js`
---

## Demo 
- HR
           <img width="1306" height="736" alt="image" src="https://github.com/user-attachments/assets/01fac295-493b-4149-bb79-0aca883ac126" />
           <img width="1297" height="453" alt="image" src="https://github.com/user-attachments/assets/ab382396-e4a4-4875-912d-968cd6bf0456" />
           <img width="1284" height="751" alt="image" src="https://github.com/user-attachments/assets/d73c8310-1772-44fd-81b5-37929dddc303" />


- Employee
           <img width="1209" height="560" alt="image" src="https://github.com/user-attachments/assets/84d88221-d525-4ac4-ba07-064911ac4828" />

- Manager
           <img width="1286" height="420" alt="image" src="https://github.com/user-attachments/assets/06e62c8a-1fe6-4135-801d-0617e388a929" />

- Admin
           <img width="1273" height="741" alt="image" src="https://github.com/user-attachments/assets/409af6ae-3175-4c47-b8c3-8cbf6f30b8b1" />
           <img width="1279" height="738" alt="image" src="https://github.com/user-attachments/assets/a3b8cdbc-e349-40d4-9c2e-4f745aad1a62" />
           <img width="1288" height="742" alt="image" src="https://github.com/user-attachments/assets/883b872b-8e0a-4b63-8c17-6c1eafa18ab1" />
           <img width="1194" height="742" alt="image" src="https://github.com/user-attachments/assets/c7793660-ec2a-4a09-b620-b9d4b6739e4d" />

## Team

Group 1 — National Taiwan University, Spring 2026

| Name |
|---|
| 吳政霖 |
| 吳鎮星 |
| 郭又綸 |
| 楊宗勳 |
| 蔣馥安 |

---

## License

This project is developed for academic purposes as part of NTU IM5072 / CSIE5217.
