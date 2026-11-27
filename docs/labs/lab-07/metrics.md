# Lab 7 - Engineering Metrics & Interpretation (Part C, 25 pts)

> **Team:** Oum (`67070501075`, `@ssiriwan`) & T (`67070501021`, `@thhanabun`)  
> **Repository:** `ssiriwan/cpe334-approval-system` (Theme 5 Workflow and Approval System)  
> **Evaluation Window:** 25 November 2026 – 27 November 2026  
> **Evaluated Commit:** `a5b963650bcbdd3178609c551634638e927a08f7` (`main` HEAD / Release v1.1.0)  
> **Deployed Service:** `https://sd3cdaba1-4d7hbszvwq-as.a.run.app` (Revision `sd3cdaba1-00012-skm`)

---

## 1. Five Verifiable Engineering Metrics

### Metric 1: Completed Issues
- **Scope:** Lab 7 lifecycle tracking issues on GitHub repository.
- **Observation Window:** 25 Nov 2026 16:32 UTC to 27 Nov 2026 10:25 UTC.
- **Value:** 4 Issues Total: 2 Closed / Resolved, 2 Documentation/Submission in progress. Resolution rate: 100% of functional issues.

| Issue ID | Title | Assignees | Status | Closed Via |
| :---: | :--- | :--- | :---: | :--- |
| **#57** | Approve change request and revise contract before code (Part A) | @thhanabun, @ssiriwan | CLOSED | PR #61 (`1ecda5b`, 2026-11-25 19:27 UTC) |
| **#58** | RED/GREEN implementation, regression and reviewed release (Part B) | @ssiriwan, @thhanabun | CLOSED | PR #63 (`cd6940a`, 2026-11-25 20:42:22 UTC) |
| **#59** | Five metrics and release readiness / retrospective (Parts C-D) | @ssiriwan, @thhanabun | CLOSED | This document & `readiness-retro.md` |
| **#60** | Assemble and submit `lab7_sec1_ปลวกแดง.pdf` (Submission) | @ssiriwan, @thhanabun | In Progress | Final PDF compilation & LEB2 package |

---

### Metric 2: Merged Pull Requests
- **Scope:** Pull requests opened, peer-reviewed, and merged for Lab 7.
- **Observation Window:** 25 Nov 2026 to 27 Nov 2026.
- **Value:** 3 Merged PRs, 0 Open, 0 Rejected. 100% non-author peer-reviewed, zero self-approvals.

| PR ID | Title | Base Branch | Author | Reviewer (Non-Author) | Merge Commit & Date |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **#61** | `docs(lab7): complete Part A plan for CR-04 dynamic reviewer assignment (#57)` | `lab7-staging` | @thhanabun | @ssiriwan (Approved) | `1ecda5b` (25 Nov 2026 18:43:23 UTC) |
| **#63** | `feat(requests): implement CR-04 dynamic reviewer assignment and pass full regression (#58)` | `lab7-staging` | @ssiriwan | @thhanabun (Changes Requested ➔ Approved) | `cd6940a` (25 Nov 2026 20:42 UTC) |
| **#64** | `release(lab7): CR-04 dynamic reviewer assignment to main (#58)` | `main` | @thhanabun | @ssiriwan (Approved) | `a5b9636` (27 Nov 2026 07:00 UTC) |

---

### Metric 3: Automated Test Results
- **Scope:** Full automated regression suite executed against release commit `a5b9636`.
- **Observation Date:** 27 Nov 2026 13:46 ICT.
- **Value:** 7 of 7 Test Files Passed (100%), 43 of 43 Tests Passed (100%), 0 Failed, 0 Skipped.

| Test File / Suite | Pass | Fail | Skip | Key Capabilities Covered | Evidence ID |
| :--- | :---: | :---: | :---: | :--- | :---: |
| `server/tests/requests.test.ts` | 14 | 0 | 0 | TEST-01..04, F-PB-01 regression, CR-04 boundary tests (TEST-01a..01f) | `EV-L7-GREEN-01` |
| `server/tests/review.test.ts` | 11 | 0 | 0 | TEST-05..13, reviewer queue, BR-01 self-approval guard, fake timer test | `EV-L7-GREEN-01` |
| `server/tests/auth.test.ts` | 5 | 0 | 0 | TEST-AUTH-01..05, JWT security, bcrypt cost 12, role isolation | `EV-L7-GREEN-01` |
| `server/tests/health.test.ts` | 2 | 0 | 0 | Service health status, running commit verification | `EV-L7-GREEN-01` |
| `client/src/pages/Requests.test.tsx` | 4 | 0 | 0 | NewRequestPage client validation, API error handling, F-PB-01 client guard | `EV-L7-GREEN-01` |
| `client/src/pages/Reviews.test.tsx` | 3 | 0 | 0 | PendingReviewsPage queue, empty states, review comment validation | `EV-L7-GREEN-01` |
| `client/src/App.test.tsx` | 1 | 0 | 0 | Unauthenticated landing and login routing | `EV-L7-GREEN-01` |
| **Total Test Count** | **43** | **0** | **0** | **100% Pass Rate across full stack** | `EV-L7-GREEN-01` |

