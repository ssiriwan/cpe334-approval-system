# Lab 7 - Change Request CR-04 (Part A)

> **Issue:** #57 · **Status:** drafted, awaiting instructor/TA approval and teammate contract review
> **Lab 7 rule:** the change must alter behavior **already implemented in Sprint 1**, not add a new subsystem.

## 1. Identification

| Field | Value |
| :--- | :--- |
| CR ID | `CR-04` |
| Original Sprint 1 requirement | FR-02 / FR-06; **BR-05** - every request must have an assigned reviewer and only the assigned reviewer may decide |
| Accepted Sprint 1 baseline | tag `v0.1.0-sprint1`, commit `f35ad24ede42ed5522b20a68179473bf286744f3` (old behavior implemented and verified in Lab 1-6) |
| Actual pre-change implementation | commit `e695264` (`main` at the start of Lab 7; includes Labs 5-6 fixes and evidence) |
| Code location | `server/src/services/request.service.ts` → `CATEGORY_PRIMARY_REVIEWER`, `CATEGORY_FALLBACK_REVIEWER`, `resolveAssignedReviewerId()`; called from `createRequest()` |
| Contract locations | `docs/srs.md` §BR-05; `docs/traceability.md` BR-05 row; `docs/sprints/sprint-1/feature-01.md` AC-01/TEST-01 and §2.2 assignment note; `docs/system-sds.md` §4.4 mapping |
| Reason for change | Category-only assignment is deterministic but ignores amount and time-of-day. The new rule escalates high-value and after-hours requests to the hybrid reviewer so an experienced approver handles them, while preserving all access-control rules. |

## 2. Old rule -> new rule (exact)

**Old (currently correct, to be changed):**
1. `EQUIPMENT` / `TRAVEL` → primary `t.reviewer@cpe334.local`, fallback `manager.hybrid@cpe334.local`.
2. `SOFTWARE` / `SUPPLIES` → primary `manager.hybrid@cpe334.local`, fallback `t.reviewer@cpe334.local`.
3. If the mapped reviewer is the requester, use the alternate reviewer.
4. If no eligible reviewer exists, HTTP 500 `INTERNAL_ERROR`.

**New (approved change):**
1. Compute the category mapping exactly as before.
2. **Escalation boundary:** if `amount > 5000.00 THB` **OR** the submission time in Asia/Bangkok is `< 08:00` or `>= 18:00`, use `manager.hybrid@cpe334.local` as the reviewer regardless of category.
3. Normal requests (`amount <= 5000.00` and within 08:00-17:59 ICT) keep the old category result.
4. If the selected reviewer is the requester, fall back to `t.reviewer@cpe334.local` (or the other eligible reviewer) - **BR-01 self-approval remains blocked before assignment**.
5. A client-supplied `assignedReviewerId` (or a `requestedPriority`-like field) must be rejected with `400 VALIDATION_ERROR`; the create schema stays `.strict()`.
6. No schema change, no migration: the existing `assignedReviewerId` column and `SUBMITTED` history entry are reused.

## 3. Scope and boundaries

| Boundary / case | Expected |
| :--- | :--- |
| `amount = 5000.00` at 10:00 ICT, EQUIPMENT | old behavior retained → `t.reviewer` |
| `amount = 5000.01` at 10:00 ICT, EQUIPMENT | escalate → `manager.hybrid` |
| `amount = 100.00` at 07:59 ICT, SOFTWARE | escalate → `manager.hybrid` (same target, test proves boundary) |
| `amount = 100.00` at 08:00 ICT, EQUIPMENT | in-hours → `t.reviewer` |
| `amount = 100.00` at 18:00 ICT, EQUIPMENT | out-of-hours → `manager.hybrid` |
| `manager.hybrid` submits an EQUIPMENT request over 5000 | escalation target is the requester → fallback `t.reviewer`, no self-approval |
| Payload includes `assignedReviewerId` | `400 VALIDATION_ERROR`, no request created |
| Missing reviewer records | existing 500 behavior unchanged (documented, not a target of this CR) |

**Invalid cases:** negative/zero/over-max amount, bad category, short title, empty/long description continue to be rejected exactly as Sprint 1 (AC-02). No new accept path is introduced.

**Roles/ownership unchanged:** only authenticated `REQUESTER`/`REVIEWER` may create (AC-01); cross-user access stays `403 ACCESS_DENIED`; BR-01 self-approval check is still evaluated before assignment in the review endpoint.

## 4. Acceptance criteria (new/updated)

| ID | Criterion |
| :--- | :--- |
| AC-01 (rev v1.1) | Valid create returns 201 with `status = PENDING`, unique `requestNo`, `SUBMITTED` history and a reviewer resolved by the **new** amount/time rule above. |
| AC-01a | Amount boundary 5000.00/5000.01 behaves exactly as specified. |
| AC-01b | Time boundary 08:00 and 18:00 ICT behaves exactly as specified. |
| AC-01c | Client-supplied `assignedReviewerId` is rejected with `400 VALIDATION_ERROR`; no record is created. |
| AC-09 (unchanged) | Non-assigned reviewer still receives `403 ACCESS_DENIED`. |
| AC-07 (BR-01, unchanged) | A reviewer still cannot approve/reject their own request (`403 SELF_APPROVAL_NOT_ALLOWED`). |

## 5. Approval record

| Field | Value |
| :--- | :--- |
| Instructor/TA approver | **NOT AVAILABLE** - the updated Lab 7 instruction no longer provides TA/instructor approval for this change |
| Approval date | **N/A** - no approval channel was supplied |
| Approval evidence | Recorded honestly: team decision documented in Issue #57 and this file; **no approver/date is invented** |
| Teammate contract review | **PENDING** - see `contract-revision.md` §4; Oum must review the revised contract before the code commit |

> Honesty note: the original handout copy asked for a recorded instructor/TA approval, but the user reports that the updated Lab 7 instruction removed it. We therefore record **NOT AVAILABLE** rather than fabricating an approver or date. The teammate contract review remains in force because handout §3.1 still requires a reviewed contract before implementation; #58 must not start code until that review is committed.
