# System-Level Software Design Specification (SDS)

> **Project:** CPE 334 - Workflow and Approval System (Theme 5)
> **Deliverable:** Deliverable 1 / Sprint 1
> **Owner:** T (67070501021)
> **Reviewer:** Oum (67070501075)
> **Related issue:** #2 - System-Level SDS and Three-Sprint Plan
> **Status:** v1.0 baseline, reviewed before Sprint 1 feature implementation

---

## 1. Purpose and Scope

This document defines the system-level design for the Corporate Expense and Purchase Request approval system. It describes the architecture, data model, role and permission rules, UI structure, API conventions, authentication lifecycle, configuration, deployment approach, and security expectations.

Sprint 1 implements a working vertical slice:

- authentication and session handling;
- request creation;
- requester-owned request tracking;
- reviewer assignment and review decisions;
- append-only approval history;
- backend enforcement of self-approval, state, validation, and access-control rules.

The design is intentionally a modular monolith. It does not use microservices, message queues, external caches, real payment integrations, or external notification services in Sprint 1.

---

## 2. Architecture and Technology Stack

```text
React 19 + Vite + TypeScript + Tailwind CSS (client)
        |
        | HTTPS / JSON, httpOnly JWT cookie
        v
Node.js + Express + TypeScript (API and application layer)
        |
        | Prisma ORM
        v
PostgreSQL 17 (persistent database)
```

### 2.1 Component responsibilities

| Component | Responsibility |
| :--- | :--- |
| Client (`client/`) | Render role-aware screens, collect input, mirror validation feedback, call REST APIs, display loading/empty/error states. UI hiding is not an authorization mechanism. |
| Server (`server/`) | Authenticate requests, enforce roles and business rules, validate payloads, manage request lifecycle, write history, return standardized API responses. |
| Prisma | Type-safe database access, migrations, seed support, relationship loading, transaction support. |
| PostgreSQL | Durable storage for users, approval requests, and approval history. |

### 2.2 Architecture decisions

- Business rules live in server controllers/services, never only in the client.
- Client and server run as separate development servers.
- Production builds the client into static assets and runs the server as a container; the client calls the server over HTTP.
- No microservices and no external queue/cache are required for Sprint 1.
- All secrets are supplied through environment variables; no secret is committed or baked into an image.

---

## 3. Data Model, Constraints, and Persistence

### 3.1 Entities

| Entity | Purpose |
| :--- | :--- |
| `User` | Authenticated actor with role `REQUESTER`, `REVIEWER`, or future `ADMIN`. |
| `ApprovalRequest` | Expense/purchase request owned by a requester and assigned to a reviewer. |
| `ApprovalHistory` | Append-only audit record for submission, approval, or rejection. |

### 3.2 Relationships and ownership

- `ApprovalRequest.requesterId -> User.id`: the user who created the request.
- `ApprovalRequest.assignedReviewerId -> User.id`: the reviewer allowed to decide the request.
- `ApprovalHistory.actorId -> User.id`: the user who performed the action.
- `ApprovalHistory.requestId -> ApprovalRequest.id` with cascade delete from request to history.

### 3.3 Constraints

| Area | Constraint |
| :--- | :--- |
| User identity | `User.email` is unique. `passwordHash` stores a bcrypt hash, never plaintext. |
| Request identity | `ApprovalRequest.requestNo` is unique, formatted as `REQ-YYYYMMDD-NNNN`. |
| Amount | Stored as `Decimal(12,2)`; service validation requires `amount > 0` and `amount <= 9,999,999,999.99`. |
| Title | Trimmed length must be 3-150 characters. |
| Category | Must be one of `EQUIPMENT`, `TRAVEL`, `SOFTWARE`, `SUPPLIES`. |
| Description | Required, non-empty, maximum 1,000 characters. |
| Status | Starts at `PENDING`; valid transitions are only `PENDING -> APPROVED` or `PENDING -> REJECTED`. |
| Reviewer assignment | `assignedReviewerId` is nullable at database level for migration safety, but the service must set it when creating a request. |
| History | Append-only. No update/delete endpoint is exposed in Sprint 1. Status update and history insert must share one transaction. |
| Decision | `decision` must be `APPROVE` or `REJECT`; `REJECT` requires a 3-500 character comment; `APPROVE` comment is optional and at most 500 characters. |

### 3.4 Indexes

- `(requesterId, createdAt)` for "My Requests" ordering.
- `(assignedReviewerId, status)` for the reviewer's pending queue.
- `(status, createdAt)` for status-based views and future reporting.
- `(requestId, createdAt)` for request history retrieval.

