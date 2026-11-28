# Contract F-07 — Multi-Stage Approval

> **Feature ID:** F-07 · **Issue:** #70 · **Linked requirements:** FR-08, BR-01, BR-02, BR-05, BR-06, BR-07, NFR-04
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Status:** v1.0 pre-implementation — awaiting teammate review (depends on F-06/CR-05 and #77)
> **Artifact:** `docs/sprints/sprint-2/f-07-multistage.md`
> **Dependencies:** CR-05, F-06, migration bundle #77, Lab 7 CR-04 assignment rule

---

## 1. Feature SDS

High-value requests require two approvals. The feature is **bounded**: ordinary requests keep the Sprint 1/CR-04 single-stage behavior, so existing tests and evidence remain valid.

### Trigger and stage assignment

- Multi-stage applies when `amount > 5000.00 THB` **at creation or resubmission** (the same high-value boundary CR-04 already uses for escalation). Out-of-hours submissions continue to use CR-04 escalation but do **not** by themselves add a stage.
- `stage` is stored on `ApprovalRequest` (`Int`, default `1`). `stage = 1` while `PENDING`; `stage = 2` while `PENDING_STAGE2`.
- **Stage 1 reviewer** = the reviewer returned by the existing `resolveAssignedReviewerId` (CR-04). For high-value requests this is normally `manager.hybrid`.
- **Stage 2 reviewer** = the other eligible `REVIEWER` who is **different from both the requester and the stage-1 reviewer**. Seeded reviewers are `t.reviewer`, `manager.hybrid` and `finance.reviewer`, so a distinct stage-2 reviewer always exists — including when the requester is themselves a REVIEWER. For requester `oum.requester`: stage 1 `manager.hybrid`, stage 2 `t.reviewer`.
- Adding `finance.reviewer` (v1.1) preserves the Lab 7 CR-04 contract: a REVIEWER requester still gets a valid stage-1 fallback and may create high-value requests (TEST-01f). The third reviewer is only used for stage 2; CR-04's primary/fallback mapping is unchanged.
- Safety net: if no distinct stage-2 reviewer exists (data anomaly), creation/resubmission fails with `400 VALIDATION_ERROR` (`STAGE_REVIEWER_UNAVAILABLE`) and writes nothing. This is an explicit boundary, not a silent downgrade to single-stage.
- Stage-2 reviewer is persisted in `assignedReviewerId` when the request advances, so `GET /api/requests/pending` keeps working with no new queue endpoint: each reviewer sees only requests whose **current** stage is assigned to them.

### State lifecycle

```text
PENDING (stage 1) --APPROVE--> PENDING_STAGE2 (stage 2, assigned reviewer switched)
PENDING_STAGE2 --APPROVE--> APPROVED (terminal)
PENDING (any stage) --REJECT--> REJECTED (terminal)
PENDING --RETURN--> RETURNED (F-06, stage 1 only)
```

- `REJECT` is allowed from `PENDING` and `PENDING_STAGE2`.
- `RETURN` from `PENDING_STAGE2` is **not** in scope; it returns `400 INVALID_STATE_TRANSITION` (documented limitation).
- A second decision on `APPROVED`/`REJECTED` → `400 INVALID_STATE_TRANSITION`, no history row.

### Check order — `POST /api/requests/:id/review` (extended)

`authentication (401) → role REVIEWER (403) → existence (404) → self-approval BR-01 (403) → assignment BR-05 (403) → state BR-02 (400) → decision payload BR-07 (400) → transaction`.

The order is unchanged from Contract E2; only the allowed state set and the post-approve transition depend on `stage`/`amount`. Self-approval is re-evaluated at **stage 2** using the new `assignedReviewerId`.

### Transaction

- `APPROVE` at stage 1: conditional update `where: { id, status: PENDING }` → `PENDING_STAGE2`, set `stage = 2`, switch `assignedReviewerId` to stage-2 reviewer, append one `APPROVED` history row with `stage = 1`.
- `APPROVE` at stage 2: conditional update `where: { id, status: PENDING_STAGE2 }` → `APPROVED`, append one `APPROVED` history row with `stage = 2`.
- `REJECT`: conditional update → `REJECTED`, append one `REJECTED` row with the current stage.
- All writes occur in one `prisma.$transaction`; a failed guard rolls back everything.

---

## 2. UI Specification

| Route / component | Change | States |
| :--- | :--- | :--- |
| `PendingReviewsPage` | queue items gain a stage badge (`Stage 1/2`); still shows only current-assigned `PENDING` items | loading, empty, list, error |
| `ReviewDetailPage` | show current stage, which reviewer is assigned, and per-stage history entries; decision form unchanged | submitting, success, error banner with code |
| `RequestDetailPage` / F-05 timeline | show stage label on approve/reject rows | loading, 403/404, timeline |

- Stage badge uses text, not colour alone; accessible label included.
- After stage-1 approve, the requester sees `PENDING_STAGE2` ("awaiting second approval") and the stage-1 reviewer no longer sees the request in their queue.
- The stage-2 reviewer sees the request in their queue and may approve/reject; no optimistic status change.

---

## 3. API Specification

No new endpoint: the Sprint 1 review and queue endpoints are extended.

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `POST /api/requests/:id/review` | POST | `{ decision, comment? }` | `200 { data: { request, history } }` | as Contract E2 + `400 INVALID_STATE_TRANSITION` for `RETURN` from stage 2 |
| `GET /api/requests/pending` | GET | cookie | `200 { data: { requests: [...] } }` | `401`; `403 FORBIDDEN` |

- `request` serialization adds `stage: number` and keeps `assignedReviewer` as the **current-stage** reviewer.
- `history` adds `stage: number` so the F-05 timeline can label each decision.
- Creation/resubmission may return `400 VALIDATION_ERROR` with `details: [{ field: "stage", code: "STAGE_REVIEWER_UNAVAILABLE" }]`.

---

## 4. Data Specification (#77)

- `ApprovalRequest.stage Int @default(1)`.
- `RequestStatus`: add `PENDING_STAGE2` (CR-05).
- `ApprovalHistory.stage Int @default(1)` (or equivalent explicit stage field) so append-only rows record the stage at which the action happened.
- No destructive change; migration verified with `prisma migrate status`; rollback documented in CR-05.

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-15.1** | A request with `amount > 5000.00` is created/resubmitted with `stage = 1` and a distinct stage-2 reviewer recorded; an ordinary request stays single-stage and behaves exactly as in Sprint 1. |
| **AC-15.2** | Stage-1 assigned reviewer approves → `200`, status `PENDING_STAGE2`, `stage = 2`, `assignedReviewerId` switched to stage-2 reviewer, exactly one `APPROVED` history row with `stage = 1`. |
| **AC-15.3** | Stage-2 assigned reviewer approves → `200`, status `APPROVED` (terminal), one `APPROVED` history row with `stage = 2`; the request leaves both reviewers' queues. |
| **AC-15.4** | `REJECT` at stage 1 or stage 2 → `200`, status `REJECTED`, one `REJECTED` history row with the current stage; comment follows BR-07. |
| **AC-15.5** | Self-approval is blocked at **both** stages (`403 SELF_APPROVAL_NOT_ALLOWED` checked before assignment); an unrelated reviewer gets `403 ACCESS_DENIED`; a requester gets `403 FORBIDDEN`. |
| **AC-15.6** | A decision on a decided request or `RETURN` from `PENDING_STAGE2` → `400 INVALID_STATE_TRANSITION`; no history added. History is append-only and survives restart; the stage-2 assignment is persisted. |

---

## 6. Software Test Specification

| Test ID | AC | Level | Preconditions / Input | Action | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-16.1** | AC-15.1 | API/DB integration | Create amount 7500 as `oum.requester`; create 1500 as same | inspect rows | 7500 → stage 1 + distinct stage-2 reviewer; 1500 → ordinary single-stage; requester who is one of two reviewers → `VALIDATION_ERROR` |
| **TEST-16.2** | AC-15.2 | API/DB integration | Stage-1 `PENDING` request | `POST /review APPROVE` as stage-1 reviewer | `200`, `PENDING_STAGE2`, `stage=2`, reviewer switched, one stage-1 history row |
| **TEST-16.3** | AC-15.3 | API/DB integration | `PENDING_STAGE2` request | `POST /review APPROVE` as stage-2 reviewer | `200`, `APPROVED`, stage-2 history row, absent from queues |
| **TEST-16.4** | AC-15.4 | API/DB integration | Stage 1 and stage 2 `PENDING*` requests | `POST /review REJECT` with comment | `200`, `REJECTED`, one row with correct stage |
| **TEST-16.5** | AC-15.5 | API integration | owner-reviewer at each stage; unrelated reviewer; requester | `POST /review` | `SELF_APPROVAL_NOT_ALLOWED` at both stages; `ACCESS_DENIED`; `FORBIDDEN` |
| **TEST-16.6** | AC-15.6 | API/DB integration | `APPROVED` request; `PENDING_STAGE2` request | review again; `POST /return` | `400 INVALID_STATE_TRANSITION` for both; no history; old rows persist after restart |

Additional checks: regression TEST-08/09/11 and CR-04 boundary tests (5000 vs 5000.01, 08:00/18:00 Bangkok boundary) must still pass.

---

## 7. Definition of Done

- [ ] CR-05/F-06 contract reviewed; migration #77 applied and verified before implementation (Issue #70).
- [ ] Stage rules and check order implemented in the existing review service; no new queue endpoint.
- [ ] Stage badges and per-stage history rendered without colour-only signals.
- [ ] TEST-16.1..16.6 RED→GREEN; regressions including TEST-08/09/11 and CR-04 pass.
- [ ] Completion table + evidence `E-D2-F07-*`; single-stage behavior proven unchanged.

## 8. Known limitation (disclosed)

`RETURN` from `PENDING_STAGE2` and more than two stages are out of scope for Sprint 2; they are recorded in the remaining-work table (#72) rather than silently implemented.

## 9. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial bounded two-stage contract, stage reviewer rule, AC-15.1..15.6, TEST-16.1..16.6. | Deliverable 2 F-07; compatibility with CR-04 documented. |
| v1.1 | 28 Nov 2026 | Add third seeded reviewer (`finance.reviewer`) and clarify the stage-2 availability guard as a safety net. | Prevents regression of Lab 7 CR-04 fallback (TEST-01f) while keeping a distinct stage-2 reviewer. |
