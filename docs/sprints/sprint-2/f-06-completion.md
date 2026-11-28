# F-06 Completion Record — Return for Revision & Resubmission

> **Issue:** #69 · **Feature:** F-06 · **Contract:** `f-06-return-resubmit.md` (v1.0, #83)
> **Owner:** Oum (67070501075) · **Reviewer:** T (67070501021)
> **Status:** implemented and tested locally; awaiting teammate PR review

---

## 1. AC → Test → Result

| AC | Test ID | Test file / name | Level | Result | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AC-14.1 | TEST-15.1 | `server/tests/return-resubmit.test.ts` — assigned reviewer returns PENDING request with valid comment -> 200 RETURNED | API/DB integration | PASS | `1302efb` |
| AC-14.2 | TEST-15.2 | `server/tests/return-resubmit.test.ts` — comment boundary validation (<3, >500, whitespace) -> 400 VALIDATION_ERROR | API integration | PASS | `1302efb` |
| AC-14.3 | TEST-15.3 | `server/tests/return-resubmit.test.ts` — role, self-approval and assignment permissions for return | API integration | PASS | `1302efb` |
| AC-14.4 | TEST-15.4 | `server/tests/return-resubmit.test.ts` — owner resubmits RETURNED request with new fields -> 200 PENDING and re-assigns | API/DB integration | PASS | `1302efb` |
| AC-14.5 | TEST-15.5 | `server/tests/return-resubmit.test.ts` — invalid payload on resubmit -> 400; non-owner resubmit -> 403 | API integration | PASS | `1302efb` |
| AC-14.6 | TEST-15.6 | `server/tests/return-resubmit.test.ts` — invalid state transitions (return/resubmit on terminal or wrong states) -> 400 | API/DB integration | PASS | `1302efb` |
| UI (contract §2) | component regression | `client/src/pages/Reviews.test.tsx` Return action & `client/src/pages/Requests.test.tsx` Edit/Resubmit | UI | PASS (9 test files, 55 tests passed, build clean) | `86e37d9` |

---

## 2. TDD evidence

| Phase | Commit | Date | Output |
| :--- | :--- | :--- | :--- |
| RED (test only, endpoints absent) | `b54d01f` | 28 Nov 2026 | `Test Files 1 failed (1)`, `Tests 6 failed (6)` — 404 on missing endpoints |
| GREEN (backend implementation) | `1302efb` | 28 Nov 2026 | `Test Files 1 passed (1)`, `Tests 6 passed (6)` in 2.02s |
| UI & Full regression | `86e37d9` | 28 Nov 2026 | `Test Files 9 passed (9)`, `Tests 55 passed (55)`; `npm run build` succeeded (client + server) |

Evidence IDs: `E-D2-F06-RED` (`b54d01f` output), `E-D2-F06-GREEN` (`1302efb` output), `E-D2-F06-REG` (55-test summary).

---

## 3. Implementation summary

| Layer | Artifact | Notes |
| :--- | :--- | :--- |
| Service | `server/src/services/review.service.ts` | `returnRequest`: existence (404) → self-approval (403) → assignment (403) → state (400) → payload (400) → transaction conditional update `status: RETURNED` + `RETURNED` history. |
| Service | `server/src/services/request.service.ts` | `resubmitRequest`: existence (404) → ownership (403) → state (400) → payload (400) → transaction re-resolve reviewer (CR-04) + conditional update `status: PENDING` + `RESUBMITTED` history. |
| Routes | `server/src/routes/requests.ts` | `POST /api/requests/:id/return` (with `requireRole(Role.REVIEWER)`) and `POST /api/requests/:id/resubmit` (with `requireAuth`). |
| UI | `client/src/pages/ReviewDetailPage.tsx` | Added **Return for Revision** outcome option, mandatory 3–500 char comment, and direct API call with loading and error handling. |
| UI | `client/src/pages/RequestDetailPage.tsx` | Shows revision alert box with reviewer comment; renders **Edit & Resubmit** form for owner when status is `RETURNED` with pre-filled fields, validation, and re-submission flow. |
| Data | migration bundle #77 | Reuses `RequestStatus.RETURNED`, `HistoryAction.RETURNED`, and `HistoryAction.RESUBMITTED` from migration bundle `20261127183708_sprint2_lifecycle_and_attachments`. |

---

## 4. Verification notes

- **CR-04 dynamic re-assignment on resubmission:** Verified in TEST-15.4 that resubmitting with amount 7,500 THB re-routes the request from category reviewer to escalated reviewer (`manager.hybrid`).
- **Append-only history integrity:** In all return/resubmit operations, history rows remain immutable and appended within the same atomic transaction as the state transition.
- **Full regression suite:** 9 test files / 55 tests pass without any regression.

---

## 5. Definition of Done checklist

- [x] Contract v1.0 committed before code (#83).
- [x] Endpoints implemented with the exact contract check order.
- [x] Reviewer return UI + owner edit/resubmit UI implemented with all states.
- [x] TEST-15.1..15.6 RED→GREEN with real commits.
- [x] Full regression and build green on the GREEN commit.
- [ ] Teammate substantive review and merge into `sprint-2-staging`.
- [ ] Record accepted release in the completion table after merge (Part B).

---

## 6. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial completion record with AC→test mapping and TDD evidence. | Deliverable 2 Part B completion table. |
