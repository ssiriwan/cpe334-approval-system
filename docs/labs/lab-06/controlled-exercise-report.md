# Lab 6 - Controlled Defect Exercise: Independent UAT Report (UAT Team)

> **UAT Team / reporters:** Oum (`67070501075`) and T (`67070501021`), team ปลวกแดง
> **Developer Team / product owner:** team ผิงโหด (`yakginmomo/pangtao`)
> **Exercise build:** <https://exercise---pangtao-vowtduxdha-as.a.run.app/>
> **Version:** commit `345c320c7f9703261779e9d7767d065327410d5f`, Cloud Run revision `pangtao-00010-ges`
> **Normal release (unchanged):** `https://pangtao-vowtduxdha-as.a.run.app`, commit `64c98f4`
> **Execution date:** 24 Nov 2026, ICT (UTC+7)
> **Accounts:** same seeded ADMIN / USER-A / USER-B with the privately supplied password
> **Independence:** we did not inspect the Developer Team's repository, PRs, CI runs or the diff of
> commit `345c320` before sending this report; the defect below was found by black-box execution.

---

## 1. Scope executed

All eight cases from the Product Team's `uat.md` were re-run on the exercise build, plus additional
boundary/access probes. Raw observations are retained in `evidence/controlled-exercise-*.log` next to
this report (evidence IDs `E-EX-*`).

| Case | Focus | Result |
| :--- | :--- | :--- |
| UAT-01 | Login, role landing, logout, anonymous 401 | PASS |
| UAT-02 | Opening balances (Bank 50,000 / Wallet 2,000 / Card 3,500) + duplicate guard 409 | PASS |
| UAT-03 | Normal ledger journey: salary receipt, two payments, card repayment (satang-exact) | PASS |
| **UAT-04** | **Allocation / amount / date / target boundaries** | **FAIL - see CE-F-01** |
| UAT-05 | History list, transaction detail, income/expense summary | PASS |
| UAT-06 | Multi-tenant isolation: Bob probing Alice's transaction → 404 | PASS |
| UAT-07 | Admin segregation (admin→financial 403, user→admin 403) | PASS |
| UAT-08 | Self-disable guard 409, disable/re-enable, session revocation | PASS |
| Extra X1-X4 | Large valid amount 1234567.89, unknown field, summary from>to, opening on Income account | PASS |

One initial tenant-isolation probe returned a transport error because of a harness session-variable
mistake; it was re-run with a correct Bob session and returned `404 NOT_FOUND` as required. It is
**not** reported as a defect.

---

## 2. Finding `CE-F-01`

| Field | Content |
| :--- | :--- |
| **Issue ID** | `CE-F-01` |
| **Product / owner** | Pangtao - Developer Team ผิงโหด |
| **Reporter** | Oum & T, independent UAT Team ปลวกแดง, 24 Nov 2026 |
| **Tested version** | exercise build commit `345c320…`, revision `pangtao-00010-ges` |
| **Linked case / requirement** | `UAT-04` · BR-05 (allocation lines must sum exactly to the total), NFR-03 (balance invariant), AC-05.4 |
| **Preconditions / data** | Alice logged in; exercise DB reset; Bank Account and Dining Account exist and are active |
| **Steps to reproduce** | 1. Log in as `alice@example.test`.<br>2. `POST /api/v1/transactions` with `{ "kind":"PAYMENT", "accountId":"<Bank>", "txnDate":"2026-11-22", "totalAmount":10000, "memo":"EXERCISE allocation mismatch", "lines":[ {"targetAccountId":"<Dining>","amount":6000} ] }`.<br>3. Observe the response, then `GET /api/v1/accounts` and compare balances. |
| **Expected** | `400 INVALID_ALLOCATION_SUM` (sum 6,000 ≠ total 10,000 satang); **nothing saved**, balances unchanged (BR-05, NFR-03). |
| **Actual** | `HTTP 201` with transaction `12e22a03-9da4-4179-a442-4b51664d638a` saved; line amount 6,000 satang. Balances changed: Bank **−115,856,789 → −115,866,789** (−10,000, the full total) and Dining **123,601,839 → 123,607,839** (+6,000 only). The missing 4,000 satang is deducted from the source but never credited to any destination. |
| **Severity** | **Major** - a core Sprint 1 business rule and the exact-satang balance invariant fail; a user can create financially inconsistent records through the public API. Not Critical: no auth/data-leak or secret exposure. |
| **Defect vs enhancement** | Defect against explicitly specified behavior (BR-05/NFR-03), not a new feature request. |
| **Evidence** | `E-EX-04-allocation-mismatch` (first detection: total 50,000 / line 30,000 → 201, transaction `10a2c3c3-…`), `E-EX-CONFIRM` (above request/response and before/after balances), both in `evidence/controlled-exercise-*.log`. |

Other UAT-04 invalid inputs were correctly rejected with 400: total 0, future date, source as target,
receipt into a credit card, fractional satang, max+1 satang, and an invalid calendar date.

---

## 3. Handoff

This report is sent to the Developer Team through the agreed handoff channel. Per the exercise
instructions, we will wait for their fix (step 3) and then independently re-test the corrected build
(step 4) before recording the final controlled-exercise result. No acceptance decision is claimed here.
