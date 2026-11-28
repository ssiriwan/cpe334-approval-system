# Sprint 3 Progress & Remaining Work (Deliverable 2 Part C)

> **Issue:** #72 · **Checkpoint:** 28 Nov 2026 (Deliverable 2) · **Final due:** 13 Dec 2026
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)

---

## 1. Status table (honest status, no unexecuted check marked done)

| Feature | Scope | Status | Evidence on candidate | Owner |
| :--- | :--- | :--- | :--- | :--- |
| F-09 Search, filter & reporting | Server-side status/category/date filters on `my` + `pending`, result count, filter UI with URL state | **Implemented / Tested** (acceptance pending PR review) | TEST-18.1..18.5, 60/60 regression | T |
| F-10 Admin user & assignment management | `ADMIN` role, user list, role change, reassignment, audit | **Planned** — contract `f-10-admin-management.md` v1.0, no code | Contract only | Oum |
| F-11 Hardening, regression & deployment | NFR-01..06 measurement, final release | **Planned** — contract `f-11-hardening-deployment.md` v1.0, no code | Contract only | T |
| F-05 audit view (S2) | Read-only history endpoint + UI | Accepted in Sprint 2 | TEST-14.1..14.4 | Oum |
| F-06 return/resubmit (S2) | RETURNED lifecycle, CR-04 reassign | Accepted in Sprint 2 | TEST-15.1..15.6 | Oum |
| F-07 multi-stage (S2) | Two-stage high-value approval | **In review** (PR #87) | TEST-16.1..16.6 | T |

> "Planned" means the contract exists and no AC/TEST has been executed. It is **not** counted as passing coverage.

## 2. F-09 implemented scope (Part C working progress)

- `GET /api/requests/my?status=&category=&from=&to=` and the same filters on `GET /api/requests/pending`.
- Filters are combined with the base ownership/role predicate via `AND`, so a filter cannot widen access (BR-03/BR-05).
- `from`/`to` are inclusive Asia/Bangkok day bounds; invalid dates and reversed ranges return `400 VALIDATION_ERROR`.
- Response adds `count`; the shared `RequestFilters` component syncs state to the URL so a filtered view is reproducible.
- TEST-18.5 checks the UI actually re-fetches with the query string rather than filtering client-side.

## 3. Remaining-work table (to 13 Dec 2026)

| ID | Status | Missing AC / verification | Owner | Dependency | Next action | Target | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F-09 | Implemented / Tested | Acceptance after teammate PR review; merge to `main`; UAT re-test on deployed candidate | T | PR review | Substantive review + merge, then record release commit | 29 Nov 2026 | PR + merge commit |
| F-10 | Planned | AC-18.1..18.6, TEST-19.1..19.6 all unexecuted | Oum | F-01, F-04, F-07 | New reviewed migration for `ADMIN_*` history actions; implement + TDD | 6 Dec 2026 (contract + start) | Contract, then test output |
| F-11 | Planned | AC-19.1..19.6, TEST-20.1..20.6 all unexecuted | T | F-01..F-10 | Run NFR measurement scripts, secret scan, clean-clone check | 9–11 Dec 2026 | NFR evidence table |
| F-07 limitation | Implemented with boundary | `RETURN` from `PENDING_STAGE2` rejected; max two stages | T | F-06/F-07 | Decide in Sprint 3 whether to extend; requires approved change record | 6 Dec 2026 | Decision record |
| UAT re-test | Planned | Re-run Lab 6 UAT cases against integrated candidate (F-PB-01/02, CE-F-01, UATF-01) | Both | Release candidate | Execute + record results | 10 Dec 2026 | UAT result table |
| Final release | Planned | Final tag, deployed health commit match, PDF + video | Both | F-09..F-11 | Release PR, deploy, verify, assemble | 13 Dec 2026 | Tag + URL |

## 4. Exam-period plan (1–11 Dec 2026)

1. **1–5 Dec:** freeze scope; merge F-09, finish F-10 contract review; no new feature without a change record.
2. **6–9 Dec:** bounded implementation of F-10 (if time) and F-11 measurement; regressions every day.
3. **10–11 Dec:** UAT re-test, documentation, PDF assembly, video; fix only high-severity defects.
4. **13 Dec:** final release, submission. Main workflows are **not** reserved for the last two days.

## 5. Change control
Any scope/sprint move must be recorded in the change register (Part A of the PDF) with ID, reason, affected AC/TEST/SDS and approver. F-07 v1.1 (third seeded reviewer) is already recorded to protect CR-04 continuity.
