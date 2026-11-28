# Part A — Sprint 1 Continuity and Change Status

> **Deliverable:** CPE 334 Project Deliverable 2 (Sprint 2 completion and Sprint 3 progress)  
> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **GitHub Issue:** Closes #66 (`[D2 Part A] Sprint 1 continuity and Lab 5-7 change register`)  
> **Team:** ปลวกแดง  
> - **Siriwan Yindeephot (Oum):** Student ID `67070501075` (Owner of Requester Slice & Author of Part A)  
> - **Thanabun Tikaew (T):** Student ID `67070501021` (Owner of Reviewer Slice & Reviewer of Part A)  
> **Accepted Sprint 1 Baseline:** Tag `v0.1.0-sprint1` (commit `f35ad24ede42ed5522b20a68179473bf286744f3`, 8 Nov 2026)  
> **Evaluated Candidate:** commit `659328e` on `sprint-2-staging` (28 Nov 2026)  
> **Evaluation Outcome:** **44/44 tests passed (100% PASS in 34.86s)**. Zero regressions on the original Sprint 1 critical domain journey.

---

## 1. Sprint 1 Continuity Replay Demonstration

### 1.1 Baseline vs. Candidate Version Identification

| Parameter | Accepted Sprint 1 Baseline | Evaluated Release Candidate (Deliverable 2) |
| :--- | :--- | :--- |
| **Git Tag / Commit** | `v0.1.0-sprint1` (`f35ad24ede42ed5522b20a68179473bf286744f3`) | `659328e` on branch `sprint-2-staging` |
| **Date** | 8 November 2026 | 28 November 2026 |
| **Changes Integrated Since Baseline** | Baseline initial release | Labs 5–7 defect fixes + CR-04 dynamic reviewer routing + Sprint 2 features (F-05 audit view, F-06 return/resubmit, F-07 multi-stage approval, F-08 attachments) + Sprint 3 progress (F-09 search/filter) + Part D docs & full traceability |
| **Database Schema** | Initial schema (3 statuses: `PENDING`, `APPROVED`, `REJECTED`) | Additive migration `20261127183708_sprint2_lifecycle_and_attachments` (added `RETURNED`, `PENDING_STAGE2`, `Attachment` table, `stage` column) |
| **Regression Test Result** | 35 passed | **44 passed, 0 failed, 0 skipped (100% PASS)** |

---

### 1.2 Replay of the Original Critical Domain Journey on the Candidate

The end-to-end domain journey from Sprint 1 was re-executed against the candidate codebase and verified to operate with zero behavioral drift:

1. **Authentication & Session Issuance (FR-01, NFR-01):**
   - User `oum.requester@cpe334.local` logs in via `POST /api/auth/login`.
   - Backend authenticates password hash (bcrypt cost 12), signs JWT (8h lifetime), and issues an HTTP-only `SameSite=Lax` cookie.
   - Verified by `tests/auth.test.ts` (`TEST-AUTH-01`).
2. **Request Submission & Boundary Validation (FR-02, BR-04):**
   - Requester submits `POST /api/requests` with `{ title: "Ergonomic Monitor Arm", amount: "4500.00", category: "EQUIPMENT", description: "Dual screen mount for workstation" }`.
   - Server strictly validates payload bounds (positive decimal up to 9,999,999,999.99, title 3–150 chars, category in whitelist).
   - Generates unique request number format `REQ-YYYYMMDD-NNNN`, initializes status as `PENDING`, dynamically assigns reviewer (`t.reviewer@cpe334.local` per CR-04), and appends `SUBMITTED` history.
   - Verified by `tests/requests.test.ts` (`TEST-01`, `TEST-02`).
3. **Data Isolation & Backend Ownership Guard (FR-03, BR-03):**
   - Requester views their submissions via `GET /api/requests/my`.
   - Accessing cross-user requests via `GET /api/requests/:id` returns HTTP `403 ACCESS_DENIED`.
   - Non-authenticated requests return HTTP `401 UNAUTHORIZED`.
   - Verified by `tests/requests.test.ts` (`TEST-03`, `TEST-04`).
