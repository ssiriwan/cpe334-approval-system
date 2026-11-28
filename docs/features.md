# Feature Inventory

> **CPE 334 Deliverable 1 — Part B (Feature Inventory); updated for Deliverable 2**
> **Project:** Corporate Expense & Purchase Request Approval System
> **Theme:** Theme 5 — Workflow and Approval System
> **Authors:** Oum (67070501075) & T (67070501021)
> **Status:** Sprint 1 released; Sprint 2 increment merged; Sprint 3 progress on candidate (28 Nov 2026)

---

## 1. Feature Inventory Table

| Feature ID | Feature Name | Related Requirements | Dependencies | Planned Sprint | Verification (actual IDs / status) | Deliverable 2 status |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **F-01** | Authentication & Session Management | FR-01, NFR-01, NFR-04 | — | S1 | TEST-AUTH-01..05 | Accepted (`v0.1.0-sprint1`) |
| **F-02** | Request Creation & Validation | FR-02, BR-04, BR-05, NFR-04 | F-01 | S1 | TEST-01, TEST-02, E2E-01; CR-04 TEST-01a..01f | Accepted; CR-04 added in Lab 7 |
| **F-03** | My Requests & Data Isolation | FR-03, BR-03, NFR-03 | F-01, F-02 | S1 | TEST-03, TEST-04, E2E-01 | Accepted; filters added by F-09 |
| **F-04** | Review Queue & Decision Workflow | FR-04, FR-06, BR-01, BR-02, BR-05, BR-06, BR-07 | F-01, F-02 | S1 | TEST-05..TEST-13, E2E-02/03 | Accepted; queue extended by F-07 |
| **F-05** | Approval History & Audit View | FR-05, BR-06, NFR-03 | F-04 | S1 write / S2 view | TEST-06, TEST-13; **TEST-14.1..14.4** | S2 view implemented/tested (#68) |
| **F-06** | Return for Revision & Resubmission | FR-07, BR-02, BR-06 | F-04, CR-05 | S2 | **TEST-15.1..15.6** (RED `b54d01f` → GREEN `1302efb`) | Implemented/tested (#69) |
| **F-07** | Multi-Stage Approval Workflow | FR-08, BR-01, BR-02, BR-05, BR-06 | F-06, CR-05, CR-04 | S2 | **TEST-16.1..16.6** (RED `9f76c59` → GREEN `142bbe6`) | Implemented/tested (#70) |
| **F-08** | Document & Receipt Attachments | FR-09, BR-03, NFR-01, NFR-04, NFR-06 | F-02, F-07 | S2 | **TEST-17.1..17.6** (RED `7e9d98b` → GREEN `8ae1271`) | Implemented/tested (#71) |
| **F-09** | Search, Filter & Expense Reporting | FR-10, BR-03, BR-05, NFR-02 | F-03, F-04, F-05 | S3 progress | **TEST-18.1..18.5** (RED `bc89416` → GREEN `75af0f5`); reporting still planned | Filter implemented/tested (#72); aggregation planned |
| **F-10** | Admin User & Assignment Management | FR-11, BR-05 | F-01, F-04, F-07 | S3 | TEST-19.1..19.6 **planned** | Contract only, no code |
| **F-11** | System Hardening, Regression & Deployment | NFR-01..NFR-06 | F-01..F-10 | S3 | TEST-20.1..20.6 **planned** | Contract only, no code |

> F-05 split (write in S1 / view in S2) and CR-04 (Lab 7) are approved changes recorded in `docs/srs.md` §8 and `docs/traceability.md` §3.

---

## 2. Feature Dependency Graph

```text
F-01 (Auth & Session)
  ├──► F-02 (Request Creation) ──► F-03 (My Requests & Isolation)
  │        │                            │
  │        ├──► F-04 (Review Queue & Decision) ──► F-05 (History write S1 / view S2)
  │        │        │                                   │
  │        │        ├──► F-06 (Return/Resubmit) ──► F-07 (Two-stage) ──► F-08 (Attachments auth)
  │        │        │
  │        │        └──► F-09 (Filters; S3 progress) ──┐
  │        └──► F-08 (storage/limits)                  ├──► F-11 (Hardening & deploy)
  └──► F-10 (Admin; S3 planned) ────────────────────────┘
```

**Cross-cutting constraints**
- CR-04 dynamic assignment applies to F-02, F-06 (resubmit) and F-07 (stage-1 reviewer).
- BR-01 self-approval is enforced at every decision/return stage regardless of role.
- BR-06 append-only history is shared by F-04, F-05, F-06 and F-07.

---

## 3. Sprint Allocation Summary

* **Sprint 1 (Deliverable 1 — released `v0.1.0-sprint1`):** F-01, F-02, F-03, F-04, F-05 (write).
* **Sprint 2 (Deliverable 2 candidate):** F-05 (view), F-06, F-07, F-08 + additive migration bundle + third reviewer seed.
* **Sprint 3 (Final — 13 Dec 2026):**
  * F-09 filter part **implemented and tested** in this candidate.
  * F-10 and F-11 **planned** with contracts in `docs/sprints/sprint-3/`; the full remaining-work table is in `docs/sprints/sprint-3/progress-and-remaining-work.md`.

---

## 4. Coverage Gaps (honest)

* FR-10 reporting/aggregation is only partially covered by F-09 filters; the summarisation endpoint is planned for the final release.
* FR-11 admin management is planned with AC/TEST but no executed verification.
* NFR performance measurement (p95) is not yet executed on the candidate; F-11 owns it.
* No requirement was silently deleted or moved to a later sprint without a change record.
