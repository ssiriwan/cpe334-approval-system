# Lab 7 - Contract Revision v1.1 (Part A, before implementation)

> **Issue:** #57 · All edits below are **documentation only**; no implementation code is included in this change.
> **Sequence required by handout §3.1:** CR approved → contract revised → teammate reviews revised contract → RED test → implementation. Preserve the commit order in git history.

## 1. Version history

| Version | Date | Change | Author | Reviewer |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 (baseline) | 2026-11-04..11 | Sprint 1 contracts as accepted (`f35ad24`), BR-05 category-only assignment | Oum & T | teammate (PR #11) |
| **v1.1 (this CR)** | 2026-11-25 | BR-05 gains amount > 5000.00 THB and out-of-hours (08:00-18:00 ICT) escalation to `manager.hybrid`; client-supplied assignment field rejected; no schema change | T (drafter) | **PENDING - Oum must review before code** |

## 2. Revised SRS excerpt - BR-05 (replace baseline row)

> **BR-05 (v1.1) - Reviewer Assignment:** Every request must have an `assignedReviewerId`. For requests created at or after the maintenance release: (a) amounts **≤ 5,000.00 THB** submitted within **08:00-17:59 Asia/Bangkok** keep the Sprint 1 category mapping (`EQUIPMENT`/`TRAVEL` → `t.reviewer`; `SOFTWARE`/`SUPPLIES` → `manager.hybrid`); (b) amounts **> 5,000.00 THB** or submissions outside that window are escalated to `manager.hybrid`; (c) if the selected reviewer is the requester, the alternate eligible reviewer is used. Only the assigned reviewer may decide. A client-supplied `assignedReviewerId` is rejected with `400 VALIDATION_ERROR`. Failure behavior for an unassigned/unauthorized decision remains `403 ACCESS_DENIED`.

Unchanged: BR-01 (`403 SELF_APPROVAL_NOT_ALLOWED`, checked before assignment), BR-02 state lifecycle, BR-03 isolation, BR-04 payload limits, BR-06 append-only history, BR-07 decision validation.

## 3. Revised Feature SDS / STS excerpts

### F-02 Request Creation - §2.2 assignment step (v1.1)

`POST /api/requests` still validates `title`/`amount`/`category`/`description` with `.strict()`. After validation the service resolves the reviewer with `resolveAssignedReviewerId(category, amount, now)`:

```
primary = CATEGORY_PRIMARY_REVIEWER[category]
if amount > 5000.00 || hour(now in Asia/Bangkok) < 8 || hour >= 18:
    candidate = manager.hybrid@...
else:
    candidate = primary
if candidate is requester or not REVIEWER:
    candidate = CATEGORY_FALLBACK_REVIEWER[category], then any other REVIEWER
```
All of this remains inside the existing `prisma.$transaction` with the `SUBMITTED` history insert.

### F-04 Review Queue - unchanged

`GET /api/requests/pending` continues to filter by `assignedReviewerId = currentUser.id` and `status = PENDING`. No endpoint, role or error code changes.

### New STS rows (to be implemented in #58)

| Test ID | AC | Level | Precondition / input | Action | Expected |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-01a | AC-01a | API/DB | fixed now 10:00 ICT; EQUIPMENT `amount = 5000.00` | POST /api/requests | 201, reviewer = `t.reviewer` |
| TEST-01b | AC-01a | API/DB | same time; EQUIPMENT `amount = 5000.01` | POST /api/requests | 201, reviewer = `manager.hybrid` |
| TEST-01c | AC-01b | API/DB | fixed now 07:59 and 08:00 ICT, EQUIPMENT 100.00 | POST twice | 07:59 → `manager.hybrid`; 08:00 → `t.reviewer` |
| TEST-01d | AC-01b | API/DB | fixed now 17:59 and 18:00 ICT, EQUIPMENT 100.00 | POST twice | 17:59 → `t.reviewer`; 18:00 → `manager.hybrid` |
| TEST-01e | AC-01c | API | valid payload plus `assignedReviewerId` | POST /api/requests | 400 `VALIDATION_ERROR`, no row created |
| TEST-01f | AC-01 / BR-01 | API/DB | `manager.hybrid` creates EQUIPMENT 6000.00 | POST /api/requests | 201, reviewer = `t.reviewer` (fallback), never requester |

Existing `TEST-01` (small EQUIPMENT amount) is retained unchanged; it is now a regression guard for the normal path.

## 4. Teammate review of the revised contract (must precede code)

| Reviewer | Date | Specific check / finding | Status |
| :--- | :--- | :--- | :--- |
| Oum (`@ssiriwan`) | **NOT AVAILABLE before implementation** | The updated Lab 7 instruction removed instructor/TA approval; no separate pre-implementation teammate contract review took place. PR #63 contains both the contract-backed code and its peer review by @thhanabun. | **DISCLOSED SEQUENCE DEVIATION - see limitations** |

> Honest record: we do not invent a reviewer or date. The revised contract was committed in PR #61 and the implementation followed in PR #63; the peer review of PR #63 by @thhanabun checked the implemented behavior against this contract, but it occurred **after** the code commit. This deviation from handout §3.1 is disclosed in `README.md` and must be stated in Part D limitations of the PDF. Instructor/TA approval is **not available** under the updated lab and is recorded as such in `change-request.md` §5.