### 3.5 Migrations and seed data

- Local development: `npx prisma migrate dev`.
- Released/production environments: `npx prisma migrate deploy`.
- Seed: `prisma/seed.ts` uses idempotent upserts for three synthetic demo accounts.
- Demo requests are created through the UI/API; financial records are not hard-coded in the seed.
- Durability: PostgreSQL volume or Cloud SQL; data and history must survive process restart and redeploy.

### 3.6 Demo accounts

| Email | Role | Purpose |
| :--- | :--- | :--- |
| `oum.requester@cpe334.local` | `REQUESTER` | Requester flows. |
| `t.reviewer@cpe334.local` | `REVIEWER` | Reviewer for `EQUIPMENT` and `TRAVEL`. |
| `manager.hybrid@cpe334.local` | `REVIEWER` | Reviewer for `SOFTWARE` and `SUPPLIES`; self-approval test account. |

All demo accounts use a synthetic local password documented in the README. No production credentials are used.

---

## 4. Roles and Permission Matrix

### 4.1 Principles

- Every protected endpoint checks authentication on the backend.
- Authorization checks role, ownership, assignment, and state in the required order.
- Hiding a button is not authorization; the API must return the correct `401`/`403`/`400` error.
- `REVIEWER` may create requests in Sprint 1 so that BR-01 no-self-approval can be tested with a real reviewer-owned request.
- `ADMIN` is present in the enum for future work only; it is not seeded and has no Sprint 1 endpoint.

### 4.2 Endpoint permission matrix

| Endpoint | Method | Allowed roles | Access rule | Failure behavior |
| :--- | :---: | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | Validate email/password, issue JWT cookie. | `400 VALIDATION_ERROR`; `401 UNAUTHORIZED` |
| `/api/auth/logout` | POST | Any authenticated user | Clear the `token` cookie. | `401 UNAUTHORIZED` |
| `/api/auth/me` | GET | Any authenticated user | Return current user without `passwordHash`. | `401 UNAUTHORIZED` |
| `/api/requests` | POST | `REQUESTER`, `REVIEWER` | Create request, generate `requestNo`, assign reviewer by category. | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR` |
| `/api/requests/my` | GET | Any authenticated user | Return only `requesterId = currentUser.id`, newest first. | `401 UNAUTHORIZED` |
| `/api/requests/:id` | GET | Owner or assigned reviewer | Requester sees own request; reviewer sees only assigned request. | `401 UNAUTHORIZED`; `403 ACCESS_DENIED`; `404 NOT_FOUND` |
| `/api/requests/pending` | GET | `REVIEWER` | Return only `assignedReviewerId = currentUser.id` and `status = PENDING`. | `401 UNAUTHORIZED`; `403 FORBIDDEN` |
| `/api/requests/:id/review` | POST | `REVIEWER` | Must not be owner; must be assigned reviewer; request must be `PENDING`; decision must be valid. | `401`; `403 FORBIDDEN`; `403 SELF_APPROVAL_NOT_ALLOWED`; `403 ACCESS_DENIED`; `400 INVALID_STATE_TRANSITION`; `400 VALIDATION_ERROR` |
| `/api/health` | GET | Public | Health check. | No auth required |

### 4.3 Review endpoint check order

The backend must enforce checks in this order:

1. Authentication -> `401 UNAUTHORIZED`.
2. Role is `REVIEWER` -> `403 FORBIDDEN`.
3. Current user is not the request owner -> `403 SELF_APPROVAL_NOT_ALLOWED`.
4. Current user is the assigned reviewer -> `403 ACCESS_DENIED`.
5. Request status is `PENDING` -> `400 INVALID_STATE_TRANSITION`.
6. Decision payload is valid -> `400 VALIDATION_ERROR`.

Checking self-approval before assignment ensures BR-01 is enforced even when the request is assigned to another reviewer.

### 4.4 Reviewer assignment rule

Sprint 1 uses a deterministic category mapping:

| Category | Assigned reviewer |
| :--- | :--- |
| `EQUIPMENT`, `TRAVEL` | `t.reviewer@cpe334.local` |
| `SOFTWARE`, `SUPPLIES` | `manager.hybrid@cpe334.local` |

If the requester is the mapped reviewer, the system assigns the other reviewer instead. Admin reassignment is deferred to Sprint 3.

---

## 5. UI Structure and Conventions

### 5.1 Screens and routes

| Route | Screen | Access | Key states |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | default, loading, invalid credentials, server error |
| `/requests/new` | `NewRequestPage` | Authenticated | field validation, submitting, success redirect, API error |
| `/requests/my` | `MyRequestsPage` | Authenticated | loading, empty list, populated list, error |
| `/requests/:id` | `RequestDetailPage` | Owner or assigned reviewer | loading, not found, forbidden, fields, history |
| `/reviewer/pending` | `PendingReviewsPage` | `REVIEWER` | loading, empty queue, assigned list, error |
| `/reviewer/requests/:id` | `ReviewDetailPage` | Assigned reviewer | request detail, approve/reject form, validation, forbidden, conflict |
| `/403`, `/404` | Error pages | All | static error state |

### 5.2 Shared UI behavior

- Client-side validation mirrors server validation, but the server is the source of truth.
- Submit controls are disabled while a request is in flight.
- API errors display a banner or field-level message using the server error code/message.
- Empty, loading, and error states are explicit on every list/detail screen.
- No optimistic status change: the UI updates after a successful API response.
- Role-aware navigation is a usability aid, not a security boundary.
- The UI must not display `passwordHash`, tokens, or other sensitive fields.

---

## 6. API Approach and Conventions

### 6.1 Response shape

Success:

```json
{ "data": { "...": "..." } }
```

Failure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": []
  }
}
```

