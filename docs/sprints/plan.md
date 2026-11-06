# Three-Sprint Plan

> **Project:** CPE 334 - Workflow and Approval System (Theme 5)
> **Deliverable:** Deliverable 1 baseline plan
> **Owner:** T (67070501021)
> **Reviewer:** Oum (67070501075)
> **Related issue:** #2 - System-Level SDS and Three-Sprint Plan
> **Status:** v1.0 baseline, reviewed before Sprint 1 feature implementation

---

## 1. Planning Principles

- Deliver a working vertical slice in every sprint, not isolated layers.
- Keep Sprint 1 scope fixed: authentication, requester flow, reviewer flow, history write, and verification evidence.
- Use engineering contracts and acceptance criteria before implementation.
- Every feature PR is reviewed by the teammate; authors never approve or merge their own PR.
- Later-sprint work stays planned, not silently marked as complete.
- Scope changes require a recorded change request and updated traceability.

---

## 2. Sprint Overview

| Sprint | Target date | Goal | Features |
| :--- | :--- | :--- | :--- |
| Sprint 1 | 8 Nov 2026 (Deliverable 1) | Working approval vertical slice with enforced business rules and evidence. | F-01, F-02, F-03, F-04, F-05 (write) |
| Sprint 2 | 29 Nov 2026 (Deliverable 2) | Expand audit visibility, revision flow, multi-stage approval, and attachments. | F-05 (view), F-06, F-07, F-08 |
| Sprint 3 | 13 Dec 2026 (Final) | Search/reporting, admin management, hardening, regression, final release. | F-09, F-10, F-11 |

### 2.1 Feature dependency graph

```text
F-01 -> F-02 -> F-03
F-01/F-02 -> F-04 -> F-05
F-04 -> F-06 -> F-07
F-02 -> F-08
F-03/F-04/F-05 -> F-09
F-01/F-04 -> F-10
F-01..F-10 -> F-11
```

---

## 3. Sprint 1 - Deliverable 1 (8 Nov 2026)

### 3.1 Goal

Deliver a working vertical slice that supports login, request creation, requester-owned tracking, reviewer assignment, approve/reject decisions, append-only history, and backend enforcement of the Sprint 1 business rules, with automated tests and selected E2E evidence.

### 3.2 Features and scope

| Feature ID | Feature | Sprint 1 scope |
| :--- | :--- | :--- |
| F-01 | Auth and Session | Login, logout, current user, JWT httpOnly cookie, role loading, 401 behavior. |
| F-02 | Request Creation | Validate payload, generate `requestNo`, assign reviewer, persist `PENDING`, write `SUBMITTED` history. |
| F-03 | My Requests and Data Isolation | List own requests, open own detail/history, block cross-user access. |
| F-04 | Review Queue and Decision | Assigned pending queue, approve/reject with comment, state and assignment guards, self-approval guard. |
| F-05 | Approval History | Write append-only history entries for submit/approve/reject. Audit view is Sprint 2. |

### 3.3 Dependencies

- F-01 must precede F-02/F-03.
- F-02 must precede F-04.
- Schema and seed foundation from the repository scaffold must be available before F-01.
- Contract E0, E1, and E2 must be committed before their related implementation.

### 3.4 Issue mapping

| Issue | Work | Owner | Reviewer | Depends on |
| :--- | :--- | :--- | :--- | :--- |
| #1 | Part A/B baseline documents | Oum | T | - |
| #2 | Part C/D SDS and sprint plan | T | Oum | - |
| #3 | F-01 Auth foundation | T | Oum | #2 |
| #4 | F-02/F-03 Requester slice | Oum | T | #3 |
| #5 | F-04/F-05 Reviewer slice | T | Oum | #3, #4 |
| #6 | Part F verification and evidence | Oum + T | Oum + T | #3, #4, #5 |
| #7 | Release and Deliverable 1 PDF | Oum + T | Oum + T | #1-#6 |

### 3.5 Completion outcome

Sprint 1 is complete when:

- AC-AUTH-01..05 and AC-01..AC-12 pass.
- TEST-AUTH-01..05, TEST-01..TEST-13, and selected E2E-01..E2E-03 are implemented and passing on the submitted commit.
- All required Sprint 1 business rules are enforced by the backend, not only by the UI.
- Every acceptance criterion maps to at least one automated test or documented verification.
- The release PR from `sprint-1-staging` to `main` is reviewed and merged.
- Release tag `v0.1.0-sprint1` is created and recorded in the report.
- Parts A-F of the Deliverable 1 PDF are assembled with evidence.

### 3.6 Out of scope

- Attachments (F-08).
- Return-for-revision and resubmission (F-06).
- Multi-stage approval (F-07).
- Search, filtering, and reporting (F-09).
- Admin user/assignment management (F-10).
- Real payment, bank, email, SMS, or external notification integrations.
- Production hardening beyond the Sprint 1 security baseline.

### 3.7 Sprint 1 execution order and parallel work

Critical path:

```text
#2 -> #3 -> #4 -> #5 -> #6 -> #7
```

Safe parallel work:

- #1 (Oum) and #2 (T) start in parallel.
- While T implements #3, Oum can finish #1 and draft Contract E1 plus the requester UI shell for #4.
- While Oum implements #4, T can draft Contract E2 and reviewer UI/test scaffolding for #5.
- After #5, both teammates can split #6 evidence collection and #7 PDF assembly.
- Contracts and documentation can be written in parallel, but implementation must wait for the relevant contract and dependencies.

