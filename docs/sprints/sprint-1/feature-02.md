# Contract E2 - F-04 Review Queue & Decision + F-05 History Write

> **Feature IDs:** F-04, F-05
> **Issue:** #5 - Reviewer slice: assigned queue, decision, history, self-approval guard
> **Linked requirements:** FR-04, FR-05, FR-06, BR-01, BR-02, BR-05, BR-06, BR-07, NFR-01, NFR-04
> **Owner:** T (67070501021)
> **Reviewer:** Oum (67070501075)
> **Status:** v1.1 implemented and verified locally (PR pending review)
> **Artifact:** `docs/sprints/sprint-1/feature-02.md`

---

## 1. Feature SDS

The reviewer slice lets a `REVIEWER` see only the `PENDING` requests assigned to them, inspect one request with its history, and record an `APPROVE` or `REJECT` decision with an optional/required comment. A decision changes the request status and appends an `ApprovalHistory` row inside one database transaction. The backend enforces every business rule; hiding UI controls is not authorization.

### Workflow and enforcement order

`POST /api/requests/:id/review` checks are executed in this exact order:

1. **Authentication** - no/invalid `token` cookie -> `401 UNAUTHORIZED`.
2. **Role** - role other than `REVIEWER` -> `403 FORBIDDEN`.
3. **Existence** - unknown request id -> `404 NOT_FOUND`.
4. **No self-approval (BR-01)** - `requesterId === currentUser.id` -> `403 SELF_APPROVAL_NOT_ALLOWED`.
5. **Assignment (BR-05)** - `assignedReviewerId !== currentUser.id` -> `403 ACCESS_DENIED`.
6. **State lifecycle (BR-02)** - status is not `PENDING` -> `400 INVALID_STATE_TRANSITION`.
7. **Decision payload (BR-07)** - invalid `decision`/`comment` -> `400 VALIDATION_ERROR`.
8. **Commit** - status update + `ApprovalHistory` insert in one transaction (BR-06).

Checking self-approval before assignment makes BR-01 testable even when the owner's request is assigned to another reviewer.

### Rules

- `GET /api/requests/pending` returns only requests where `assignedReviewerId = currentUser.id` and `status = PENDING`, oldest first (`createdAt ASC`).
- `APPROVE` sets `APPROVED`; `REJECT` sets `REJECTED`; no other transitions are allowed.
- `REJECT` requires a trimmed comment of 3-500 characters.
- `APPROVE` accepts no comment or a trimmed comment of at most 500 characters. Empty/whitespace-only comments are stored as `null`.
- The status update uses a conditional write (`where: { id, status: PENDING }`); if the request was decided concurrently, the transaction fails with `INVALID_STATE_TRANSITION` and no history row is added.
- History rows are append-only. Sprint 1 exposes no update or delete history endpoint.

---

## 2. UI Specification

### Routes and screens

| Route | Screen | Access | Key states |
| :--- | :--- | :--- | :--- |
| `/reviewer/pending` | `PendingReviewsPage` | `REVIEWER` | loading, empty ("no assigned pending requests"), list, error banner with `code: message` |
| `/reviewer/requests/:id` | `ReviewDetailPage` | `REVIEWER` | loading, 404 not found, 403 forbidden, request fields, chronological history, decision form, submitting/disabled, success state, error banner |

### PendingReviewsPage

- Table columns: `requestNo`, `title`, `requester`, `category`, `amount`, `createdAt`, `action`.
- Amount rendered as a 2-decimal THB value.
- "Review" link navigates to `/reviewer/requests/:id`.
- Empty state explains that only requests assigned by category appear here.

### ReviewDetailPage

- Shows the same request fields as the requester detail page plus the assigned reviewer and history timeline.
- When the request is `PENDING`, a decision form is shown with `APPROVE`/`REJECT` options and a comment textarea.
- When the current user is the owner, a warning explains that self-approval is forbidden and the server will reject the attempt (`SELF_APPROVAL_NOT_ALLOWED`). The form remains submit-capable so the backend rule can be demonstrated and tested; the UI never silently bypasses it.
- When the current user is not the assigned reviewer, a warning explains that the request is not assigned to them (`ACCESS_DENIED` from the server).
- Client validation mirrors the server for `REJECT` comments (3-500 characters) and `APPROVE` comments (max 500).
- On success the page re-renders the updated status and appends the new history row; no optimistic status change.
- After a successful decision, the request no longer appears in the pending queue.

### Navigation

- `LoginPage` sends `REVIEWER` users to `/reviewer/pending` and `REQUESTER` users to `/requests/my` after login.
- `Layout` shows the `Pending Reviews` link only for `REVIEWER` users (existing behavior).

