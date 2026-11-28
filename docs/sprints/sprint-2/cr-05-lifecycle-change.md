# CR-05 — Approved Change Record: Request Lifecycle Extension

> **Issue:** #67 (contracts before code)
> **Status:** v1.0 proposed — awaiting teammate review; no implementation before approval
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Affected baseline:** BR-02, BR-06, `RequestStatus`, `HistoryAction`, SRS §Business Rules, SDS §Data model, traceability matrix

---

## 1. Why the change is needed

Sprint 1 froze the lifecycle at `PENDING → APPROVED | REJECTED`. Deliverable 2 requires **F-06 Return for Revision & Resubmission**, which needs a state where a reviewer sends a request back and the requester may edit and submit it again. A silent state change would break BR-02 and make the Sprint 1 traceability false, so this record is approved **before** any F-06 code is written.

## 2. Decision

| Item | Baseline (Sprint 1) | Approved change (Sprint 2) |
| :--- | :--- | :--- |
| States | `PENDING`, `APPROVED`, `REJECTED` | add `RETURNED`, `PENDING_STAGE2` |
| History actions | `SUBMITTED`, `APPROVED`, `REJECTED` | add `RETURNED`, `RESUBMITTED` |
| Transitions | `PENDING → APPROVED/REJECTED` | `PENDING → RETURNED` (reviewer); `RETURNED → PENDING` (requester resubmit); `PENDING → PENDING_STAGE2` (stage-1 approve, F-07); `PENDING_STAGE2 → APPROVED/REJECTED` (stage-2 decision, F-07) |
| Terminal states | `APPROVED`, `REJECTED` | unchanged — still terminal; any further decision is `400 INVALID_STATE_TRANSITION` |

### Explicitly NOT changed

- **BR-01 No Self-Approval** still applies to every decision action, including `RETURN` and both approval stages.
- **BR-03 data isolation** and **BR-05 assignment** keep the same semantics; the current assigned reviewer is the only actor who may `RETURN`.
- **BR-06 append-only history** is unchanged: every transition appends exactly one row; no update/delete endpoint is introduced.
- **CR-04 dynamic assignment** (Lab 7) remains the single source of assignment for creation **and** resubmission. F-07 stage 2 uses the distinct eligible reviewer defined in `f-07-multistage.md`.

## 3. Impact

| Artifact | Change required | Owner / issue |
| :--- | :--- | :--- |
| `prisma/schema.prisma` | enum values + `stage` + `Attachment` (one reviewed bundle) | #77 |
| `docs/srs.md` | FR-05/FR-06/FR-07/FR-08 text; BR-02/BR-06 revised | #73 |
| `docs/system-sds.md` | state diagram, role matrix, new endpoints, data model | #73 |
| `docs/features.md`, `docs/traceability.md` | AC-13..17 / TEST-14..18 rows | #73, #81 |
| Contracts | `f-06-return-resubmit.md`, `f-07-multistage.md` | #67 |
| Tests | preserve TEST-01..13 + CR-04 regression; add TEST-15/16 | #69, #70 |

## 4. Migration and rollback note (#77)

Migration is additive (`ALTER TYPE ... ADD VALUE`, new column with default, new table). It must not rewrite or delete Sprint 1 rows. Rollback = drop the new table/column and restore the original enum values in a new migration; document that enum value removal on PostgreSQL requires a type rebuild, so rollback is a documented procedure, not an automatic down-migration.

## 5. Approval

| Role | Name | Decision | Date |
| :--- | :--- | :--- | :--- |
| Author | T (67070501021) | Proposed | 28 Nov 2026 |
| Reviewer | Oum (67070501075) | Pending review | — |

> Implementation of F-06/F-07 may not begin until the reviewer row is filled and the contract PR is merged.

## 6. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial change record for BR-02/BR-06 extension. | Deliverable 2 requires revision + multi-stage flows. |