---

### Metric 4: Defect Status & Definition of Resolved
- **Scope:** All reported and tracked defects across Sprint 1, Lab 6 UAT, and Lab 7 maintenance.
- **Definition of Resolved:** A defect is strictly classified as "Resolved" when:
  1. A failing automated regression test isolating the root cause is committed (RED).
  2. The bounded code fix passes the test without modifying expected business contracts (GREEN).
  3. The entire regression suite passes with 0 failures and 0 skipped tests.
  4. The code is peer-reviewed and approved by a non-author team member on a PR.
  5. The fix is verified in the deployed production environment (Google Cloud Run).
- **Current Defect Status:** **0 Open Defects, 2 Resolved Defects (100% Resolved).**

| Defect ID | Severity | Description | Origin | Resolution & Verification | Status |
| :---: | :---: | :--- | :---: | :--- | :---: |
| `F-PB-01` | Major | Large decimal amount `1234567.89` rejected by float check | Lab 6 UAT | Fixed in PR #51, guarded by `requests.test.ts` (line 15). Re-verified on Cloud Run. | **RESOLVED** |
| `F-PB-02` | Minor | 200k payload body-parser error handled as 500 instead of 4xx | Lab 6 UAT | Fixed in PR #51, guarded by central error handler. Re-verified on Cloud Run. | **RESOLVED** |
| `CR-04-DEF` | N/A | Zero defects introduced during CR-04 dynamic reviewer maintenance | Lab 7 | 6 automated tests + 2 live Cloud Run verifications passed cleanly. | **NONE** |

---

### Metric 5: CI Run Outcomes
- **Scope:** GitHub Actions CI Quality Gate (`ci-docker.yml`) and Deploy Pipeline (`deploy.yml`).
- **Observation Window:** 25 Nov 2026 to 27 Nov 2026.
- **Value:** 5 Runs Total: 5 Succeeded (100%), 0 Failed.

| Run ID | Workflow | Trigger / Event | Head Commit | Duration | Result | Evidence ID |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **45684755641** | `CI and Docker` | pull_request (PR #62) | `fede788` | 2m 12s | **SUCCESS** | `EV-L7-CI-01` |
| **45696750582** | `CI and Docker` | pull_request (PR #63) | `64d02c6` | 1m 43s | **SUCCESS** | `EV-L7-CI-02` |
| **45700099043** | `CI and Docker` | pull_request (PR #64) | `cd6940a` | 2m 11s | **SUCCESS** | `EV-L7-CI-03` |
| **45955478072** | `Deploy demo` | push to `main` (Release PR #64) | `a5b9636` | 4m 53s | **SUCCESS** | `EV-L7-DEPLOY-01` |
| **45955478081** | `CI and Docker` | push to `main` (Release PR #64) | `a5b9636` | 2m 15s | **SUCCESS** | `EV-L7-CI-04` |

---

## 2. Reconciling Data Points (Self-Checking Verification)

1. **Test Reconcile:** Total test count (43) reconciles exactly across 7 files: $14 + 11 + 5 + 2 + 4 + 3 + 1 = 43$.
2. **Issue/PR Reconcile:** Issue #57 resolved by PR #61; Issue #58 resolved by PR #63; Release PR #64 promotes both #57 and #58 to `main`.
3. **Commit/Deploy Reconcile:** Release PR #64 merge commit `a5b9636` matches GitHub Actions deploy run `45955478072` and matches live `GET /api/health` commit on Cloud Run revision `sd3cdaba1-00012-skm`.

---

## 3. Action-Oriented Interpretation (<= 100 words)

> **Word count: 82 words**
> 
> "All 43 tests and 5 CI runs succeeded (100% pass rate) with zero open defects across 3 merged PRs. However, maintaining out-of-hours business logic using local system time introduces the risk of host clock skew or unhandled timezone daylight transitions affecting reviewer escalation. To mitigate this risk, owner Oum (@ssiriwan) will implement an NTP drift health check in the monitoring probe and enforce UTC timestamps with explicit Asia/Bangkok conversion utilities across all scheduled tasks prior to the final Sprint 3 milestone."
