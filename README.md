
# ntu-cloudnative-pms

> A cloud-native Performance Management System for managing employee performance evaluations — built for NTU Spring 2026 Cloud Native Development and Best Practice (IM5072 / CSIE5217).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Modules](#modules)
- [Non-Functional Requirements](#non-functional-requirements)
- [Team](#team)

---

## Overview

The Performance Management System (PMS) supports the full lifecycle of employee performance evaluations. It covers template creation by HR, goal drafting and submission by employees, manager reviews, and HR finalization — all with role-based access control, immutable audit logging, and a scalable cloud-native architecture.

---

## Features

| Module | Description |
|---|---|
| **Login** | JWT stored in `HttpOnly; SameSite=Lax` cookie to prevent XSS token theft; CSRF token issued on login and validated on every state-changing request |
| **Registration** | Admin-managed user account creation |
| **Template** | HR creates evaluation templates per job type and evaluation cycle |
| **Evaluation** | Full lifecycle: goal drafting → approval → progress → review → closure |
| **Access Control** | Role-based access enforcement via `@PreAuthorize`; HTTP 403 on violation |
| **Audit Log** | Immutable, append-only, tamper-proof audit trail for all CUD operations |
| **Notification** *(optional)* | Real-time status-change notifications via Server-Sent Events (SSE) |

---

## Tech Stack

**Frontend**
- React (Single Page Application)
- Axios HTTP client

**Backend**
- Java / Spring Boot
- Spring Data JPA
- Spring Security with JWT for authentication
- Spring Security with `@PreAuthorize` for role-based access control
- Hibernate Envers for audit log

**Database**
- MySQL

**Infrastructure**
- Docker / Kubernetes (Stage 3)
- Nginx load balancer (Stage 2+)
- Redis cache (Stage 2+)
- CDN for static assets (Stage 3)

---

## System Architecture

The system is designed across three growth stages:

### Stage 1 — Prototyping (1,000 DAU)

```
Browser → React SPA → REST API → Spring Boot → MySQL
```

- Single server (~2 GB RAM)
- ~0.2 QPS average load
- Simple to deploy and debug

### Stage 2 — Growth (20,000 DAU)

```
Browser → React SPA → Nginx (Load Balancer) → Spring Boot × 2 → Redis Cache → MySQL
```

- ~10 QPS average / 30 QPS peak
- Redis caches frequently accessed goals and progress
- Redundant Nginx instances to eliminate single point of failure

### Stage 3 — Full Expansion (100,000 DAU)

```
Browser → CDN (React SPA) → Kubernetes Ingress → Spring Boot Pods (5–10 replicas)
                                                → Redis Cache
                                                → MySQL Master + Read Replica
```

- ~100 QPS average / 500 QPS peak
- Horizontal Pod Autoscaling (HPA)
- Database read replica for read-heavy traffic
- Infrastructure as Code + Observability for cluster management

---

## Getting Started

> Prerequisites: Java 25 (eclipse-temurin:25-jdk-alpine), Node.js 24, Docker, MySQL

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/ntu-cloudnative-pms.git
cd ntu-cloudnative-pms
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. (Optional) Run with Docker Compose

```bash
docker compose up --build
```

---

## Modules

### Evaluation Lifecycle

An evaluation transitions through the following statuses:

```
INITIAL → PENDING_GOAL_APPROVAL → WORKING → REVIEW → PENDING_CLOSURE → CLOSED
```

| Status | Description |
|---|---|
| `INITIAL` | Employee drafts goals |
| `PENDING_GOAL_APPROVAL` | Goals submitted, awaiting manager approval |
| `WORKING` | Goals approved; employee updates progress |
| `REVIEW` | Employee submits progress; manager writes feedback and rating |
| `PENDING_CLOSURE` | Review submitted; awaiting HR finalization |
| `CLOSED` | Evaluation finalized by HR |

### Roles

| Role | Key Permissions |
|---|---|
| `ADMIN` | Register users, view audit logs |
| `HR` | Create templates and evaluations, finalize reviews |
| `MANAGER` | Approve/reject goals, draft and submit reviews |
| `EMPLOYEE` | Draft goals, update progress |

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| API response time (p95) | < 200 ms |
| Authorization check latency (p95) | < 50 ms |
| Uptime SLA | 99.9% |
| Concurrency control | Optimistic Concurrency Control (OCC) |
| Data encryption at rest | AES-256 |
| Audit log writes | Atomic with originating operation; append-only |
| Least privilege | No role inherits higher-privilege permissions by default |

---

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
