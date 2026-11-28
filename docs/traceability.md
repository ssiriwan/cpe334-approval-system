# Requirements Traceability Matrix

> **CPE 334 Deliverable 1 Part B — updated for Deliverable 2 Part D**
> **Project:** Corporate Expense & Purchase Request Approval System
> **Authors:** Oum (67070501075) & T (67070501021)
> **Status:** Candidate commit `50e3bf2` on `sprint-2-staging` (28 Nov 2026)
> **Verification run:** 14 test files / 75 tests passed, `npm run build` clean (see Part E evidence)

---

## 1. How to read this matrix

"Result" is **PASS** only when an executed test/measurement exists on the candidate. **PLANNED** means the contract (and possibly test IDs) exists but nothing has been executed. A later-sprint item is never marked as passing coverage for an earlier requirement.

---

## 2. Functional Requirements (FR)

| Req | Feature / responsibility | Sprint | AC / verification | Planned tests | Actual file / test | Result | Version |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| FR-01 | F-01 Auth & session | S1 | AC-AUTH-01..05 | TEST-AUTH-01..05 | `server/tests/auth.test.ts` (8 tests) | **PASS** | `v0.1.0-sprint1` |
| FR-02 | F-02 Request creation | S1 | AC-01, AC-02 | TEST-01, TEST-02, E2E-01 | `server/tests/requests.test.ts`, `e2e/` | **PASS** | `v0.1.0-sprint1` + CR-04 |
| FR-03 | F-03 My requests / isolation; F-09 filters | S1 / S3 progress | AC-03, AC-04, AC-17.1..17.3 | TEST-03, TEST-04, TEST-18.1..18.3 | `server/tests/requests.test.ts`, `server/tests/search-filter.test.ts`, `client/src/pages/Filters.test.tsx` | **PASS** | candidate `50e3bf2` |
| FR-04 | F-04 Queue & decision; F-07 stage queue | S1 / S2 | AC-05..AC-12, AC-15.2..15.4 | TEST-05..13, TEST-16.2..16.4 | `server/tests/review.test.ts`, `server/tests/multistage.test.ts` | **PASS** | candidate `50e3bf2` |
| FR-05 | F-05 History write + audit view | S1 write / S2 view | AC-06, AC-11, AC-13.1..13.4 | TEST-06, TEST-13, TEST-14.1..14.4 | `server/tests/review.test.ts`, `server/tests/history.test.ts` | **PASS** | #68 merged |
| FR-06 | F-02/F-04 assignment; CR-04; F-07 stage 2; F-10 admin | S1 / S2 / S3 | AC-01, AC-05, AC-09, AC-15.1, AC-18.4 | TEST-01, TEST-05, TEST-11, TEST-16.1, TEST-19.4 | `server/tests/requests.test.ts` (CR-04 TEST-01a..01f), `multistage.test.ts`; admin test **not run** | **PASS (assignment & stage 2)**; admin **PLANNED** | candidate `50e3bf2` |
| FR-07 | F-06 Return & resubmit | S2 | AC-14.1..14.6 | TEST-15.1..15.6 | `server/tests/return-resubmit.test.ts`, `docs/sprints/sprint-2/f-06-completion.md` | **PASS** | #69 merged |
| FR-08 | F-07 Two-stage approval | S2 | AC-15.1..15.6 | TEST-16.1..16.6 | `server/tests/multistage.test.ts`, `f-07-completion.md` | **PASS** | #70 merged |
| FR-09 | F-08 Attachments | S2 | AC-16.1..16.6 | TEST-17.1..17.6 | `server/tests/attachments.test.ts`, `client/src/components/AttachmentSection.test.tsx` | **PASS** | #71 merged |
| FR-10 | F-09 filters (partial) + reporting (planned) | S3 progress | AC-17.1..17.5 | TEST-18.1..18.5 | `server/tests/search-filter.test.ts`, `client/src/pages/Filters.test.tsx` | **PASS (filters)**; reporting **PLANNED** | #72 merged |
| FR-11 | F-10 Admin user/assignment | S3 | AC-18.1..18.6 | TEST-19.1..19.6 | contract `docs/sprints/sprint-3/f-10-admin-management.md` only | **PLANNED** | v1.0 contract |

