# CPE 334 — Workflow and Approval System

> **Group Project Deliverable 1 (Sprint 1)**  
> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Theme:** Theme 5 — Workflow and Approval System (Corporate Expense & Purchase Requests)  
> **Authors:**
> - Oum (`67070501075`) — Requester Slice & Baseline Specifications (Parts A & B)
> - T (`67070501021`) — Reviewer Slice & System SDS (Parts C & D)

---

## 1. Prerequisites

- **Node.js:** `>= 20.x`
- **npm:** `>= 10.x`
- **PostgreSQL:** `>= 16.x` (Running locally or in Docker container on host port `5434`)

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
```

### 2.4 Database Migration & Seed
Run Prisma migrations and populate seed accounts:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 2.5 Seed Accounts (Local Testing Only)
All demo accounts use password: `Password123!`

| Email | Role | Purpose / Scope |
| :--- | :---: | :--- |
| `oum.requester@cpe334.local` | `REQUESTER` | Create and track requests |
| `t.reviewer@cpe334.local` | `REVIEWER` | Review assigned requests (`EQUIPMENT`, `TRAVEL`) |
| `manager.hybrid@cpe334.local` | `REVIEWER` | Review requests (`SOFTWARE`, `SUPPLIES`) & test BR-01 No Self-Approval |

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

### Build Verification
```bash
npm run build
```

---

## 5. Branching & Git Workflow Rules

1. **Base Branch:** All feature work branches from and targets `sprint-1-staging`.
2. **Never commit directly** to `main` or `sprint-1-staging`.
3. **Branch Naming:** `feature/<issue-no>-<slug>` or `chore/<issue-no>-<slug>`.
4. **Peer Review:** Every Pull Request into `sprint-1-staging` must be reviewed and approved by the teammate. **Authors never self-approve.**
5. **Release PR:** Once all features and tests pass on `sprint-1-staging`, open a release PR to `main` and tag `v0.1.0-sprint1`.

---

## 6. Project Documentation & Artifacts

- **Authoritative Plan & Rules:** `AGENTS.md` / `MASTER_PLAN.md`
- **Peer Review Audit Log:** `docs/reviewer.md`
- **Sprint 1 Contracts & Specs:** `docs/sprints/sprint-1/`
