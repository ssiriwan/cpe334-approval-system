# Contract F-06 — Return for Revision & Resubmission

> **Feature ID:** F-06 · **Issue:** #69 · **Linked requirements:** FR-07, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, NFR-04
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Status:** v1.0 pre-implementation — awaiting teammate review (depends on CR-05 approval)
> **Artifact:** `docs/sprints/sprint-2/f-06-return-resubmit.md`
> **Dependencies:** CR-05 (`cr-05-lifecycle-change.md`), migration bundle #77, F-04

---

## 1. Feature SDS

An assigned reviewer may send a `PENDING` request back to the requester with a mandatory reason; the owner may then edit the mutable fields and resubmit. The request returns to `PENDING` and is re-assigned using the **current CR-04 rule**, so amount/time changes correctly change the reviewer. Every transition appends one history row in the same transaction as the status update.

### State lifecycle (approved by CR-05)

```text
PENDING --return(reviewer)--> RETURNED --resubmit(owner)--> PENDING
   |                                                          |
   +--approve/reject(stage/assigned reviewer)--> APPROVED / REJECTED (terminal)
```

- `RETURN` allowed only from `PENDING`; `RESUBMIT` allowed only from `RETURNED`.
- `APPROVED`/`REJECTED` remain terminal. Any decision/return/resubmit on them → `400 INVALID_STATE_TRANSITION`.
- Editable on resubmission: `title`, `amount`, `category`, `description`. Immutable: `id`, `requestNo`, `requesterId`, `createdAt`, history.

### Check order — `POST /api/requests/:id/return`

1. authentication → `401 UNAUTHORIZED`
2. role `REVIEWER` → `403 FORBIDDEN`
3. existence → `404 NOT_FOUND`
4. **self-approval (BR-01)** `requesterId === currentUser.id` → `403 SELF_APPROVAL_NOT_ALLOWED`
5. **assignment (BR-05)** `assignedReviewerId !== currentUser.id` → `403 ACCESS_DENIED`
6. **state (BR-02)** `status !== PENDING` → `400 INVALID_STATE_TRANSITION`
7. **payload** trimmed comment 3–500 chars → `400 VALIDATION_ERROR`
8. transaction: conditional update `where: { id, status: PENDING }` + insert `RETURNED` history

### Check order — `POST /api/requests/:id/resubmit`

1. authentication → `401 UNAUTHORIZED`
2. existence → `404 NOT_FOUND`
3. **ownership (BR-03)** `requesterId !== currentUser.id` → `403 ACCESS_DENIED` (role is irrelevant: a REVIEWER may resubmit their own request)
4. **state (BR-02)** `status !== RETURNED` → `400 INVALID_STATE_TRANSITION`
5. **payload (BR-04)** revalidate all four fields → `400 VALIDATION_ERROR`
6. transaction: re-resolve reviewer via `resolveAssignedReviewerId` with the **new** amount/category and current time, conditional update `where: { id, status: RETURNED }` + insert `RESUBMITTED` history

> Self-approval is prevented structurally on resubmission because the resolver never returns the requester (BR-01 in CR-04). If no eligible reviewer exists the transaction fails with `500 INTERNAL_ERROR` and no fields change.

---

## 2. UI Specification

| Route / component | Access | States |
| :--- | :--- | :--- |
| `/reviewer/requests/:id` → **Return** action | assigned reviewer | comment textarea (3–500), validation message, submitting/disabled, success, error banner with code |
| `/requests/:id` → **Edit & Resubmit** form | owner, only when `RETURNED` | four editable fields pre-filled, validation, submitting, success, error banner |
| `/requests/:id` → read-only status | owner, any other state | shows `RETURNED` reason from latest `RETURNED` history entry and a "waiting for your revision" notice |

- Actions are rendered only for the eligible role/state, but the backend is the authority: a hidden button is never the only guard.
- After `RETURN`, the request disappears from the reviewer's pending queue; after `RESUBMIT` it reappears if the new assignment matches that reviewer.
- No optimistic status change; the UI re-renders from the API response.
- Client validation mirrors server rules near each field and in the comment box.

---