---

## 3. Business Rules (BR)

| Rule | Responsibility | Sprint | AC / verification | Planned tests | Actual file / test | Result | Version |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| BR-01 No self-approval | F-04, F-06 return, F-07 both stages | S1/S2 | AC-07, AC-14.3, AC-15.5 | TEST-08, TEST-15.3, TEST-16.5 | `review.test.ts`, `return-resubmit.test.ts`, `multistage.test.ts` | **PASS** | candidate `50e3bf2` |
| BR-02 Valid lifecycle | F-02/F-04 + CR-05 F-06/F-07 | S1/S2 | AC-01, AC-08, AC-14.6, AC-15.6 | TEST-01, TEST-09, TEST-15.6, TEST-16.6 | `requests.test.ts`, `review.test.ts`, `return-resubmit.test.ts`, `multistage.test.ts` | **PASS** | candidate `50e3bf2` |
| BR-03 Data isolation | F-03, F-04, F-05, F-08, F-09 | S1/S2/S3 | AC-04, AC-09, AC-13.3, AC-16.5, AC-17.1/17.4 | TEST-04, TEST-11, TEST-14.3, TEST-17.5, TEST-18.1/18.4 | corresponding test files above | **PASS** | candidate `50e3bf2` |
| BR-04 Payload validation | F-02, F-06 resubmit | S1/S2 | AC-02, AC-14.5 | TEST-02, TEST-15.5 | `requests.test.ts`, `return-resubmit.test.ts` | **PASS** | candidate `50e3bf2` |
| BR-05 Assignment | F-02, F-04, F-07, F-10 | S1/S2/S3 | AC-01, AC-05, AC-09, AC-15.1, AC-18.4 | TEST-01, TEST-05, TEST-11, TEST-16.1, TEST-19.4 | `requests.test.ts`, `review.test.ts`, `multistage.test.ts`; admin **not run** | **PASS**; admin **PLANNED** | candidate `50e3bf2` |
| BR-06 Append-only history | F-04, F-05, F-06, F-07 | S1/S2 | AC-06, AC-11, AC-13.4, AC-14.6, AC-15.6 | TEST-06, TEST-13, TEST-14.4, TEST-15.6, TEST-16.6 | `review.test.ts`, `history.test.ts`, `return-resubmit.test.ts`, `multistage.test.ts` | **PASS** | candidate `50e3bf2` |
| BR-07 Decision validation | F-04, F-07 | S1/S2 | AC-12 | TEST-12 (S1), TEST-16 with valid decisions | `review.test.ts`, `multistage.test.ts` | **PASS** | candidate `50e3bf2` |

---

## 4. Non-Functional Requirements (NFR)

