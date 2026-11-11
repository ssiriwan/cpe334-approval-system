# Contract E1 - F-02 Request Creation & F-03 My Requests and Data Isolation

> **Feature IDs:** F-02, F-03
> **Issue:** #4 - Requester slice: create request, my requests, data isolation
> **Linked requirements:** FR-02, FR-03, BR-03, BR-04, BR-05, BR-06, NFR-03, NFR-04
> **Owner:** Oum (67070501075)
> **Reviewer:** T (67070501021)
> **Status:** v1.1 implemented and verified in CI (5 test files / 20 tests passed)
> **Artifact:** `docs/sprints/sprint-1/feature-01.md`

---

## 1. Feature SDS

The requester vertical slice allows authenticated users (`REQUESTER` and `REVIEWER`, per D-02) to create expense/purchase approval requests, persist them with an initial `SUBMITTED` history record, and retrieve only the requests they own (or are assigned to review).

### Workflow & Business Rules
1. **Creation & Validation (`F-02` / `BR-04`):**
   - Validate request payload on the server using Zod (`.strict()`).
   - `title`: trimmed string, 3–150 characters.
   - `amount`: positive number > 0 and `<= 9,999,999,999.99` (stored as `Decimal(12,2)`).
   - `category`: must be one of `EQUIPMENT | TRAVEL | SOFTWARE | SUPPLIES`.
   - `description`: trimmed string, 1–1,000 characters.
   - Invalid payloads return `400 VALIDATION_ERROR` with field details and persist nothing.
2. **Request Number Generation (`D-10`):**
   - Server generates `requestNo` in format `REQ-YYYYMMDD-NNNN` (e.g. `REQ-20261111-0001`), retrying on unique-constraint collision.
3. **Deterministic Reviewer Assignment (`BR-05` / `D-03`):**
   - `EQUIPMENT` or `TRAVEL` → assigned to `t.reviewer@cpe334.local`.
   - `SOFTWARE` or `SUPPLIES` → assigned to `manager.hybrid@cpe334.local`.
   - If the requester is the mapped reviewer for that category, the system assigns the alternate reviewer instead.
4. **Atomic Creation (`BR-06` / `D-14`):**
   - Inside `prisma.$transaction`: insert `ApprovalRequest` with `status = PENDING` and insert `ApprovalHistory` with `action = SUBMITTED` and `actorId = currentUser.id`.
5. **My Requests & Data Isolation (`F-03` / `BR-03`):**
   - `GET /api/requests/my` returns only records where `requesterId = currentUser.id`, ordered by `createdAt DESC`.
   - `GET /api/requests/:id` returns request details and ordered histories only if `requesterId === currentUser.id` or `assignedReviewerId === currentUser.id`; otherwise returns `403 ACCESS_DENIED` without leaking any private request fields.

---

## 2. UI Specification

### Screens & Routes
| Route | Screen | Access | Key States |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | email/password form, inline validation, loading, error banner, role redirect |
| `/requests/new` | `NewRequestPage` | Authenticated | fields (`title`, `amount`, `category`, `description`), validation, submitting disabled state, API error banner, redirect to detail/list on 201 |
| `/requests/my` | `MyRequestsPage` | Authenticated | loading state, empty state with CTA, table (`requestNo`, `title`, `amount`, `category`, `status`, `assignedReviewer`, `createdAt`), error banner |
| `/requests/:id` | `RequestDetailPage` | Owner or assigned reviewer | loading, 404 not found, 403 forbidden state, full request fields, chronological approval history timeline |

### Shared UI Conventions
- Client-side validation mirrors server rules (`title` 3–150, `amount > 0`, `category` select, `description` 1–1000).
- Submit button disabled while in flight; no optimistic status mutation.
- Navigation bar displays current user name/role and Logout button (`POST /api/auth/logout`).
- Never expose `passwordHash` or token values.

---

## 3. API Specification