## 3. API Specification

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/requests/:id/return` | POST | `{ comment: string }` | `200 { data: { request, history } }` | 401; 403 `FORBIDDEN` / `SELF_APPROVAL_NOT_ALLOWED` / `ACCESS_DENIED`; 404; 400 `INVALID_STATE_TRANSITION`; 400 `VALIDATION_ERROR` |
| `/api/requests/:id/resubmit` | POST | `{ title, amount, category, description }` | `200 { data: { request, history } }` | 401; 403 `ACCESS_DENIED`; 404; 400 `INVALID_STATE_TRANSITION`; 400 `VALIDATION_ERROR` |

- `request` uses the standard serializer (2-decimal `amount` string, public actor profiles, current `assignedReviewer`).
- `history` is the newly appended row (`RETURNED` or `RESUBMITTED`) with actor, comment and timestamp.
- All errors use `{ error: { code, message, details? } }`; validation errors include a `details` array of field errors.

---

## 4. Data Specification (#77)

Additive migration only:

- `RequestStatus`: add `RETURNED`.
- `HistoryAction`: add `RETURNED`, `RESUBMITTED`.
- No new columns; no change to existing rows.
- Both endpoints run inside `prisma.$transaction` with a conditional `updateMany`/`update` guard; if the guard affects 0 rows, throw `INVALID_STATE_TRANSITION` and insert nothing.
- History rows remain append-only (BR-06); F-05 reads them unchanged.

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-14.1** | Assigned reviewer returns a `PENDING` request with a 3–500 char comment → `200`, status `RETURNED`, `updatedAt` changed, exactly one `RETURNED` history row with that actor/comment. |
| **AC-14.2** | Comment shorter than 3, longer than 500, or whitespace-only → `400 VALIDATION_ERROR` and no state/history change. |
| **AC-14.3** | A reviewer who owns the request cannot return it → `403 SELF_APPROVAL_NOT_ALLOWED`; an unrelated reviewer → `403 ACCESS_DENIED`; a `REQUESTER` → `403 FORBIDDEN`. Self-approval is checked before assignment. |
| **AC-14.4** | Owner edits and resubmits a `RETURNED` request → `200`, status back to `PENDING`, new field values persisted, exactly one `RESUBMITTED` history row, reviewer re-resolved by the current CR-04 rule. |
| **AC-14.5** | Resubmitting with invalid fields (`amount <= 0`, bad category, title/description boundaries) → `400 VALIDATION_ERROR`; the request stays `RETURNED` and no history is added. A non-owner resubmit → `403 ACCESS_DENIED`. |
| **AC-14.6** | Return/resubmit on `APPROVED`, `REJECTED`, or an already-resubmitted `PENDING` request → `400 INVALID_STATE_TRANSITION`; history is append-only and survives restart. |

---

## 6. Software Test Specification

| Test ID | AC | Level | Preconditions / Input | Action | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-15.1** | AC-14.1 | API/DB integration | `PENDING` request assigned to `t.reviewer` | `POST /return` as `t.reviewer` with valid comment | `200`, `RETURNED`, one `RETURNED` history row |
| **TEST-15.2** | AC-14.2 | API integration | comment 2 / 501 / whitespace chars | `POST /return` | `400 VALIDATION_ERROR`; no change |
| **TEST-15.3** | AC-14.3 | API integration | owner-reviewer, unrelated reviewer, requester | `POST /return` three times | `SELF_APPROVAL_NOT_ALLOWED`, `ACCESS_DENIED`, `FORBIDDEN` respectively |
| **TEST-15.4** | AC-14.4 | API/DB integration | `RETURNED` request; change amount 1500 → 7500 | `POST /resubmit` as owner | `200`, `PENDING`, values persisted, reviewer = escalated `manager.hybrid`, one `RESUBMITTED` row |
| **TEST-15.5** | AC-14.5 | API integration | invalid field values; non-owner cookie | `POST /resubmit` | `400 VALIDATION_ERROR` / `403 ACCESS_DENIED`; state unchanged |
| **TEST-15.6** | AC-14.6 | API/DB integration | decided request; return then resubmit then return again; restart | attempt illegal transitions; inspect history | `400 INVALID_STATE_TRANSITION`; old rows unchanged; new rows persisted |

Additional negative checks: unauthenticated calls → `401`; unknown id → `404`; no update/delete history route.

---

## 7. Definition of Done

- [ ] CR-05 reviewed/approved and contract v1.0 merged before implementation (Issue #69).
- [ ] Migration verified in #77 (`prisma migrate status` clean, no data loss).
- [ ] Both endpoints implemented with the exact §1 check order and transactional writes.
- [ ] Reviewer return UI + owner edit/resubmit UI implemented with all states.
- [ ] TEST-15.1..15.6 RED→GREEN; TEST-01..13, auth and CR-04 boundary regressions pass.
- [ ] Completion table row with AC, commit, executed results, release; evidence `E-D2-F06-*` captured.

## 8. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial contract: return/resubmit lifecycle, check orders, AC-14.1..14.6, TEST-15.1..15.6. | Deliverable 2 F-06; CR-05 dependency recorded. |
