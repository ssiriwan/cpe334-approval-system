# F-07 Completion Record — Multi-Stage Approval

> **Issue:** #70 · **Feature:** F-07 · **Contract:** `f-07-multistage.md` (v1.1, #83)
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Status:** implemented and tested locally; awaiting teammate PR review

---

## 1. AC → Test → Result

| AC | Test ID | Test file / name | Level | Result | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AC-15.1 | TEST-16.1 | `server/tests/multistage.test.ts` — high-value stage 1 + distinct stage-2 reviewer; ordinary stays single-stage | API/DB integration | PASS | `142bbe6` + UI commit |
| AC-15.2 | TEST-16.2 | `server/tests/multistage.test.ts` — stage-1 approve -> `PENDING_STAGE2`, stage 2, assignment switched | API/DB integration | PASS | `142bbe6` |
| AC-15.3 | TEST-16.3 | `server/tests/multistage.test.ts` — stage-2 approve -> `APPROVED`, queues cleared | API/DB integration | PASS | `142bbe6` |
| AC-15.4 | TEST-16.4 | `server/tests/multistage.test.ts` — reject at either stage records current stage | API/DB integration | PASS | `142bbe6` |
| AC-15.5 | TEST-16.5 | `server/tests/multistage.test.ts` — self-approval blocked at both stages; unrelated reviewer / requester denied | API integration | PASS | `142bbe6` |
| AC-15.6 | TEST-16.6 | `server/tests/multistage.test.ts` — illegal transitions rejected; history append-only | API/DB integration | PASS | `142bbe6` |
| UI (contract §2) | component test | `client/src/pages/Reviews.test.tsx` — `PENDING_STAGE2` badge, stage history, decision allowed | UI | PASS | UI commit |

## 2. TDD evidence

| Phase | Commit | Date | Output |
| :--- | :--- | :--- | :--- |
| RED (test only) | `9f76c59` | 28 Nov 2026 | `1 failed file`, `5 failed / 1 passed` — missing stage transitions and stage-2 guard |
| GREEN (backend) | `142bbe6` | 28 Nov 2026 | `1 passed file`, `6 passed` |
| UI + seed adjustment | this branch head | 28 Nov 2026 | **10 files / 62 tests passed**; `npm run build` succeeds |

Evidence IDs: `E-D2-F07-RED` (`9f76c59`), `E-D2-F07-GREEN` (`142bbe6`), `E-D2-F07-REG` (62-test summary).

## 3. Implementation summary

| Layer | Artifact | Notes |
| :--- | :--- | :--- |
| Service | `server/src/services/request.service.ts` | `resolveStage2ReviewerId(tx, requesterId, stage1ReviewerId)` selects a REVIEWER distinct from both; raises `400 VALIDATION_ERROR` (`STAGE_REVIEWER_UNAVAILABLE`) as a safety net. Used at creation/resubmission validation and at stage-1 approval. |
| Service | `server/src/services/review.service.ts` | Queue includes `PENDING_STAGE2`. `submitReview` accepts `PENDING`/`PENDING_STAGE2`, computes `currentStage`, writes `stage` on history, and on stage-1 approval conditionally updates to `PENDING_STAGE2` with `stage = 2` and the stage-2 reviewer in one transaction. BR-01 still runs before BR-05 at every stage. `returnRequest` only accepts `PENDING` (stage 2 return is an explicit limitation). |
| Seed | `prisma/seed.ts` | Adds `finance.reviewer@cpe334.local` as a third REVIEWER so a distinct stage-2 reviewer always exists, including when the requester is a reviewer. CR-04 primary/fallback mapping is unchanged — Lab 7 TEST-01f still passes. |
| UI | `PendingReviewsPage`, `ReviewDetailPage`, `RequestDetailPage`, `api.ts`, `StatusBadge` | Stage badge (`Stage n / 2`) for high-value requests, per-stage history labels, decision form available for `PENDING_STAGE2`; no client-only authorization. |

## 4. Compatibility checks

- Lab 7 CR-04 tests (`TEST-01a..01f`, including `>5000 -> manager.hybrid` and REVIEWER-request fallback) still pass — the third reviewer does not alter CR-04 resolution.
- F-05 audit view: a stage-1 approval switches `assignedReviewerId`, so the stage-2 reviewer (not stage 1) reads the history afterwards; `history.test.ts` TEST-14.2 was updated to that correct current assignee.
- History is append-only; two `APPROVED` rows (stage 1 + stage 2) are expected for a completed two-stage request.

## 5. Known limitations (disclosed)

- Maximum two stages; `RETURN` from `PENDING_STAGE2` is rejected with `400 INVALID_STATE_TRANSITION` (per contract v1.0). Both are recorded in the remaining-work table (#72), not silently implemented.
- Stage-2 assignment is derived deterministically from the seeded reviewers rather than stored in a new column; no extra migration beyond #77 was required.

## 6. Definition of Done checklist

- [x] Contract v1.0/v1.1 committed before code (#83).
- [x] Stage rules and check order implemented; no new queue endpoint.
- [x] Stage badge and per-stage history rendered; decision form valid at stage 2.
- [x] TEST-16.1..16.6 RED→GREEN with real commits.
- [x] Full regression 62/62 and build green; CR-04 preserved.
- [ ] Teammate substantive review and merge into `sprint-2-staging`.
- [ ] Accepted release recorded after merge (Part B).

## 7. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial completion record with AC→test mapping and TDD evidence. | Deliverable 2 Part B completion table. |
