# Lab 7 - Impact Analysis for CR-04 (Part A)

> **Issue:** #57 · Pre-change commit `e695264` · Baseline `v0.1.0-sprint1` / `f35ad24`

## 1. Trace table

| Requirement / feature | SRS / SDS section | AC / STS ID | Code module | Impact and reason |
| :--- | :--- | :--- | :--- | :--- |
| FR-02 Request creation, BR-05 assignment | `docs/srs.md` BR-05; `docs/features.md` F-02; `docs/system-sds.md` §4.4 | AC-01, TEST-01 (`docs/sprints/sprint-1/feature-01.md` §3) | `server/src/services/request.service.ts` → `resolveAssignedReviewerId()`, `createRequest()` | **Direct change.** Assignment result changes for amount/time boundaries; TEST-01's EQUIPMENT small-amount expectation remains valid and is kept. |
| FR-06 Reviewer assignment / queue | `docs/srs.md` FR-06; `docs/features.md` F-04; `docs/system-sds.md` role matrix | AC-05, TEST-05 (`feature-02.md`) | `server/src/services/review.service.ts` → `listPendingReviews()`, `submitReview()` | **Indirect only.** These read `assignedReviewerId`; no code change. Regression test proves a reviewer sees only their queue after the new assignment. |
| BR-01 No self-approval | `docs/srs.md` BR-01; `docs/system-sds.md` review check order | AC-07, TEST-08 (`feature-02.md`) | `server/src/services/review.service.ts` | **Must remain unchanged.** Self-check runs before assignment; fallback in the new resolver must never produce `requesterId`. |
| BR-03 Data isolation | `docs/srs.md` BR-03 | AC-04, TEST-04 | `server/src/services/request.service.ts` detail path | N/A to assignment; regression TEST-04 retained to prove no cross-user disclosure. |
| BR-06 append-only history | `docs/srs.md` BR-06 | AC-11, TEST-13 | `createRequest()` history create; no update/delete endpoint | New rule uses the same single `SUBMITTED` insert in the same transaction; no new history type. |
| UI - New Request form | `docs/system-sds.md` §UI conventions | E2E-01 | `client/src/pages/NewRequestPage.tsx` | **No functional change.** The form never sends an assignment field. Add a UI error-state test only if the API rejects a forged field; no layout change. |
| Persistence / migration | `prisma/schema.prisma` | NFR-03 | `ApprovalRequest.assignedReviewerId` (existing nullable column, service enforces non-null) | **N/A** - no new column, no enum change, no migration. Historical requests keep their stored reviewer; the new rule applies only to newly created requests, so no backfill. |
| Deployment / config | `docs/labs/lab-05/deployment.md` | C-06 | `deploy.yml`, `deploy/release.sh` | **N/A** - no env var or secret change; the Lab 5 pipeline is reused unchanged. |

## 2. Callers and dependencies

- `createRequest()` is the only caller of `resolveAssignedReviewerId()`. It runs inside `prisma.$transaction`, so any new time calculation must be a pure function of `Date.now()` and `input.amount` - no extra DB query beyond the existing reviewer lookups.
- `requestNo` generation and the `SUBMITTED` history insert are untouched; the retry loop on unique conflicts re-runs the assignment resolver, which is deterministic for the same amount/time.
- Category validation stays `z.enum(['EQUIPMENT','TRAVEL','SOFTWARE','SUPPLIES'])`; no new category is accepted.

## 3. Time boundary definition

- Timezone: `Asia/Bangkok` (UTC+7), matching the existing SRS/SDS convention for dates and the Lab 5 `TZ`/`APP_TIMEZONE` discussion.
- Compute once per create attempt using an injected/testable helper so a test can fix "now" without sleeping.
- Boundaries are exact: `08:00` is **in hours**; `18:00` is **out of hours**; `5000.00` is normal; `5000.01` is escalated.

## 4. Behavior that must remain unchanged (regression guards)

| Preserved behavior | Guard |
| :--- | :--- |
| Invalid payloads → `400 VALIDATION_ERROR`, no row | existing `TEST-02` |
| Requester sees only own requests; cross-user → `403 ACCESS_DENIED` | existing `TEST-04` |
| Requester cannot review; unrelated reviewer → `403 ACCESS_DENIED` | existing `TEST-10`, `TEST-11` |
| Self-approval blocked before assignment | existing `TEST-08` |
| Decided request cannot be reviewed again; no new history | existing `TEST-09`, `TEST-13` |
| Amount stored as `Decimal(12,2)` string, history append-only | existing `TEST-01`, `TEST-13` |
| Full auth suite (cookie flags, logout, invalid credentials) | `tests/auth.test.ts` TEST-AUTH-01..05 |

## 5. Risks and mitigations

| Risk | Mitigation |
| :--- | :--- |
| After-hours test depends on the machine clock | Inject a `now: Date` parameter into the resolver; tests pass a fixed timestamp; production passes `new Date()`. |
| Escalation creates self-assignment for the hybrid reviewer | Explicit fallback check `reviewer.id !== requesterId` and the unchanged BR-01 backend guard. |
| Old expected result in TEST-01 becomes stale | TEST-01's small EQUIPMENT request is intentionally unchanged; new cases get new IDs (AC-01a/b/c), no old assertion is weakened. |
| Migration drift | None - no schema change; migrate status is verified unchanged in the regression record. |
