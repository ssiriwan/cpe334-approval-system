# Contract F-09 — Search, Filter & Reporting (Sprint 3 progress)

> **Feature ID:** F-09 · **Issue:** #72 · **Linked requirements:** FR-10, BR-03, BR-05, NFR-02, NFR-04
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Status:** v1.0 pre-implementation — awaiting teammate review
> **Artifact:** `docs/sprints/sprint-3/f-09-search-filter.md`
> **Dependencies:** F-03, F-04, F-05, F-06, F-07, F-08 (filters apply to all resulting states)

---

## 1. Feature SDS

F-09 is the **genuine Sprint 3 progress** included in the Deliverable 2 integrated candidate. It adds server-side filtering to the two existing list endpoints and a filter UI. Authorization is unchanged: filtering can never widen what a caller is allowed to see.

### Scope

- `GET /api/requests/my` gains optional query parameters: `status`, `category`, `from`, `to`.
- `GET /api/requests/pending` gains the same filters; it **still** requires `REVIEWER` and `assignedReviewerId = currentUser.id`.
- Filtering is additive to the existing base predicate:
  - `my`: `requesterId = currentUser.id` AND filters.
  - `pending`: `assignedReviewerId = currentUser.id` AND `status IN (PENDING, PENDING_STAGE2)` AND filters.
- `status` accepts the current enum values (`PENDING`, `RETURNED`, `PENDING_STAGE2`, `APPROVED`, `REJECTED`); invalid value → `400 VALIDATION_ERROR`.
- `category` accepts the BR-04 whitelist (`EQUIPMENT`, `TRAVEL`, `SOFTWARE`, `SUPPLIES`); invalid → `400 VALIDATION_ERROR`.
- `from`/`to` are ISO dates (`YYYY-MM-DD`); `from > to` → `400 VALIDATION_ERROR`; filtering uses `createdAt >= fromT00:00:00+07` and `createdAt <= toT23:59:59+07` (Asia/Bangkok) to avoid timezone drift.
- Combined filters are ANDed. Ordering stays `createdAt DESC, requestNo DESC` for `my` and `createdAt ASC` for `pending` (Sprint 1 compatibility).
- Response adds `count` alongside `requests`, so the UI can display a result count without a second query.
- No new endpoint, no schema change, no export/report file in this increment. Full reporting/aggregation remains planned for the final release.

### Check order

`authentication (401) → role (403 for pending) → query validation (400) → filtered query → 200`.

---

## 2. UI Specification

| Component | Access | States |
| :--- | :--- | :--- |
| `MyRequestsPage` filter bar | authenticated owner | chips/selects for status and category, date inputs from/to, Apply/Clear, result count, empty ("no requests match these filters"), loading, error banner |
| `PendingReviewsPage` filter bar | `REVIEWER` | same controls; empty state distinguishes "no assigned requests" from "no match" |

- Filters are reflected in the URL query string so a filtered view is reproducible in evidence.
- The server remains the source of truth: client-side filtering is not used to replace the API query.
- Clearing filters restores the unfiltered Sprint 1 view; no persisted user preference in this increment.

---

## 3. API Specification

| Endpoint | Method | Query | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/requests/my` | GET | `status?=&category?=&from?=&to?` | `200 { data: { requests: [...], count } }` | `401`; `400 VALIDATION_ERROR` |
| `/api/requests/pending` | GET | same | `200 { data: { requests: [...], count } }` | `401`; `403 FORBIDDEN`; `400 VALIDATION_ERROR` |

- Existing callers that omit query parameters receive the same rows as Sprint 1 plus the new `count` field (backwards-compatible).
- Error bodies use the standard envelope with `details` for field errors.

---

## 4. Data Specification

No schema change and no migration. Uses the existing indexes `(requesterId, createdAt)`, `(assignedReviewerId, status)`, `(status, createdAt)`. Query plans should remain index-friendly; no N+1 queries (NFR-02).

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-17.1** | `GET /api/requests/my?status=PENDING` returns only the caller's `PENDING` requests; another requester's rows never appear. |
| **AC-17.2** | `category` filter returns only matching rows; combined `status` + `category` filters are ANDed; `count` equals the array length. |
| **AC-17.3** | `from`/`to` filter by `createdAt` in Asia/Bangkok inclusive day bounds; invalid date or `from > to` → `400 VALIDATION_ERROR`. |
| **AC-17.4** | `GET /api/requests/pending?...` still returns only the current reviewer's assigned requests; filters cannot reveal requests assigned to another reviewer or already decided. Non-reviewer → `403 FORBIDDEN`. |
| **AC-17.5** | Filter UI displays result count, empty state and error banner; filtered URL is reproducible; Sprint 1 unfiltered behavior and ordering are unchanged. |

---

## 6. Software Test Specification

| Test ID | AC | Level | Preconditions / Input | Action | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-18.1** | AC-17.1 | API integration | Two requesters with mixed statuses | `GET /my?status=PENDING` as A | only A's `PENDING` rows; count matches |
| **TEST-18.2** | AC-17.2 | API integration | mixed categories/statuses | `GET /my?status=PENDING&category=SOFTWARE` | ANDed subset; count correct |
| **TEST-18.3** | AC-17.3 | API integration | requests on two dates; invalid date; reversed range | `GET /my?from=&to=` three times | correct date subset; `400 VALIDATION_ERROR` for invalid/reversed |
| **TEST-18.4** | AC-17.4 | API integration | requests assigned to R1/R2; requester cookie | `GET /pending?status=PENDING` as R1 and as requester | R1's assigned subset only; `403 FORBIDDEN` for requester |
| **TEST-18.5** | AC-17.5 | UI component / E2E | seeded data | apply/clear filters in UI | count + empty state + error shown; URL carries query; unfiltered order unchanged |

Additional regression: TEST-01..18, auth tests and CR-04 boundary tests must pass on the candidate commit.

---

## 7. Definition of Done

- [ ] Contract v1.0 reviewed and merged before implementation (Issue #72).
- [ ] Server-side filters implemented on both list endpoints; no schema change.
- [ ] Filter UI with URL state, count, empty/error states implemented.
- [ ] TEST-18.1..18.5 RED→GREEN; full regression passes; reviewed PR into `sprint-2-staging`.
- [ ] Status table marks F-09 **tested/accepted**, while F-10/F-11 remain **planned** with contracts.

## 8. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial F-09 contract for Deliverable 2 Part C implemented progress. | Need genuine tested Sprint 3 workflow without a migration. |