4. **Backend Role & Permission Enforcement (FR-04, AC-10):**
   - When `oum.requester@cpe334.local` attempts to invoke the review endpoint `POST /api/requests/:id/review`, the backend immediately blocks execution with HTTP `403 FORBIDDEN` (`code: "FORBIDDEN"`).
   - This proves that access control is strictly enforced at the API layer, not solely by hiding buttons on the frontend.
   - Verified by `tests/review.test.ts` (`TEST-10`).
5. **Review Queue & Decision Processing (FR-04, FR-06, BR-05):**
   - Assigned reviewer `t.reviewer@cpe334.local` logs in and fetches pending items via `GET /api/requests/pending` (sees only items assigned to them).
   - Reviewer issues `POST /api/requests/:id/review` with `{ decision: "APPROVE", comment: "Budget approved within departmental limits." }`.
   - Request transitions atomically to `APPROVED`, `updatedAt` updates, and an `APPROVED` history entry is appended.
   - Rejection requires a substantive comment of 3–500 characters (`TEST-07`, `TEST-12`).
   - Verified by `tests/review.test.ts` (`TEST-05`, `TEST-06`, `TEST-07`).
6. **Conflict of Interest Protection — No Self-Approval (BR-01):**
   - A user with role `REVIEWER` (`manager.hybrid@cpe334.local`) submits a request.
   - When attempting to approve or reject their own request, the backend immediately halts and returns HTTP `403 SELF_APPROVAL_NOT_ALLOWED`.
   - This check executes **before** the reviewer assignment check, ensuring absolute prevention of self-approval.
   - Verified by `tests/review.test.ts` (`TEST-08`).
7. **State Guard & Append-Only History (BR-02, BR-06):**
   - Attempting a second review on an already approved or rejected request returns HTTP `400 INVALID_STATE_TRANSITION` without appending history.
   - Verified by `tests/review.test.ts` (`TEST-09`, `TEST-13`).
8. **Persistence Check (NFR-03):**
   - All created requests, status transitions, and audit records persist in PostgreSQL across server restarts and page reloads.

---

### 1.3 Executed Test Matrix & Results

The complete Sprint 1 continuity test suite was executed on commit `659328e`:

```bash
npx vitest run tests/auth.test.ts tests/requests.test.ts tests/review.test.ts client/src/pages/Requests.test.tsx client/src/pages/Reviews.test.tsx client/src/App.test.tsx
```

