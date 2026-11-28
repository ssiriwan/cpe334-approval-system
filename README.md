# CPE 334 — Workflow and Approval System

> **Group Project Deliverable 2 — Sprint 2 complete + Sprint 3 progress**  
> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Theme:** Theme 5 — Workflow and Approval System (Corporate Expense & Purchase Requests)  
> **Authors:**
> - Oum (`67070501075`) — Requester Slice & Baseline Specifications (Parts A & B)
> - T (`67070501021`) — Reviewer Slice & System SDS (Parts C & D)

---

## 1. Prerequisites

- **Node.js:** `>= 20.x`
- **npm:** `>= 10.x`
- **PostgreSQL:** `>= 17.x` (local instance or Docker container on host port `5434`)

---

## 2. Quickstart & Local Setup

### 2.1 Clone Repository
```bash
git clone https://github.com/ssiriwan/cpe334-approval-system.git
cd cpe334-approval-system
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL instance (default port: `5434`):
```env
DATABASE_URL="postgresql://approval_user:approval_pass@localhost:5434/approval_db?schema=public"
JWT_SECRET="development_jwt_secret_change_in_production_min32chars"
PORT=3000
NODE_ENV="development"
CLIENT_ORIGIN="http://localhost:5173"
COOKIE_SECURE="false"

# Attachment storage (names only — no real secret or absolute path is committed)
UPLOAD_DIR="uploads"
MAX_ATTACHMENT_MB="5"
```

The complete list of variables and their defaults is in `.env.example`. Environment
values are read through `server/src/config.ts`; never commit a real secret.

### 2.4 Database Migration & Seed
Run Prisma migrations and populate seed accounts:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Two migrations are applied in order: `20261110084745_init_schema` (Sprint 1)
and `20261127183708_sprint2_lifecycle_and_attachments` (CR-05: `RETURNED`,
`PENDING_STAGE2`, `stage`, `Attachment`). For released/production environments
use `npx prisma migrate deploy --schema prisma/schema.prisma`, then verify with
`npx prisma migrate status`. Details and the rollback note are in
`docs/sprints/sprint-2/migration-note.md`.

### 2.5 Seed Accounts (Local Testing Only)
All demo accounts use password: `Password123!`

| Email | Role | Purpose / Scope |
| :--- | :---: | :--- |
| `oum.requester@cpe334.local` | `REQUESTER` | Create and track requests |
| `t.reviewer@cpe334.local` | `REVIEWER` | Review assigned requests (`EQUIPMENT`, `TRAVEL`) |
| `manager.hybrid@cpe334.local` | `REVIEWER` | Review requests (`SOFTWARE`, `SUPPLIES`); CR-04 escalation for > 5,000 THB / out-of-hours; test BR-01 |
| `finance.reviewer@cpe334.local` | `REVIEWER` | Distinct stage-2 reviewer for F-07 multi-stage approval (added in Sprint 2) |

---

## 3. Running the Application

### Development Mode (Concurrent)
Run both frontend and backend dev servers:
```bash
# Terminal 1: Backend API (Express on port 3000)
npm run dev:server

# Terminal 2: Frontend Client (Vite on port 5173)
npm run dev:client
```
Access the application at `http://localhost:5173`.  
Backend healthcheck is available at `http://localhost:3000/api/health`.

---

### 3.1 Sprint 2 / Sprint 3 endpoints

All endpoints use the standard `{ data }` / `{ error: { code, message, details? } }`
envelope and require the HTTP-only `token` cookie unless stated otherwise.
Role/ownership is always enforced by the backend, not only by the UI.

| Method | Path | Purpose |
| :---: | :--- | :--- |
| GET | `/api/requests/:id/history` | Read-only audit trail (F-05) |
| POST | `/api/requests/:id/return` | Reviewer returns a `PENDING` request with a 3–500 char reason (F-06) |
| POST | `/api/requests/:id/resubmit` | Owner edits and resubmits a `RETURNED` request (F-06) |
| POST | `/api/requests/:id/attachments` | Multipart upload, field `file`, PDF/PNG/JPEG ≤ 5 MB (F-08) |
| GET | `/api/requests/:id/attachments` | Attachment metadata — never exposes the disk path |
| GET | `/api/attachments/:id` | Authorized file download; rights re-checked at request time |
| GET | `/api/requests/my`, `/api/requests/pending` | Optional `status`, `category`, `from`, `to` filters plus `count` (F-09) |