`details` is optional and may contain field-level validation information.

### 6.2 HTTP status codes

| Status | Meaning |
| :---: | :--- |
| `200` | Successful read/update/decision. |
| `201` | Request created. |
| `400` | Validation failure or invalid state transition. |
| `401` | Missing, invalid, or expired authentication. |
| `403` | Authenticated but not allowed. |
| `404` | Resource not found. |
| `500` | Unexpected server error; no stack trace or secret in the response. |

### 6.3 Endpoint summary

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/auth/login` | POST | Login and set the JWT cookie. |
| `/api/auth/logout` | POST | Clear the JWT cookie. |
| `/api/auth/me` | GET | Return current user. |
| `/api/requests` | POST | Create a request. |
| `/api/requests/my` | GET | List current user's requests. |
| `/api/requests/:id` | GET | Get request detail and history when allowed. |
| `/api/requests/pending` | GET | List the reviewer's assigned pending requests. |
| `/api/requests/:id/review` | POST | Approve or reject an assigned request. |
| `/api/health` | GET | Health check; reports `status`, `commit`, and `timestamp`. |

### 6.4 Validation and error handling

- Validate input at the API boundary with Zod schemas.
- Reject unknown or malformed fields.
- Parse monetary values carefully; persist as `Decimal(12,2)`.
- Return field-specific `details` when useful.
- Use a central error middleware to map domain errors to the standard response shape.
- Production responses must not expose stack traces, SQL, secrets, or PII.
- Pagination and advanced filtering are not required in Sprint 1; lists are bounded by demo data.

---

## 7. Authentication and Session Lifecycle

1. **Login:** validate body, find user by email, compare with `bcrypt.compare`, sign a JWT `{ sub, role, iat, exp }` using `JWT_SECRET`, set the `token` cookie, return the user without `passwordHash`.
2. **Authenticated request:** read the cookie, verify signature and expiry, load the user, attach `req.user`. Missing/invalid/expired cookie -> `401 UNAUTHORIZED`.
3. **Authorization:** enforce role, ownership, assignment, and state in the order defined in section 4.3.
4. **Current user:** `GET /api/auth/me` returns `{ id, email, name, role }` only.
5. **Logout:** `POST /api/auth/logout` clears the cookie with `maxAge: 0`; the client redirects to `/login`.
6. **Password handling:** bcrypt cost 12; hashes are never logged or returned; demo password is local-only.

### 7.1 Cookie flags

| Flag | Value |
| :--- | :--- |
| Name | `token` |
| `httpOnly` | `true` |
| `sameSite` | `lax` |
| `secure` | `true` when `NODE_ENV=production` |
| `path` | `/` |
| `maxAge` | 8 hours |

Sprint 1 uses stateless JWTs. Logout clears the client cookie, but a stolen token remains valid until expiry; server-side revocation is a known limitation and is deferred.

---

## 8. Configuration, Secrets, and Deployment Design

### 8.1 Environment variables

```text
DATABASE_URL=postgresql://user:password@localhost:5434/approval_db
JWT_SECRET=replace-with-long-random-secret
JWT_EXPIRES_IN_SECONDS=28800
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
GIT_COMMIT=local
```

- `.env` is ignored by Git.
- `.env.example` documents required variables without real secrets.
- Production secrets are injected by the deployment platform, not committed.
- The database configuration is externalized through `DATABASE_URL`.
- `GIT_COMMIT` is set by CI/CD and returned by `/api/health`, so the running
  release can be identified from the public URL.

### 8.2 Local development

- PostgreSQL 17 is the target database; run locally or via Docker on host port `5434`.
- Run migrations and seed before starting feature work.
- Run client and server as separate development servers.
- Health endpoint: `GET /api/health`.

### 8.3 Docker and GCP deployment (Lab 5, implemented)

- **One runtime image:** the multi-stage `Dockerfile` installs workspace
  dependencies, generates the Prisma client, builds the React client and the
  Express server, and copies only the runtime artifacts into the final stage.
  The container serves the built client and the API on port `3000`.
- **Local production-like stack:** `docker-compose.yml` runs PostgreSQL 17
  (`db`), a one-off `prisma migrate deploy` job (`migrate`), the application
  (`app`), and an optional `seed` profile. The app starts only after migrations
  succeed, and database data lives in a named volume.
- **Migrations in the pipeline:** CI runs `prisma migrate deploy` against a
  service PostgreSQL before tests; deployment runs the same command as a
  separate Cloud Run job before the service revision is updated. Schema changes
  therefore follow one path locally, in CI, and in production.
- **Container health check:** the image health check and the post-deploy smoke
  test call `/api/health`, which returns `status`, `commit`, and `timestamp`.
- **GCP target:** Cloud Run for the application container, Cloud SQL for
  PostgreSQL, Artifact Registry for images tagged with the commit SHA and
  deployed by digest, Secret Manager for `DATABASE_URL` and `JWT_SECRET`, and
  GitHub Actions for CI/CD using Workload Identity Federation.
- **Release identification:** the deploy workflow sets `GIT_COMMIT` to the
  release SHA, so the running commit is observable from `/api/health` and from
  the Cloud Run revision.
- **Secrets:** no secret is committed or baked into an image. Local values come
  from `.env`; cloud values come from Secret Manager and GitHub Actions secrets.
- **Cost controls:** Cloud Run minimum instances `0`, maximum `3`; smallest
  Cloud SQL tier with storage auto-increase off; resources stopped or removed
  after grading.
- **Deployment guide:** `docs/labs/lab-05/deployment.md` documents the complete
  environment variable table, resource names, one-time setup, release
  procedure, rollback, and evidence mapping.

### 8.4 Reproducibility

- A clean clone must support install, build, test, migration, and seed commands.
- Node and npm versions are documented in the README.
- No real production data is used in local or demo environments.

---

## 9. Error Handling, Logging, and Security

- A central error handler maps validation and domain errors to the standard error shape.
- Prisma uses parameterized queries, reducing SQL injection risk.
- React escapes rendered text by default; avoid `dangerouslySetInnerHTML`.
- The JSON API plus `sameSite=lax` cookie reduces CSRF risk. Additional CSRF hardening is deferred.
- Rate limiting, audit export, and admin actions are Sprint 3 concerns.
- Logs must not contain passwords, tokens, secrets, or unnecessary personal data.
- Error responses must not reveal stack traces or internal implementation details in production.

---

## 10. Requirements Traceability

| Design area | Requirements |
| :--- | :--- |
| Authentication and session | FR-01, NFR-01, NFR-04 |
| Request creation and validation | FR-02, BR-04, BR-05, NFR-04 |
| My requests and data isolation | FR-03, BR-03 |
| Review queue and decision | FR-04, FR-06, BR-01, BR-02, BR-05, BR-06, BR-07 |
| History and audit write | FR-05, BR-06 |
| Persistence and durability | NFR-03 |
| Testability and traceability | NFR-05 |
| Deployability and configuration | NFR-06 |

Detailed feature allocation, acceptance criteria, and test IDs are defined in the feature inventory, traceability matrix, and Sprint 1 engineering contracts.

---

## 11. Known Limitations in Sprint 1

- `ADMIN` role and admin management endpoints are deferred to Sprint 3.
- No attachments, multi-stage approval, or return-for-revision in Sprint 1.
- No real payment, bank, email, or SMS integration.
- Stateless JWT logout clears the cookie but does not revoke an already stolen token.
- Search, filtering, reporting, and analytics are deferred.
- Advanced CSRF protection and rate limiting are deferred unless required by later hardening.

---

## 12. Version History

| Version | Date | Change | Author | Reviewer |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 6 Nov 2026 | Initial system-level SDS baseline for Sprint 1. | T | Oum |