| NFR | Target | Responsibility | Verification | Actual evidence | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-01 | bcrypt 12, JWT HS256 8 h, httpOnly/SameSite, no secrets | System / F-01/F-04/F-11 | TEST-AUTH-01..05 + secret scan | `auth.test.ts`, CI quality gate; secret scan **not yet run** | **PASS (tests)**; secret scan **PLANNED (F-11)** |
| NFR-02 | p95 < 300 ms / 50 warm requests, no N+1 | F-09 lists + F-11 | autocannon/timing script | **not executed** | **PLANNED (F-11)** |
| NFR-03 | Survive restart; clean migrate + seed reproducible | F-02..F-05, #77 migration | restart test + `migrate status` + seed | `docs/sprints/sprint-2/migration-note.md`: status clean, 4 demo accounts, 43-test regression after migration | **PASS (migration/seed)**; restart recheck F-11 |
| NFR-04 | Invalid inputs → 4xx with code; no stack trace | All endpoints | negative/boundary tests | TEST-02/12, TEST-15.2/15.5, TEST-16.6, TEST-17.2, TEST-18.3 | **PASS** |
| NFR-05 | 100% AC → automated test | All | this matrix + test run | 75 tests passing; every executed AC has a test ID | **PASS for S1+S2+F-09** |
| NFR-06 | Docker/env/health | F-11 + CI | clean-clone build/run | `ci-docker.yml` runs on `sprint-2-staging` (#76); clean-clone recheck **planned** | **PARTIAL** (CI green; final clean-clone in F-11) |

---

## 5. AC → Test registry (Deliverable 2 slices)

| Feature | AC IDs | TEST IDs | Completion record |
| :--- | :--- | :--- | :--- |
| F-05 | AC-13.1..13.4 | TEST-14.1..14.4 | `docs/sprints/sprint-2/f-05-completion.md` |
| F-06 | AC-14.1..14.6 | TEST-15.1..15.6 | `docs/sprints/sprint-2/f-06-completion.md` |
| F-07 | AC-15.1..15.6 | TEST-16.1..16.6 | `docs/sprints/sprint-2/f-07-completion.md` |
| F-08 | AC-16.1..16.6 | TEST-17.1..17.6 | `docs/sprints/sprint-2/f-08-completion.md` |
| F-09 | AC-17.1..17.5 | TEST-18.1..18.5 | `docs/sprints/sprint-3/f-09-completion.md` |
| F-10 | AC-18.1..18.6 | TEST-19.1..19.6 (planned) | `docs/sprints/sprint-3/f-10-admin-management.md` |
| F-11 | AC-19.1..19.6 | TEST-20.1..20.6 (planned) | `docs/sprints/sprint-3/f-11-hardening-deployment.md` |

> Every AC above maps to exactly one TEST ID group; no orphan AC and no test ID without an AC.

---

## 6. Coverage gaps & honest disclosure

* **Executed:** FR-01..FR-09 (FR-10 filter part), BR-01..BR-07, NFR-04/05 and the tested parts of NFR-01/03/06.
* **Planned, not executed:** FR-10 reporting/aggregation, FR-11 admin, TEST-19.x, TEST-20.x, NFR performance p95, final clean-clone deploy check, final secret scan.
* **Known boundary:** F-07 supports at most two stages and rejects `RETURN` from `PENDING_STAGE2`; recorded in the F-07 contract and the remaining-work table, not silently omitted.
* No baseline requirement was deleted or moved without an approved change record below.

---

## 7. Approved Change Log

| Change ID | Date | Requirement / Feature | Change | Justification & impact | Approved by | Status |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| CR-01 | 4 Nov | Theme | Theme 5 selected | Student ID mapping; team agreement | Oum & T | Approved |
| CR-02 | 4 Nov | FR-02 / role matrix | REVIEWER may create requests | Needed to test BR-01 realistically | Oum & T | Approved |
| CR-03 | 4 Nov | BR-05 / F-02 | Category-based assignment | Deterministic assignment tests | Oum & T | Approved |
| CR-04 | 4 Nov | F-05 split | Write S1 / view S2 | Reduce S1 UI scope | Oum & T | Approved |
| **CR-04 (Lab 7)** | 25–27 Nov | BR-05, FR-06 | Dynamic assignment by amount/time; fallback when candidate is requester | Risk-based assignment; TEST-01a..01f; TA approval form `NOT AVAILABLE` under updated lab | Oum & T | Implemented & regression-tested |
| **CR-05** | 28 Nov | BR-02, BR-06, schema | `RETURNED`, `PENDING_STAGE2`, `RESUBMITTED`/`RETURNED` history | Required by F-06/F-07; additive migration `20261127183708...` | Oum & T | Merged (#84) |
| **F-07 v1.1** | 28 Nov | Seed / D-17 | Third reviewer `finance.reviewer` | Preserves CR-04 fallback (TEST-01f) while giving F-07 a distinct stage-2 reviewer | Oum & T | Merged (#87) |

---

## 8. Version History

| Version | Date | Change |
| :--- | :--- | :--- |
| v1.0 | 8 Nov 2026 | Sprint 1 baseline matrix (Deliverable 1). |
| v1.1 | 28 Nov 2026 | Extended to Sprint 2 + F-09 progress; actual commit/test evidence; approved changes CR-04/CR-05/F-07 v1.1. |