---

## 4. Sprint 2 - Deliverable 2 (29 Nov 2026)

### 4.1 Goal

Expand the approval workflow beyond the Sprint 1 vertical slice: expose history/audit, add return-for-revision and resubmission, support multi-stage approval, and add controlled attachments.

### 4.2 Features and scope

| Feature ID | Feature | Sprint 2 scope |
| :--- | :--- | :--- |
| F-05 | Approval History and Audit View | Read-only history/audit view built on Sprint 1 append-only records. |
| F-06 | Return for Revision and Resubmission | Reviewer returns a request; requester edits and resubmits under defined state rules. |
| F-07 | Multi-stage Approval | Multiple approval stages with per-stage decision and history. |
| F-08 | Attachments | File upload, storage, authorization, and access control for request attachments. |

### 4.3 Dependencies

- F-04 -> F-06 -> F-07.
- F-02 -> F-08.
- F-05 view depends on Sprint 1 history records.
- Contracts, acceptance criteria, and tests must be defined before each feature is implemented.

### 4.4 Completion outcome

- Sprint 2 contracts, acceptance criteria, STS, and DoD are complete.
- Features are integrated, tested, reviewed, and merged into `sprint-1-staging`.
- Updated traceability matrix records actual results, not planned status.
- A deployed candidate is available through the Lab 5 deployment pipeline.
- No Sprint 1 regression is introduced.

---

## 5. Sprint 3 - Final (13 Dec 2026; progress checkpoint 29 Nov 2026)

### 5.1 Goal

Complete the product and harden it for final release: search/filter/reporting, admin management, security/performance review, regression testing, UAT fixes, and final deployment.

### 5.2 Features and scope

| Feature ID | Feature | Sprint 3 scope |
| :--- | :--- | :--- |
| F-09 | Search, Filter, and Reporting | Search/filter requests and summarize by status, category, and amount. |
| F-10 | Admin User and Assignment Management | Admin user/role/reviewer assignment management. |
| F-11 | Hardening, Regression, and Deployment | Security/performance checks, regression, UAT re-test, final release, demo video. |

### 5.3 Dependencies

- F-05 -> F-09.
- F-01/F-04 -> F-10.
- F-01..F-10 -> F-11.

### 5.4 Completion outcome

- Final release is merged to `main` and deployed to the planned GCP environment.
- Complete traceability shows actual results for every feature.
- UAT/re-test records and regression results are documented.
- Final PDF and demo video are complete.
- Known limitations, failed/skipped tests, and technical debt are disclosed.

---

## 6. Exam-Period Finish Plan (1-11 Dec 2026)

- 29 Nov 2026: product should be substantially complete; Sprint 2 is complete and Sprint 3 has meaningful implemented progress.
- 1-11 Dec 2026: bounded fixes, integration, regression, UAT re-test, documentation, and video. Do not reserve main workflows for this period.
- 13 Dec 2026: final release, PDF, and demo video due.

### 6.1 Remaining-work template

| Feature/Defect ID | Status | Missing AC/verification | Owner | Dependency | Target date | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Example: F-09 | Planned | AC/test not yet written | TBD | F-05 | TBD | TBD |

Allowed status values: `Planned`, `In Progress`, `Implemented`, `Tested`, `Accepted`.

---

## 7. Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Scope creep into multi-stage, attachments, or admin work during Sprint 1 | Sprint 1 misses its deadline | Keep Sprint 1 scope fixed; record any change request and re-plan explicitly. |
| Auth or assignment bugs | Security and business-rule failures | Contract E0/E2, negative tests, teammate review, explicit check order. |
| E2E flakiness | Unreliable evidence | Use stable seeded data, limit E2E journeys, document retry/reset policy. |
| PostgreSQL setup differences across machines | Reproduction failures | Docker compose, README commands, migration/seed from a clean clone. |
| Exam-period schedule compression | Incomplete final release | Freeze scope on 29 Nov, maintain remaining-work list, check progress daily. |
| Secret leakage | Security and grading failure | `.env` ignored, `.env.example` only, secret scan before submission. |
| Planned work presented as complete | Loss of credibility and traceability | Mark later-sprint items as planned until they have real AC/test evidence. |

---

## 8. Change Control

Any change to sprint allocation, feature scope, acceptance criteria, or release timing must be recorded with:

| Field | Description |
| :--- | :--- |
| Change ID | Unique change identifier. |
| Date | Date of the change. |
| Requirement/Feature | Affected FR/BR/NFR/feature. |
| Change | What changed. |
| Reason | Why it changed. |
| Approved by | Both teammates. |
| Affected AC/TEST/SDS | Impacted artifacts. |
| Status | Proposed, approved, or rejected. |

Planned items must not be silently removed or moved to a later sprint.

---

## 9. Definition of Done Summary

- Required behavior is implemented and integrated across UI, API, and database.
- Every in-scope acceptance criterion has an automated test or documented verification.
- Required tests are enabled and pass on the submitted commit.
- Teammate review is complete; the author does not self-approve.
- Documentation and traceability match the code.
- Migration and seed run from a clean database.
- No real secrets or production data are committed.
- Known limitations and incomplete work are disclosed honestly.

---

## 10. Version History

| Version | Date | Change | Author | Reviewer |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 6 Nov 2026 | Initial three-sprint plan baseline. | T | Oum |