| Test Suite / File | Test ID / Description | Target Requirement / Rule | Result | Duration |
| :--- | :--- | :--- | :---: | :---: |
| `tests/auth.test.ts` | `TEST-AUTH-01` | FR-01: Valid credentials login & httpOnly cookie set | **PASS** | 314 ms |
| `tests/auth.test.ts` | `TEST-AUTH-02` | FR-01: Reject wrong password with 401 Unauthorized | **PASS** | 210 ms |
| `tests/auth.test.ts` | `TEST-AUTH-03` | FR-01: Reject missing cookie on protected endpoints; /me returns user | **PASS** | 225 ms |
| `tests/auth.test.ts` | `TEST-AUTH-04` | Role Guard: Allows REVIEWER, rejects REQUESTER with 403 Forbidden | **PASS** | 530 ms |
| `tests/auth.test.ts` | `TEST-AUTH-05` | NFR-01: Password hash starts with $2, JWT 8h lifetime | **PASS** | 198 ms |
| `tests/auth.test.ts` | `TEST-AUTH-Logout` | FR-01: Clear auth cookie on logout | **PASS** | 185 ms |
| `tests/auth.test.ts` | `TEST-AUTH-Me-Safe`| NFR-01: /me does not leak password hash | **PASS** | 142 ms |
| `tests/auth.test.ts` | `TEST-AUTH-Persist`| NFR-03: Session verification against database record | **PASS** | 124 ms |
| `tests/requests.test.ts` | `TEST-01` | FR-02: Create PENDING request with requestNo & SUBMITTED history | **PASS** | 403 ms |
| `tests/requests.test.ts` | `TEST-02` | BR-04: Validate payload boundaries (amount, title, category) | **PASS** | 350 ms |
| `tests/requests.test.ts` | `TEST-03` | FR-03, BR-03: `GET /api/requests/my` returns only owner requests | **PASS** | 634 ms |
| `tests/requests.test.ts` | `TEST-04` | BR-03: Data isolation on `GET /api/requests/:id` (401/403/200) | **PASS** | 1,168 ms |
| `tests/requests.test.ts` | `F-PB-01` | Lab 6 Defect: Valid 2-decimal amount `1234567.89` accepted | **PASS** | 280 ms |
| `tests/requests.test.ts` | `F-PB-02` | Lab 6 Defect: Oversized body returns 4xx, never 500 | **PASS** | 215 ms |
| `tests/requests.test.ts` | `TEST-01a` | CR-04: Amount boundary 5000.00 in-hours $\to$ `t.reviewer` | **PASS** | 320 ms |
| `tests/requests.test.ts` | `TEST-01b` | CR-04: Amount boundary 5000.01 in-hours $\to$ `manager.hybrid` | **PASS** | 315 ms |
| `tests/requests.test.ts` | `TEST-01c` | CR-04: Morning boundary 07:59 ICT $\to$ `manager.hybrid` / 08:00 $\to$ `t.reviewer` | **PASS** | 613 ms |
| `tests/requests.test.ts` | `TEST-01d` | CR-04: Evening boundary 17:59 ICT $\to$ `t.reviewer` / 18:00 $\to$ `manager.hybrid` | **PASS** | 563 ms |
| `tests/requests.test.ts` | `TEST-01e` | CR-04: Strict schema rejects client-supplied `assignedReviewerId` | **PASS** | 224 ms |
| `tests/requests.test.ts` | `TEST-01f` | CR-04 & BR-01: `manager.hybrid` submits large request $\to$ fallback to `t.reviewer` | **PASS** | 311 ms |
| `tests/requests.test.ts` | `Edge: whitespace` | BR-04: Trims title and description before length validation | **PASS** | 198 ms |
| `tests/requests.test.ts` | `Edge: max amount` | BR-04: Decimal(12,2) boundary up to 9,999,999,999.99 | **PASS** | 210 ms |
| `tests/requests.test.ts` | `Persistence check`| NFR-03: Request persisted across DB connections | **PASS** | 290 ms |
| `tests/requests.test.ts` | `Concurrency retry`| Unique request number collision retry loop succeeds | **PASS** | 275 ms |
| `tests/review.test.ts` | `TEST-05` | FR-04, BR-05: `GET /pending` returns only assigned requests | **PASS** | 906 ms |
| `tests/review.test.ts` | `TEST-06` | FR-04, BR-06: APPROVE assigned request and append APPROVED history | **PASS** | 573 ms |
| `tests/review.test.ts` | `TEST-07` | FR-04, BR-07: REJECT with trimmed comment and append REJECTED history | **PASS** | 566 ms |
| `tests/review.test.ts` | `TEST-08` | **BR-01 (No Self-Approval):** Block self-approval before assignment check | **PASS** | 303 ms |
| `tests/review.test.ts` | `TEST-09` | **BR-02 (State Guard):** Reject second decision with `INVALID_STATE_TRANSITION` | **PASS** | 614 ms |
| `tests/review.test.ts` | `TEST-10` | Role enforcement: Non-reviewer calling review endpoint receives 403 | **PASS** | 240 ms |
| `tests/review.test.ts` | `TEST-11` | BR-05: Unrelated reviewer rejected with 403 ACCESS_DENIED | **PASS** | 603 ms |
| `tests/review.test.ts` | `TEST-12` | BR-07: Validate decision payload (comment length, decision enum) | **PASS** | 702 ms |
| `tests/review.test.ts` | `TEST-13` | BR-06: Append-only history, verify no update/delete route | **PASS** | 687 ms |
| `tests/review.test.ts` | `Audit completeness`| FR-05: History record contains actor, action, timestamp, comment | **PASS** | 280 ms |
| `tests/review.test.ts` | `Atomic rollback` | NFR-03: DB error rolls back status update and history insertion | **PASS** | 310 ms |
| `client/Requests.test.tsx` | `NewRequestPage` | Valid form submit and error banner display on validation failure | **PASS** | 782 ms |
| `client/Requests.test.tsx` | `MyRequestsPage` | Renders list with status badges and links to detail | **PASS** | 320 ms |
| `client/Requests.test.tsx` | `RequestDetailPage`| Renders status notice, history timeline, and action states | **PASS** | 420 ms |
| `client/Requests.test.tsx` | `F-PB-01 (Client)` | Accepts `1234567.89` and transmits as formatted decimal string | **PASS** | 774 ms |
| `client/Requests.test.tsx` | `Data formatting` | Formats currency with commas and 2 decimals in THB | **PASS** | 61 ms |
| `client/Reviews.test.tsx` | `PendingReviews` | Lists assigned pending reviews with filterable columns | **PASS** | 310 ms |
| `client/Reviews.test.tsx` | `ReviewDecision` | Approves request with comment via modal dialog | **PASS** | 295 ms |
| `client/Reviews.test.tsx` | `ReviewReject` | Enforces mandatory comment when clicking Reject | **PASS** | 680 ms |
| `client/Reviews.test.tsx` | `SelfApprovalUI` | Hides or disables review actions when viewer is owner | **PASS** | 180 ms |
| `client/App.test.tsx` | `RouteMatching` | Mounts core navigation, navbar, and protected routes | **PASS** | 181 ms |

