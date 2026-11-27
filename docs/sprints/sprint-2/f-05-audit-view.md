# Contract F-05 — Approval History & Audit View

> **Feature ID:** F-05 (Sprint 1 write → Sprint 2 view)
> **Issue:** #68 · **Linked requirements:** FR-05, BR-03, BR-06, NFR-04, NFR-05
> **Owner:** Oum (67070501075) · **Reviewer:** T (67070501021)
> **Status:** v1.0 pre-implementation — awaiting teammate review
> **Artifact:** `docs/sprints/sprint-2/f-05-audit-view.md`
> **Dependencies:** Sprint 1 `ApprovalHistory` rows (no schema change)

---

## 1. Feature SDS

F-05 exposes the already append-only `ApprovalHistory` table as a read-only audit view. Sprint 1 already writes `SUBMITTED`/`APPROVED`/`REJECTED` rows and already embeds them in `GET /api/requests/:id`. Sprint 2 adds a dedicated, explicitly read-only endpoint so the audit source is unambiguous and can be tested independently of the request detail response.

### Rules

1. Only the **owner** (`requesterId`) or the **currently assigned reviewer** (`assignedReviewerId`) may read history. For multi-stage requests the current-stage reviewer is the assigned reviewer, so the same column remains authoritative (F-07).
2. Every other authenticated user → `403 ACCESS_DENIED`; unauthenticated → `401 UNAUTHORIZED`. Unknown request id → `404 NOT_FOUND`. Error bodies contain no private request fields.
3. Rows are ordered `createdAt ASC`, then `id ASC` for deterministic ties. Fields: `id`, `requestId`, `actor {id,name,email,role}`, `action`, `comment`, `createdAt`.
4. The view is strictly read-only: no `POST/PUT/PATCH/DELETE` history route exists. Existing rows are never mutated, including when F-06/F-07 append new actions.
5. Data written by Sprint 1, F-06 and F-07 all appear in one chronological timeline; this is why F-05 must be implemented before the other Sprint 2 features are verified.

### Check order (mirror Sprint 1 contract E2 style)

`authentication (401) → existence (404) → ownership/assignment (403) → serialize (200)`.

---

## 2. UI Specification

| Route | Screen | Access | States |
| :--- | :--- | :--- | :--- |
| `/requests/:id` | `RequestDetailPage` (extended) | owner / assigned reviewer | loading, 404, 403 forbidden, history timeline, empty (only after creation error — normally ≥1 `SUBMITTED` row), error banner |
| `/reviewer/requests/:id` | `ReviewDetailPage` (extended) | assigned reviewer | same timeline, stage badge when F-07 is active |

- History is rendered as a timeline: action label, actor name, `createdAt` (Thai/local formatted), and comment when present.
- No edit/delete button is rendered anywhere in the history section; the API has no such route either.
- New rows appear only after a successful API response — no optimistic insert.
- Loading skeleton and error banner use the existing shared components/error conventions.

---

## 3. API Specification

Success envelope `{ data: ... }`, failure envelope `{ error: { code, message, details? } }`.

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/requests/:id/history` | GET | `token` cookie | `200 { data: { requestId, histories: [...] } }` | `401 UNAUTHORIZED`; `403 ACCESS_DENIED`; `404 NOT_FOUND` |
| `/api/requests/:id` | GET | `token` cookie | unchanged — still returns `{ request, histories }` | unchanged |

- `GET /api/requests/:id` remains backwards-compatible: its `histories` array uses the same serializer as the new endpoint, so Sprint 1 evidence stays valid.
- The new endpoint must not include `passwordHash` or any user field beyond `PUBLIC_USER_SELECT`.

---

## 4. Data Specification

**No schema change, no new migration.** Reads `ApprovalHistory` and its `actor` relation from `20261110084745_init_schema`. F-06/F-07 extend the `action` enum but do not change the read contract.

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-13.1** | Owner calls `GET /api/requests/:id/history` and receives `200` with every history row of that request in `createdAt ASC` order, including actor public profile, action and comment. |
| **AC-13.2** | Assigned reviewer receives the same `200` and the same ordered rows, including rows created by other actors. |
| **AC-13.3** | Any other authenticated user receives `403 ACCESS_DENIED`; an unauthenticated caller receives `401 UNAUTHORIZED`; neither response leaks request fields. Unknown id → `404 NOT_FOUND`. |
| **AC-13.4** | History is append-only and durable: existing rows are byte-identical after subsequent F-06/F-07 actions and after an application restart/redeploy; no update/delete route exists. |

---

## 6. Software Test Specification

| Test ID | AC | Level | Preconditions / Input | Action | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-14.1** | AC-13.1 | API/DB integration | Seeded requester owns a request with `SUBMITTED` + `APPROVED` rows | `GET /:id/history` as owner | `200`; 2 rows ascending; actor/action/comment/createdAt present |
| **TEST-14.2** | AC-13.2 | API/DB integration | Request assigned to `t.reviewer`, decided by that reviewer | `GET /:id/history` as `t.reviewer` | `200`; same rows and order as owner view |
| **TEST-14.3** | AC-13.3 | API integration | Second requester cookie; no cookie; random id | `GET /:id/history` three times | `403 ACCESS_DENIED`, `401 UNAUTHORIZED`, `404 NOT_FOUND`; no private data in bodies |
| **TEST-14.4** | AC-13.4 | API/DB integration | Existing rows captured; append a new action via F-06/F-07; restart | Re-read history | Old rows unchanged; new row appended; no `PUT`/`DELETE` route responds successfully |

Additional negative checks: `POST/PUT/DELETE /api/requests/:id/history` → `404`/`405` (no accidental write route); `passwordHash` absent from every response.

---

## 7. Definition of Done

- [ ] Contract v1.0 reviewed and merged before implementation (Issue #68).
- [ ] `GET /api/requests/:id/history` implemented with the §1 check order.
- [ ] Detail page timeline extended with loading/empty/error states and no edit controls.
- [ ] TEST-14.1..14.4 implemented, RED on pre-change code then GREEN; TEST-06/TEST-13 retained.
- [ ] Completion table row contains AC, implementation commit, executed results, accepted release.
- [ ] Evidence IDs `E-D2-F05-*` captured and referenced in the PDF.

## 8. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial Sprint 2 contract: read-only audit endpoint, UI timeline, AC-13.1..13.4, TEST-14.1..14.4. | Deliverable 2 Part B contract-before-code requirement. |