---

## 3. API Specification

All responses use the standard envelope:
- Success: `{ "data": ... }`
- Failure: `{ "error": { "code": "...", "message": "...", "details"?: ... } }`

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/requests/pending` | GET | cookie | `200 { data: { requests: [...] } }` | `401 UNAUTHORIZED`; `403 FORBIDDEN` |
| `/api/requests/:id/review` | POST | `{ decision: "APPROVE" \| "REJECT", comment?: string }` | `200 { data: { request, history } }` | `401 UNAUTHORIZED`; `403 FORBIDDEN`; `403 SELF_APPROVAL_NOT_ALLOWED`; `403 ACCESS_DENIED`; `404 NOT_FOUND`; `400 INVALID_STATE_TRANSITION`; `400 VALIDATION_ERROR` |

### Response field notes

- `request` uses the same serialization as Contract E1: `amount` is a 2-decimal string; nested `requester`/`assignedReviewer` expose only `{ id, name, email, role }`.
- `history` is the newly appended row with `{ id, requestId, actorId, actor, action, comment, createdAt }`.
- `GET /api/requests/pending` items include the requester public profile and are ordered by `createdAt ASC`.

---

## 4. Data Specification

Uses the existing schema from migration `20261110084745_init_schema`; no new migration is required.

- `ApprovalRequest.status`: `PENDING` -> `APPROVED` or `REJECTED`.
- `ApprovalRequest.updatedAt` changes automatically on update.
- `ApprovalHistory` insert: `requestId`, `actorId = currentUser.id`, `action = APPROVED | REJECTED`, `comment = trimmed comment or null`.
- The status update and history insert run inside `prisma.$transaction`.
- The conditional update (`where: { id, status: PENDING }`) protects against double decisions and concurrent reviewers.
- History is append-only; Sprint 1 has no update/delete endpoint for `ApprovalHistory`.

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-05** | `GET /api/requests/pending` returns `200` with only `PENDING` requests where `assignedReviewerId = currentUser.id`; requests assigned to another reviewer and already-decided requests are excluded. Non-reviewers receive `403 FORBIDDEN`; unauthenticated requests receive `401 UNAUTHORIZED`. |
| **AC-06** | The assigned reviewer submits `APPROVE` or `REJECT` with a comment and receives `200`; the request status changes to `APPROVED`/`REJECTED`, `updatedAt` changes, and exactly one new `ApprovalHistory` row is appended with the actor, action, and comment. |
| **AC-07** | A `REVIEWER` who owns the request cannot approve or reject it, even when it is assigned to another reviewer, and receives `403 SELF_APPROVAL_NOT_ALLOWED`; the status and history do not change. The check runs before the assignment check. |
| **AC-08** | Approving or rejecting a request that is already `APPROVED` or `REJECTED` returns `400 INVALID_STATE_TRANSITION` and appends no history. |
| **AC-09** | A `REVIEWER` who is not `assignedReviewerId` receives `403 ACCESS_DENIED` and cannot change the request. |
| **AC-10** | A `REQUESTER` (no `REVIEWER` role) calling either reviewer endpoint receives `403 FORBIDDEN` from the backend, independent of the UI. |
| **AC-11** | History is append-only: decisions add new rows, existing rows are never modified or deleted, no update/delete endpoint exists, and rows persist after an application process restart. |
| **AC-12** | `decision` outside `APPROVE \| REJECT`, `REJECT` without a 3-500 character comment, or an `APPROVE` comment longer than 500 characters returns `400 VALIDATION_ERROR` and changes nothing. |

---

## 6. Software Test Specification (STS)

| Test ID | AC | Level | Preconditions / Input | Action | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-05** | AC-05 | API/DB integration | Pending requests assigned to R1 and R2; one decided request assigned to R1 | `GET /api/requests/pending` as R1 | `200`; only R1's `PENDING` request; excludes R2's and the decided request; requester profile included |
| **TEST-06** | AC-06 | API/DB integration | Assigned `PENDING` request | `POST /review` with `APPROVE` + comment | `200`; `APPROVED`; `updatedAt` changed; one `APPROVED` history row with actor/comment |
| **TEST-07** | AC-06 | API/DB integration | Assigned `PENDING` request | `POST /review` with `REJECT` + 3-500 char comment | `200`; `REJECTED`; one `REJECTED` history row with comment |
| **TEST-08** | AC-07 | API/DB integration | `manager.hybrid` (REVIEWER) owns an `EQUIPMENT` request assigned to `t.reviewer` | `POST /review` as `manager.hybrid` | `403 SELF_APPROVAL_NOT_ALLOWED`; status remains `PENDING`; history unchanged |
| **TEST-09** | AC-08 | API/DB integration | Request already `APPROVED` | `POST /review` again | `400 INVALID_STATE_TRANSITION`; no new history |
| **TEST-10** | AC-10 | API integration | `REQUESTER` cookie | `GET /pending` and `POST /review` | `403 FORBIDDEN` on both |
| **TEST-11** | AC-09 | API integration | `manager.hybrid` reviews a request assigned to `t.reviewer` | `POST /review` | `403 ACCESS_DENIED`; no change |
| **TEST-12** | AC-12 | API integration | Bad `decision`; `REJECT` with no/2/501-char comment; `APPROVE` with 501-char comment | `POST /review` | `400 VALIDATION_ERROR` for each; status/history unchanged |
| **TEST-13** | AC-11 | API/DB integration | Request with `SUBMITTED` history; approve it; restart the application | Inspect history rows before/after; attempt `PUT`/`DELETE` on history | Existing row unchanged; new row appended; no update/delete route; rows persist after restart |
| **E2E-02** | AC-06 | E2E (Playwright) | Request created by a requester and assigned to `t.reviewer` | Login as reviewer -> pending queue -> open request -> `APPROVE` + comment | Success state; status `APPROVED`; `APPROVED` history visible; request leaves the pending queue |
| **E2E-03** | AC-07 | E2E (Playwright) | `manager.hybrid` owns a request | Login as `manager.hybrid` -> open `/reviewer/requests/:id` -> attempt `APPROVE` | Error banner contains `SELF_APPROVAL_NOT_ALLOWED`; status remains `PENDING` |

Additional negative checks:
- Unauthenticated `GET /api/requests/pending` and `POST /api/requests/:id/review` -> `401 UNAUTHORIZED`.
- Unknown request id -> `404 NOT_FOUND`.
- `REJECT` comment is trimmed before the 3-500 length check.

---

## 7. Definition of Done

- [x] Contract E2 (`v1.0`) committed before feature tests and implementation (`4d3731a`).
- [x] `review.service.ts` implemented with the exact check order in §1.
- [x] PendingReviewsPage and ReviewDetailPage implemented with loading/empty/error/forbidden states.
- [x] `TEST-05..TEST-13` implemented and passing (11 server tests); 3 client component tests added.
- [x] `E2E-02` and `E2E-03` implemented and executed against the local stack (Playwright, 2 passed).
- [x] History is append-only and survives process restart (verified: `SUBMITTED,APPROVED` retained after restart).
- [x] All responses use `{ data }` / `{ error: { code, message, details? } }` and leak no `passwordHash`.
- [ ] Teammate review completed on the PR targeting `sprint-1-staging`; author does not self-approve.
- [x] Contract version history and sprint README updated.

---

## 8. Implementation Notes

| Area | Artifact | Notes |
| :--- | :--- | :--- |
| Queue + decision service | `server/src/services/review.service.ts` | `listPendingReviews` (assigned + `PENDING`, `createdAt ASC`) and `submitReview` (BR-01 -> BR-05 -> BR-02 -> BR-07 -> transaction). |
| Routes | `server/src/routes/requests.ts` | `GET /api/requests/pending` and `POST /api/requests/:id/review` behind `requireRole(Role.REVIEWER)`. |
| Reviewer UI | `client/src/pages/PendingReviewsPage.tsx`, `client/src/pages/ReviewDetailPage.tsx` | Queue table; detail with decision form, owner/unassigned warnings, client-side comment validation, no optimistic status change. |
| Routing | `client/src/App.tsx`, `client/src/pages/LoginPage.tsx` | `/reviewer/pending` and `/reviewer/requests/:id` wired; `REVIEWER` login redirects to the queue. |
| Tests | `server/tests/review.test.ts`, `client/src/pages/Reviews.test.tsx`, `e2e/reviewer.spec.ts` | Red-phase commit `2c74f2c`; green after implementation. |
| Test isolation | `vitest.config.ts` | Root projects now run with `fileParallelism: false` because every project shares one PostgreSQL database, which made the requester suite's global row-count assertion race. |

---

## 9. Version History

| Version | Date | Change | Reason | Commit/PR |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 12 Nov 2026 | Initial Contract E2 specification (SDS, UI, API, AC-05..AC-12, STS, DoD). | Sprint 1 pre-implementation contract for Issue #5. | `4d3731a` |
| v1.1 | 12 Nov 2026 | Marked implemented: backend service/routes, reviewer UI, TEST-05..13, E2E-02/03, restart check, implementation notes, test-isolation note. | Implementation complete, awaiting teammate review. | This commit |