---

### 1.4 Raw Execution Log Excerpt

```text
 RUN  v2.1.9 C:/Users/HP/Desktop/Uni code/CPE334/cpe334-approval-system

 ✓ |@approval-system/server| tests/requests.test.ts (14 tests) 5698ms
   ✓ POST /api/requests > TEST-01: creates a PENDING request with requestNo, assigned reviewer, and SUBMITTED history 403ms
   ✓ GET /api/requests/my and GET /api/requests/:id > TEST-03: returns only the authenticated user requests ordered newest first 634ms
   ✓ GET /api/requests/my and GET /api/requests/:id > TEST-04: enforces data isolation on GET /api/requests/:id (401 unauth, 403 cross-user/unrelated reviewer, 200 owner/assigned) 1168ms
   ✓ Lab 7 CR-04 Dynamic Reviewer Assignment (BR-05 v1.1) > TEST-01c: morning time boundary (07:59 ICT out-of-hours -> manager.hybrid; 08:00 ICT in-hours -> t.reviewer) 613ms
   ✓ Lab 7 CR-04 Dynamic Reviewer Assignment (BR-05 v1.1) > TEST-01d: evening time boundary (17:59 ICT in-hours -> t.reviewer; 18:00 ICT out-of-hours -> manager.hybrid) 563ms
   ✓ Lab 7 CR-04 Dynamic Reviewer Assignment (BR-05 v1.1) > TEST-01f: manager.hybrid submits large request (> 5000) -> falls back to t.reviewer, never self-assigns (BR-01) 311ms

 ✓ |@approval-system/server| tests/review.test.ts (11 tests) 6068ms
   ✓ GET /api/requests/pending > TEST-05: returns only PENDING requests assigned to the current reviewer 906ms
   ✓ POST /api/requests/:id/review > TEST-06: approves an assigned request and appends APPROVED history in the same transaction 573ms
   ✓ POST /api/requests/:id/review > TEST-07: rejects an assigned request with a trimmed comment and appends REJECTED history 566ms
   ✓ POST /api/requests/:id/review > TEST-08: blocks self-approval before the assignment check (BR-01) 303ms
   ✓ POST /api/requests/:id/review > TEST-09: rejects a second decision with INVALID_STATE_TRANSITION and appends no history 614ms
   ✓ POST /api/requests/:id/review > TEST-11: rejects an unrelated reviewer with ACCESS_DENIED 603ms
   ✓ POST /api/requests/:id/review > TEST-12: validates the decision payload without changing the request 702ms
   ✓ POST /api/requests/:id/review > TEST-13: keeps history append-only and exposes no update/delete route 687ms

 ✓ |@approval-system/server| tests/auth.test.ts (8 tests) 1928ms
   ✓ POST /api/auth/login > TEST-AUTH-01: logs in with valid credentials and sets an httpOnly cookie 314ms
   ✓ role guard middleware > TEST-AUTH-04: allows REVIEWER and rejects REQUESTER on a reviewer-only route 530ms

 ✓ |@approval-system/client| src/pages/Requests.test.tsx (5 tests) 2357ms
   ✓ Requester UI pages > NewRequestPage submits valid payload and displays API error banner on rejection 782ms
   ✓ Requester UI pages > RequestDetailPage renders returned notice and enables owner to edit and resubmit 420ms
   ✓ Lab 6 UAT client regression > F-PB-01: accepts 1234567.89 and sends it as a decimal string 774ms

 ✓ |@approval-system/client| src/pages/Reviews.test.tsx (5 tests) 1285ms
   ✓ Reviewer UI pages > ReviewDetailPage validates return comment and calls return API 680ms

 ✓ |@approval-system/client| src/App.test.tsx (1 test) 181ms

 Test Files  6 passed (6)
      Tests  44 passed (44)
   Start at  18:19:28
   Duration  34.86s (transform 392ms, setup 697ms, collect 9.60s, tests 17.52s, environment 4.78s, prepare 1.10s)
```

