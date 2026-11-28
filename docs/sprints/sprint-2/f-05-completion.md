# F-05 Completion Record — Approval History & Audit View

> **Issue:** #68 · **Feature:** F-05 · **Contract:** `f-05-audit-view.md` (v1.0, #83)
> **Owner:** Oum (67070501075) · **Reviewer:** T (67070501021)
> **Status:** implemented and tested locally; awaiting teammate PR review

---

## 1. AC → Test → Result

| AC | Test ID | Test file / name | Level | Result | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AC-13.1 | TEST-14.1 | `server/tests/history.test.ts` — owner sees full ordered history | API/DB integration | PASS | `25296cb` |
| AC-13.2 | TEST-14.2 | `server/tests/history.test.ts` — assigned reviewer sees same rows | API/DB integration | PASS | `25296cb` |
| AC-13.3 | TEST-14.3 | `server/tests/history.test.ts` — other/anonymous/unknown id denied | API integration | PASS | `25296cb` |
| AC-13.4 | TEST-14.4 | `server/tests/history.test.ts` — append-only, no write route, durable | API/DB integration | PASS | `25296cb` |
| UI (contract §2) | manual + component regression | `client/src/pages/RequestDetailPage.tsx` refresh control | UI | PASS (build + 8 test files) | `25296cb` |

## 2. TDD evidence

| Phase | Commit | Date | Output |
| :--- | :--- | :--- | :--- |
| RED (test only, endpoint absent) | `50692ed` | 28 Nov 2026 | `Test Files 1 failed (1)`, `Tests 4 failed (4)` — `GET /api/requests/:id/history` returned 404 |
| GREEN (implementation added) | `25296cb` | 28 Nov 2026 | `Test Files 1 passed (1)`, `Tests 4 passed (4)` |
| Full regression on GREEN | `25296cb` | 28 Nov 2026 | `Test Files 8 passed (8)`, `Tests 47 passed (47)`; `npm run build` succeeded |

Evidence IDs: `E-D2-F05-RED` (`50692ed` output), `E-D2-F05-GREEN` (`25296cb` output), `E-D2-F05-REG` (47-test summary).

## 3. Implementation summary

| Layer | Artifact | Notes |
| :--- | :--- | :--- |
| Service | `server/src/services/history.service.ts` | `getRequestHistory`: existence (404) → ownership/current assignment (403) → ordered `createdAt ASC, id ASC` rows with public actor fields only. |
| Route | `server/src/routes/requests.ts` | `GET /api/requests/:id/history` behind the router-wide `requireAuth`; read-only — no POST/PUT/DELETE route. |
| UI | `client/src/pages/RequestDetailPage.tsx` | Existing timeline retained; new **Refresh audit trail** button calls the dedicated endpoint with loading/disabled and error-banner states. No edit/delete control. |
| Data | none | Reuses `ApprovalHistory`; no migration in this feature (migration bundle tracked in #77). |

## 4. Verification notes

- `passwordHash` is absent from every serialized actor; error bodies contain no request fields.
- Reviewer authorization is re-evaluated from the current `assignedReviewerId`, so reassignment via F-06/F-07 will remove access without extra code.
- TEST-06/TEST-13 and all Sprint 1 / Lab 7 CR-04 tests remain unchanged and pass (47 total).

## 5. Definition of Done checklist

- [x] Contract v1.0 committed before code (#83).
- [x] Endpoint implemented with the exact check order.
- [x] UI timeline + refresh states, no edit controls.
- [x] TEST-14.1..14.4 RED→GREEN with real commits.
- [x] Full regression and build green on the GREEN commit.
- [ ] Teammate substantive review and merge into `sprint-2-staging`.
- [ ] Record accepted release in the completion table after merge (Part B).

## 6. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial completion record with AC→test mapping and TDD evidence. | Deliverable 2 Part B completion table. |