All responses use the standard envelope:
- Success: `{ "data": ... }`
- Failure: `{ "error": { "code": "...", "message": "...", "details"?: ... } }`

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/requests` | POST | `{ title, amount, category, description }` | `201 { data: { request } }` | `400 VALIDATION_ERROR`; `401 UNAUTHORIZED`; `403 FORBIDDEN` |
| `/api/requests/my` | GET | cookie | `200 { data: { requests: [...] } }` | `401 UNAUTHORIZED` |
| `/api/requests/:id` | GET | cookie | `200 { data: { request, histories } }` | `401 UNAUTHORIZED`; `403 ACCESS_DENIED`; `404 NOT_FOUND` |

### Response Field Notes
- `amount` is serialized as a 2-decimal string (e.g., `"1500.00"`) to preserve `Decimal(12,2)` precision.
- `requester`, `assignedReviewer`, and `actor` nested objects expose only `{ id, name, email, role }` (never `passwordHash`).
- `histories` are ordered chronologically (`createdAt ASC`).

---

## 4. Data Specification

Uses existing Prisma models from the foundation schema (`20261110084745_init_schema`):
- `ApprovalRequest`: `id`, `requestNo` (unique), `title`, `amount` (`Decimal(12,2)`), `category`, `description`, `status` (`PENDING`), `requesterId`, `assignedReviewerId`, `createdAt`, `updatedAt`.
- `ApprovalHistory`: `id`, `requestId`, `actorId`, `action` (`SUBMITTED`), `comment`, `createdAt`.
- Indexes utilized: `ApprovalRequest_requesterId_createdAt_idx` and `ApprovalHistory_requestId_createdAt_idx`.
- No new database migration is required for Contract E1.

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-01** | Authenticated `REQUESTER` (or `REVIEWER`) submitting valid request fields receives `201` with `status = PENDING`, a unique `requestNo`, a deterministic `assignedReviewerId` per BR-05, and an initial `SUBMITTED` history entry. |
| **AC-02** | Submitting invalid payloads (`amount <= 0`, `amount > 9999999999.99`, trimmed `title` < 3 or > 150 chars, unknown `category`, empty or > 1000 char `description`, unknown body keys) returns `400 VALIDATION_ERROR` and creates no database record. |
| **AC-03** | `GET /api/requests/my` returns `200` with only the authenticated user's own requests, ordered newest first (`createdAt DESC`). |
| **AC-04** | `GET /api/requests/:id` returns `403 ACCESS_DENIED` without private data when requested by a user who is neither the requester nor the assigned reviewer; unauthenticated requests to any `/api/requests*` route return `401 UNAUTHORIZED`. |
| **AC-04b** | Created requests and their `SUBMITTED` history entries persist in PostgreSQL across process/client restarts. |

---

## 6. Software Test Specification (STS)

| Test ID | AC | Level | Preconditions / Input | Action | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | AC-01 | API/DB integration | Authenticated requester + valid `EQUIPMENT` payload | `POST /api/requests` | `201`; `status = PENDING`; `requestNo` matches `REQ-YYYYMMDD-NNNN`; `assignedReviewerId` is `t.reviewer`; `SUBMITTED` history row exists in DB |
| **TEST-02** | AC-02 | API integration (boundary/negative) | `amount` 0 / -10 / `10000000000`; `title` `"ab"` / 151 chars; bad `category`; empty `description` | `POST /api/requests` | `400 VALIDATION_ERROR`; DB request count unchanged |
| **TEST-03** | AC-03 | API integration | User A has 2 requests, User B has 1 request | `GET /api/requests/my` as User A | `200`; returns only A's 2 requests, ordered newest first |
| **TEST-04** | AC-04 | API integration | Request owned by User A (assigned to Reviewer R1); User B and unrelated Reviewer R2 try to access | `GET /api/requests/:id` as B / R2 / anonymous | Anonymous → `401 UNAUTHORIZED`; User B & R2 → `403 ACCESS_DENIED` with no private data |
| **E2E-01** | AC-01, AC-03, AC-04b | E2E (Playwright) | Seeded requester account | Login → navigate to `/requests/new` → submit valid request → view `/requests/my` → open detail → reload page | Persisted request and `SUBMITTED` history visible after page reload |

Additional boundary & unit checks:
- Reviewer creating a request in their own primary category (e.g., `t.reviewer` creating `EQUIPMENT`) automatically gets assigned to the alternate reviewer (`manager.hybrid`) so `assignedReviewerId !== requesterId`.
- Unknown request UUID returns `404 NOT_FOUND`.
- Client component tests verify form validation messages, loading/disabled submit state, and empty/error states in `MyRequestsPage`.

---

## 7. Definition of Done

- [x] Contract E1 (`v1.0`) committed before feature tests and implementation (`bb4251b`).
- [x] Automated API/DB tests (`TEST-01..TEST-04`, 6 server tests) and client component tests (`App.test.tsx`, `Requests.test.tsx`, 4 tests) implemented and passing in CI (`43047999614`: 5 files / 20 tests passed).
- [x] Playwright `E2E-01` spec (`e2e/requester.spec.ts`) implemented (to be executed against local running stack when Docker is up).
- [x] TDD commit sequence visible (`bb4251b` contract → `d80cc44` tests → `331294f` implementation → `37a343b` workspace test fix).
- [x] All responses conform to `{ data }` / `{ error: { code, message, details? } }` and leak no `passwordHash`.
- [x] Persistence verified against PostgreSQL in CI (`requests.test.ts` queries `ApprovalRequest` and `ApprovalHistory` directly via Prisma).
- [ ] Teammate review completed on PR #15 targeting `sprint-1-staging` (pending T's review).

---

## 8. Version History

| Version | Date | Change | Reason | Commit/PR |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 11 Nov 2026 | Initial Contract E1 specification (SDS, UI, API, AC, STS, DoD). | Sprint 1 pre-implementation contract for Issue #4. | `bb4251b` |
| v1.1 | 11 Nov 2026 | Implementation notes: `request.service.ts`, `routes/requests.ts`, React requester UI (`LoginPage`, `NewRequestPage`, `MyRequestsPage`, `RequestDetailPage`), `vitest.workspace.ts`, `E2E-01` spec, and CI verification (20 tests green). | Requester slice implemented and verified in PR #15. | This PR |