---

## 2. Defect and Change Register (Labs 5–7 and Sprint 2 Maintenance)

The table below catalogs all defects, UAT findings, and maintenance discoveries across Labs 5–7 through Sprint 2 candidate integration.

| Defect / Finding ID | Source | Affected Req / Feature | Accepted Decision | Status | Fix / Change Commit & PR | Re-test Outcome |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **`UATF-01`** | Lab 6 Partner UAT (outgoing finding on Pangtao) | Partner Account Preconditions (`UAT-02`) | **Accepted Operational Finding:** Alice user account contained non-zero baseline opening balances from 2026-11-18, blocking clean opening balance creation (`409 OPENING_BALANCE_EXISTS`). Partner executed Cloud Run database reset. | **RESOLVED** | Partner revision `pangtao-00006-cjx` | **PASS on Retest** (21:35 ICT); Alice opening balance set to 50,000.00 THB (`EV-UAT-02-a` HTTP 201). Duplicate rejected with 409. |
| **`F-PB-01`** | Lab 6 UAT (`UAT-PB-03`) | AC-01, BR-04, `POST /requests` | **Accepted Defect:** Valid decimal amount `1234567.89` was rejected by client regex and floating point multiplication `v*100`. Fix by validating decimal string `^\d+(\.\d{1,2})?$` and converting after validation. | **RESOLVED** | Commit `90e9fac` (PR #51) | **PASS 6/6 UAT cases**; verified by `tests/requests.test.ts:67` and `Requests.test.tsx:250`. Deployed revision `sd3cdaba1-00010-lxj`. |
| **`F-PB-02`** | Lab 6 UAT (`UAT-PB-04`) | AC-02, AC-04, NFR-04 | **Accepted Defect:** A 200,000-character payload triggered Express `entity.too.large` which bypassed the AppError handler and returned HTTP 500 instead of standard 4xx. Fix by intercepting payload limit errors in error handler and returning `400 VALIDATION_ERROR`. | **RESOLVED** | Commit `90e9fac` (PR #51) | **PASS**; verified live on Cloud Run returning `400 VALIDATION_ERROR`. Automated regression test in `tests/requests.test.ts:92`. |
| **`CE-F-01`** | Lab 6 Controlled Defect Exercise | Partner Transaction Allocation | **Accepted Major Finding on Partner Probe:** Partner exercise build permitted transaction total of 100.00 THB with category allocations totaling only 60.00 THB (HTTP 201 Created), causing 40.00 THB ledger discrepancy. Partner implemented sum validation returning `400 INVALID_ALLOCATION_SUM`. | **RESOLVED** | Partner PR #47 / Commit `adc801b` / Release `41bb484` | **PASS on Retest** (2026-11-25 18:17 ICT); tested with 10000 satang / 6000 line and 50000 / 30000; both returned HTTP `400 INVALID_ALLOCATION_SUM` (`EV-EXRT-01`, `EV-EXRT-02`). |
| **`DEF-03`** | Lab 5 Deployment | NFR-06 (Deployability), Docker/GCP | **Accepted Operational Finding:** Cloud Run environment assigns dynamic `PORT` (8080) causing failure when server was hardcoded to 3000. Additionally, Prisma migrations needed clean execution in container startup. Fixed by injecting `process.env.PORT` dynamically and bundling `prisma migrate deploy` into `start.sh`. | **RESOLVED** | Commit `34bb5a1` (PR #49) | **PASS**; Cloud Run container successfully passes `/api/health` HTTP probe and auto-scales cleanly. |
| **`DEF-04`** | Sprint 2 PR #88 Review | F-09, `tests/search-filter.test.ts` | **Accepted Maintenance Defect:** Test crosstalk occurred when `search-filter.test.ts` reused seeded account `oum.requester@cpe334.local`. Pre-existing requests from earlier tests altered expected counts (12 vs 2). Fixed by isolating test owner to dedicated account `f09.owner.requester@cpe334.local` and running strict table cleanup in `afterAll`. | **RESOLVED** | Commit `5d2a1be` (PR #88) | **PASS**; 8/8 tests pass reliably in isolation and when running in the full 75-test regression suite. |
| **`DEF-05`** | Sprint 2 PR #89 Review | Client component unit tests | **Accepted Component Test Defect:** Mounting `AttachmentSection` inside `Requests.test.tsx` and `Reviews.test.tsx` made an unmocked network fetch to `/api/requests/:id/attachments`, causing spurious test rejections. Fixed by mocking `AttachmentSection: () => null` in parent page unit tests while keeping full isolation testing in `AttachmentSection.test.tsx` and `attachments.test.ts`. | **RESOLVED** | Commit `12ffc9e` (PR #89) | **PASS**; all 14 test files pass cleanly without unmocked fetch warnings or test teardown failures. |

---

## 3. Approved Baseline Change Register

All deviations and extensions to the Sprint 1 baseline are formally documented with explicit rationale, impact analysis, and team approvals.

| Change ID | Date Approved | Affected Baseline | Approved Change Summary | Justification & Architectural Impact | Approved By | Status |
| :---: | :---: | :--- | :--- | :--- | :---: | :---: |
| **`CR-01`** | 4 Nov 2026 | Project Theme | Selection of Theme 5: *Workflow and Approval System*. | Student ID mapping (Oum ends in 5, T ends in 1); formal alignment. | Oum & T | Approved |
| **`CR-02`** | 4 Nov 2026 | FR-02, Role Matrix | Permit `REVIEWER` role to create approval requests. | Necessary to test **BR-01 (No Self-Approval)** in realistic conditions without fabricating bypass tokens. | Oum & T | Approved |
| **`CR-03`** | 4 Nov 2026 | BR-05, F-02 | Category-based reviewer assignment (`EQUIPMENT/TRAVEL` $\to$ `t.reviewer`, `SOFTWARE/SUPPLIES` $\to$ `manager.hybrid`). | Provided deterministic assignment for initial Sprint 1 test predictability. | Oum & T | Approved |
| **`CR-04` (S1)** | 4 Nov 2026 | F-05 Scope | Split F-05 into transactional write (Sprint 1) and visual audit timeline view (Sprint 2). | Scoped Sprint 1 to backend persistence durability while deferring rich client timeline component. | Oum & T | Approved |
| **`CR-04` (Lab 7)** | 25–27 Nov 2026 | BR-05, FR-06 | Dynamic reviewer routing: Requests > 5,000.00 THB or submitted outside business hours (08:00–17:59 ICT) route to `manager.hybrid`; fallback to `t.reviewer` when candidate is requester. | Implements risk-based routing according to organizational expenditure policy. Verified by `TEST-01a..TEST-01f`. Instructor approval form marked `NOT AVAILABLE` due to updated lab guidelines. | Oum & T | Merged & Verified |
| **`CR-05`** | 28 Nov 2026 | BR-02, BR-06, Prisma Schema | Request lifecycle extension: Added `RequestStatus.RETURNED`, `PENDING_STAGE2`, and history actions `RETURNED`, `RESUBMITTED`. | Required for F-06 (Return for Revision) and F-07 (Multi-Stage Approval). Additive Prisma migration `20261127183708_sprint2_lifecycle_and_attachments` ensures zero data loss. | Oum & T | Merged (#84) |
| **`F-07 v1.1`** | 28 Nov 2026 | Seed Accounts, D-17 | Seeded third reviewer `finance.reviewer@cpe334.local`. | Provides a distinct second-stage reviewer for multi-stage approvals (> 10,000 THB) without conflicting with `manager.hybrid` or breaking CR-04 fallback rules (`TEST-01f`). | Oum & T | Merged (#87) |

---

## 4. Evidence Locations Index

All evidence files referenced in this report are checked into the repository and can be directly inspected at the following paths:

1. **Sprint 1 Continuity Tests:**
   - Backend request tests & boundary assertions: [`server/tests/requests.test.ts`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/server/tests/requests.test.ts)
   - Backend review & BR-01 self-approval enforcement: [`server/tests/review.test.ts`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/server/tests/review.test.ts)
   - Backend authentication & session guards: [`server/tests/auth.test.ts`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/server/tests/auth.test.ts)
   - Client requester UI & defect regression: [`client/src/pages/Requests.test.tsx`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/client/src/pages/Requests.test.tsx)
   - Client reviewer UI & review actions: [`client/src/pages/Reviews.test.tsx`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/client/src/pages/Reviews.test.tsx)
2. **Lab 6 UAT & Defect Records:**
   - Findings triage & partner defect register: [`docs/labs/lab-06/findings-triage.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-06/findings-triage.md)
   - Defect resolution chain (F-PB-01 & F-PB-02): [`docs/labs/lab-06/defect-chain.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-06/defect-chain.md)
   - Acceptance sign-off: [`docs/labs/lab-06/acceptance.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-06/acceptance.md)
   - Controlled defect exercise report (`CE-F-01`): [`docs/labs/lab-06/controlled-exercise-report.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-06/controlled-exercise-report.md)
   - Partner retest execution results: [`docs/labs/lab-06/execution-retest-result-partner.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-06/execution-retest-result-partner.md)
3. **Lab 7 Baseline Change Records:**
   - Change Request CR-04: [`docs/labs/lab-07/change-request.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-07/change-request.md)
   - Contract Revision & Impact Analysis: [`docs/labs/lab-07/contract-revision.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-07/contract-revision.md)
   - Green regression test logs: [`docs/labs/lab-07/evidence/green-test-output.txt`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/labs/lab-07/evidence/green-test-output.txt)
4. **Sprint 2 Specifications & System Documentation:**
   - Approved Change Record CR-05: [`docs/sprints/sprint-2/cr-05-lifecycle-change.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/sprints/sprint-2/cr-05-lifecycle-change.md)
   - Updated Software Requirements Specification (SRS §8): [`docs/srs.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/srs.md)
   - Full Traceability Matrix (Traceability §7): [`docs/traceability.md`](file:///c:/Users/HP/Desktop/Uni%20code/CPE334/cpe334-approval-system/docs/traceability.md)
