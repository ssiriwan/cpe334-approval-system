# F-09 Completion Record — Search, Filter & Reporting (Sprint 3 progress)

> **Issue:** #72 · **Feature:** F-09 · **Contract:** `f-09-search-filter.md` (v1.0, #83)
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Status:** implemented and tested locally; awaiting teammate PR review

---

## 1. AC → Test → Result

| AC | Test ID | Test file / name | Level | Result | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AC-17.1 | TEST-18.1 | `server/tests/search-filter.test.ts` — status filter, own rows only, count | API integration | PASS | `75af0f5` |
| AC-17.2 | TEST-18.2 | `server/tests/search-filter.test.ts` — category + status ANDed | API integration | PASS | `75af0f5` |
| AC-17.3 | TEST-18.3 | `server/tests/search-filter.test.ts` — Bangkok day bounds, invalid/reversed dates | API integration | PASS | `75af0f5` |
| AC-17.4 | TEST-18.4 | `server/tests/search-filter.test.ts` — reviewer queue isolation + requester 403 | API integration | PASS | `75af0f5` |
| AC-17.5 | TEST-18.5 | `client/src/pages/Filters.test.tsx` — filter UI re-fetches with query, count, clear | UI component | PASS | UI commit |

## 2. TDD evidence

| Phase | Commit | Date | Output |
| :--- | :--- | :--- | :--- |
| RED (test only) | `bc89416` | 28 Nov 2026 | `1 failed file`, `4 failed` — filters ignored, `count` undefined |
| GREEN (backend) | `75af0f5` | 28 Nov 2026 | `1 passed file`, `4 passed` |
| UI + full regression | this branch head | 28 Nov 2026 | **12 files / 67 tests passed**; `npm run build` clean |

Evidence IDs: `E-D2-F09-RED` (`bc89416`), `E-D2-F09-GREEN` (`75af0f5`), `E-D2-F09-REG` (67-test summary).

## 3. Implementation summary

| Layer | Artifact | Notes |
| :--- | :--- | :--- |
| Validation | `server/src/validation/filters.ts` | zod parsing of `status`/`category`/`from`/`to`; Bangkok inclusive day bounds; `400 VALIDATION_ERROR` with field details. |
| Service | `request.service.ts`, `review.service.ts` | Optional filters combined with the base predicate via `AND`, so ownership/assignment can never be widened. Returns `{ requests, count }`. |
| Routes | `server/src/routes/requests.ts` | `/my` and `/pending` parse and forward query filters; role/existence guards unchanged. |
| UI | `client/src/components/RequestFilters.tsx`, `MyRequestsPage.tsx`, `PendingReviewsPage.tsx` | Shared filter bar, URL-synced state, result count, empty/error states; no client-only authorization. |

## 4. Notes
- Filter option labels are Title Case so existing table assertions (`getByText('PENDING')`) remain unambiguous; values are the uppercase enum strings.
- F-09 remains a **Sprint 3 progress** item in Part C; F-10/F-11 stay explicitly planned in `progress-and-remaining-work.md`.

## 5. Definition of Done checklist
- [x] Contract v1.0 committed before code (#83).
- [x] Server-side filters on both list endpoints; no schema change.
- [x] Filter UI with URL state, count, empty/error states.
- [x] TEST-18.1..18.5 RED→GREEN with real commits.
- [x] Full regression 60/60 and build green.
- [ ] Teammate substantive review and merge into `sprint-2-staging`.
- [ ] Accepted release recorded after merge (Part C).

## 6. Version history
| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial completion record with AC→test mapping and TDD evidence. | Deliverable 2 Part C evidence. |
