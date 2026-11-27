# Lab 7 - Test Plan for CR-04 (Part B preparation)

> **Issue:** #58 · Depends on #57 approval + contract review
> **Rule:** tests are written and run against the **pre-change commit `e695264`** before any implementation.

## 1. RED evidence plan

| Test ID | Command | Pre-change expected failure |
| :--- | :--- | :--- |
| TEST-01b | `npx vitest run tests/requests.test.ts -t "TEST-01b"` | expected reviewer `manager.hybrid` but received `t.reviewer` (amount 5000.01) |
| TEST-01d | same file, `-t "TEST-01d"` | 18:00 ICT case still assigned `t.reviewer` |
| TEST-01e | `-t "TEST-01e"` | payload with `assignedReviewerId` currently ... must be checked; if `.strict()` already rejects it, the test passes on old code and is recorded as a **preserved behavior guard**, not RED evidence |
| TEST-01f | `-t "TEST-01f"` | hybrid reviewer's large request may self-assign on old code |

Only failures caused by the **missing new behavior** count as RED. A compile error, a broken fixture or a test that always passes is invalid. Save the actual output and tested commit; keep the RED commit separate from the implementation commit.

## 2. GREEN and regression

| Step | Command / evidence |
| :--- | :--- |
| Implement bounded change | `resolveAssignedReviewerId()` signature adds `amount` and an injectable `now`; create path passes them. No schema/migration edit. |
| GREEN | same four named tests pass on the implementation commit; preserve setup/assertions and output |
| Existing regression | `npm test` (Vitest: auth + requests + review + health, 37 tests at Lab 6), plus client tests; record pass/fail/skip counts and commit |
| Review/integrate | feature branch → PR into `lab7-staging` with substantive teammate review → CI green → merge |
| Release | release PR `lab7-staging → main`, reviewed by non-author; deploy via Lab 5 pipeline; record revision |
| Post-deploy | create a 6000.00 request through the public API (expect `manager.hybrid`), then confirm an unrelated reviewer still gets `403 ACCESS_DENIED` and the requester still cannot self-approve (`403 SELF_APPROVAL_NOT_ALLOWED`) |

## 3. Evidence IDs to capture

| ID | Evidence |
| :--- | :--- |
| `EV-L7-RED-*` | failing test command, output, tested commit `e695264` |
| `EV-L7-GREEN-*` | passing output after implementation, tested commit |
| `EV-L7-DIFF` | actual `git diff` of the bounded service change |
| `EV-L7-REG` | full `npm test` summary with counts |
| `EV-L7-CI` | PR checks / run link |
| `EV-L7-REL` | release PR, merge commit, deployed revision, `/api/health` commit |
| `EV-L7-POST` | changed-behavior and preserved-behavior API responses on the live URL |

## 4. Honest constraints

- No test may be disabled or weakened to make the suite green.
- If an old expectation legitimately changes, version that revision explicitly (e.g. `TEST-01` note) while retaining tests for behavior that must stay unchanged.
- The instructor/TA approval and teammate contract review from #57 are prerequisites; no code commit exists yet.
