# Contract F-10 — Admin User & Assignment Management (Planned)

> **Feature ID:** F-10 · **Issue:** #72 · **Linked requirements:** FR-11, BR-01, BR-05, NFR-01, NFR-04
> **Owner:** Oum (67070501075) · **Reviewer:** T (67070501021)
> **Status:** v1.0 **PLANNED** — contract only; no endpoint is implemented in Deliverable 2
> **Artifact:** `docs/sprints/sprint-3/f-10-admin-management.md`
> **Dependencies:** F-01 (auth), F-04 (review decisions), F-07 (stage assignment)

---

## 1. Feature SDS (planned)

Introduce the `ADMIN` role as an active actor. An admin may list users, change a user's role, and reassign a request's reviewer (including the stage-2 reviewer created by F-07). Every admin action is audited in `ApprovalHistory` with an `ADMIN_*` action value.

**Non-negotiable rules:**
- BR-01 still forbids self-approval: an admin cannot approve/reject a request they own, and cannot reassign a request to its requester.
- BR-05 remains: only the currently assigned reviewer decides; admin assignment changes take effect immediately.
- BR-06 history stays append-only; reassignment appends an entry, never edits an old one.
- ADMIN is not a super-reviewer: admin has no `POST /review` permission unless they also hold `REVIEWER` (role is single-valued in Sprint 1 schema; this contract defines ADMIN as distinct).

### Planned endpoints

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/admin/users` | GET | `token` (ADMIN) | `200 { data: { users: [...] } }` | 401; 403 `FORBIDDEN` |
| `/api/admin/users/:id/role` | PATCH | `{ role: "REQUESTER" \| "REVIEWER" \| "ADMIN" }` | `200 { data: { user } }` | 401; 403; 400 `VALIDATION_ERROR`; 404 |
| `/api/admin/requests/:id/assignment` | PATCH | `{ reviewerId, stage?: 1 \| 2 }` | `200 { data: { request, history } }` | 401; 403; 400 `VALIDATION_ERROR` / `INVALID_STATE_TRANSITION`; 404 |

### Planned data change
Add `HistoryAction.ADMIN_REASSIGNED` / `ADMIN_ROLE_CHANGED` in a **new reviewed migration** (not the #77 bundle). No deletion of existing history.

### Planned UI
`/admin/users` and `/admin/requests` with role/assignment forms, role-aware navigation, and the shared loading/empty/error states from #78. Client role checks are convenience only; backend enforces.

---

## 2. Acceptance criteria (planned — not executed in D2)

| ID | Criterion |
| :--- | :--- |
| AC-18.1 | Only `ADMIN` can call admin endpoints; a `REQUESTER`/`REVIEWER` gets `403 FORBIDDEN` from the backend. |
| AC-18.2 | Admin can list users without password hashes. |
| AC-18.3 | Admin can change a user's role; the change is validated against the role enum and audited. |
| AC-18.4 | Admin can reassign a request (including stage 2) to an eligible REVIEWER; assignment change is audited and takes effect for the queue. |
| AC-18.5 | Reassigning to the requester or to a non-reviewer is rejected (`400 VALIDATION_ERROR`); BR-01 is never bypassed. |
| AC-18.6 | Admin cannot decide a request they own; BR-01 still returns `403 SELF_APPROVAL_NOT_ALLOWED`. |

## 3. Software Test Specification (planned)

| Test ID | AC | Level | Expected |
| :--- | :--- | :--- | :--- |
| TEST-19.1 | AC-18.1 | API | non-admin -> 403 `FORBIDDEN` |
| TEST-19.2 | AC-18.2 | API | user list has no `passwordHash` |
| TEST-19.3 | AC-18.3 | API/DB | role change persisted + audit row |
| TEST-19.4 | AC-18.4 | API/DB | new assignee sees the queue; audit row appended |
| TEST-19.5 | AC-18.5 | API | requester/non-reviewer target -> 400, no change |
| TEST-19.6 | AC-18.6 | API | admin owns request -> 403 `SELF_APPROVAL_NOT_ALLOWED` |

## 4. Definition of Done (future)
Contract reviewed; migration reviewed; TEST-19.1..19.6 RED→GREEN; regression of F-01..F-09 and BR-01/03/05; reviewed PR; remaining-work row accepted.

## 5. Version history
| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial planned contract for Deliverable 2 Part C. | Sprint 3 remaining feature specified honestly as not implemented. |