High-value requests (`amount > 5000.00` THB) use two approval stages: stage 1
approve moves to `PENDING_STAGE2`, stage 2 approve finalises to `APPROVED`.
A request that is already decided cannot be decided again; self-approval is
blocked with `403 SELF_APPROVAL_NOT_ALLOWED` at every stage.

---

## 4. Testing & Verification

Run automated test suites across all workspaces:
```bash
# Run unit & API integration tests
npm test

# Run client tests only
npm run test:client

# Run server tests only
npm run test:server

# Run Playwright E2E journeys
npm run e2e
```

> **Note:** Server API tests are integration tests against the real PostgreSQL
> database configured by `DATABASE_URL`. Make sure PostgreSQL is running and the
> migration/seed steps in section 2.4 have been applied before running them. The
> auth tests create and remove their own `@cpe334.local` test users. Attachment
> tests write synthetic files under `UPLOAD_DIR` (gitignored) and clean them up.

On the Deliverable 2 candidate the expected result is **14 test files / 75 tests
passed** (Sprint 1, CR-04, F-05..F-09 suites) with a clean `npm run build`.
Test files: `auth`, `health`, `requests`, `review`, `history`,
`return-resubmit`, `multistage`, `attachments`, `search-filter` (server) plus the
client page/component suites. AC-to-test mapping is in `docs/traceability.md`.

### Build Verification
```bash
npm run build
```

---

## 5. Docker and CI/CD (Lab 5)

The application is packaged as one container that serves both the built React
client and the Express API. Every setting is read from the environment.

### 5.1 Run the full stack locally

```bash
cp .env.example .env
docker compose up --build

# Optional: create the three demo accounts
docker compose --profile seed run --rm seed
```

Open `http://localhost:3000`. The health endpoint is
`http://localhost:3000/api/health` and reports the running commit through the
`commit` field.

### 5.2 Image commands

```bash
npm run docker:build   # build approval-system:local
npm run docker:up      # build and start db + migrate + app
npm run docker:down    # stop the stack
npm run docker:seed    # run the one-off seed job
```

### 5.3 Database migrations inside Docker

The compose `migrate` service runs `prisma migrate deploy` as a one-off job that
must finish before the application container starts. The same image is used in
CI and in the Cloud Run migration job, so schema changes follow one path in every
environment.

### 5.4 Pipelines

| Workflow | Trigger | What it does |
| :--- | :--- | :--- |
| `.github/workflows/ci-docker.yml` | Pull request or push to `lab5-staging` / `sprint-1-staging` / `sprint-2-staging` / `main` | Starts PostgreSQL, runs `prisma migrate deploy`, `npm test`, `npm run build`, builds the Docker image, and smoke-tests the running container. |
| `.github/workflows/deploy.yml` | Push to `main` or manual dispatch | Builds and pushes an image tagged with the commit SHA, runs migrations as a Cloud Run job, deploys the image by digest, and verifies `/api/health` reports the release commit. |

`CI quality gate` is the required status check configured for `main`.

See `docs/labs/lab-05/deployment.md` for the complete environment variable table,
GCP resources, release procedure, rollback, and evidence mapping.

---

## 6. Branching & Git Workflow Rules

1. **Base Branch:** Sprint 1 work used `sprint-1-staging`; Sprint 2/3 work branches from and targets `sprint-2-staging`.
2. **Never commit directly** to `main` or either staging branch.
3. **Branch Naming:** `feature/<issue-no>-<slug>` or `chore/<issue-no>-<slug>`.
4. **Peer Review:** Every PR into a staging branch must be substantively reviewed and approved by the teammate. **Authors never self-approve or self-merge.**
5. **Release PR:** Once tests pass on staging, open a release PR to `main`, tag the release (`v0.1.0-sprint1` for Sprint 1; `v0.2.0-sprint2` for this candidate). `deploy.yml` deploys automatically on push to `main`.

---

## 7. Project Documentation & Artifacts

- **Authoritative Plan & Rules:** `AGENTS.md` / `MASTER_PLAN.md`
- **Peer Review Audit Log:** `docs/reviewer.md`
- **Sprint 1 Contracts & Specs:** `docs/sprints/sprint-1/`
- **Lab 5 Deployment Guide:** `docs/labs/lab-05/deployment.md`
- **Sprint 2 contracts & evidence:** `docs/sprints/sprint-2/`
- **Sprint 3 contracts & progress:** `docs/sprints/sprint-3/`
- **Current traceability matrix:** `docs/traceability.md` (v1.1)
- **Deliverable 2 evidence:** `docs/deliverable-2/evidence/`
- **Migration note:** `docs/sprints/sprint-2/migration-note.md`
