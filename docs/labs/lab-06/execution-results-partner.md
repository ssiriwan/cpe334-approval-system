# Lab 6 - Independent Execution Results (Partner Product: Pangtao)

> **UAT Team (Testers):** ปลวกแดง — Thanabun Tikaew (`67070501021`, `@thhanabun`) and Siriwan (`67070501075`, `@ssiriwan`)
> **Product Team:** ผิงโหด — Chawin Chinpraditsuk (`67070501012`) and Supichaya (`67070501087`)
> **Product / Repo:** `yakginmomo/pangtao` (Theme 7: Personal Money and Expense Logging System)
> **Execution Date/Time:** 22 November 2026, 16:15–16:25 (Bangkok / Asia/Bangkok time)
> **Cases document executed:** `docs/labs/lab-06/uat.md` (from partner's repo `yakginmomo/pangtao`, branch `chore/lab6-uat-doc` / PR #41)
> **Handout coverage:** Lab 6 §3.2 (Part B complete) and §3.3 (Part C outgoing complete; incoming findings pending partner UAT report on our app)

---

## 1. Release Under Test & Environment Verification

| Item | Expected (from partner `uat.md`) | Verified Actual | Status |
|---|---|---|:---:|
| Public URL | `https://pangtao-vowtduxdha-as.a.run.app` | `https://pangtao-vowtduxdha-as.a.run.app` | MATCH |
| Version Marker | Subtitle: "Log in to your Pangtao account (67)" | Verified on `/login`: `Log in to your Pangtao account (67)` | MATCH (`EV-UAT-00`) |
| Git Commit | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (PR #40) | Partner confirmed release `64c98f4` | MATCH |
| Service Revision | `pangtao-00006-cjx` | Image digest `sha256:0c479894775aa1ac88e0aff965f1e59af94436193f422541f44397f7cb78ff45` | MATCH |
| Health Status | `GET /api/v1/health` → `{"status":"ok"}` | Returned HTTP 200 `{"status":"ok"}` | PASS (`EV-PRE-01`) |

*Version Note:* The health endpoint (`/api/v1/health`) does not expose a git commit in its JSON response. Therefore, the tested version is corroborated together by the login subtitle marker "(67)", the partner-confirmed commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, and Cloud Run revision `pangtao-00006-cjx` (image digest `sha256:0c479894775aa1ac88e0aff965f1e59af94436193f422541f44397f7cb78ff45`).

---

## 2. Case Execution Summary (Part B, Section 7.1)

| Case | Tester (name, team) | Date and time (Bangkok) | Version checked (subtitle "(67)", commit) | Inputs used | Actual result | Failed or blocked step | PASS / FAIL / BLOCKED | Evidence IDs |
|---|---|---|---|---|---|---|:---:|---|
| **UAT-01** | Siriwan (ปลวกแดง) | 2026-11-22 16:15 | Subtitle "(67)", commit `64c98f4` | Wrong pass, unknown email, valid Alice/Admin credentials, anonymous API calls | Subtitle (67) confirmed; generic 401 on wrong pass & unknown email; Alice lands on `/`, Admin lands on `/admin/users`; logout revokes cookie; anonymous API calls all return 401 UNAUTHENTICATED. | None | **PASS** | `EV-UAT-00`, `EV-UAT-01-a`, `EV-UAT-01-b` |
| **UAT-02** | Thanabun (ปลวกแดง) | 2026-11-22 16:17 | Subtitle "(67)", commit `64c98f4` | Bank 50,000, Wallet 2,000, Card 3,500; negative amount, future date, duplicate attempt | Database was NOT reset before handoff (§4.1): Alice already had opening balances from 2026-11-18. UI has no "Set opening balance" button. API correctly rejected duplicate opening with `409 OPENING_BALANCE_EXISTS`, negative amount with `400 VALIDATION_ERROR`, and future date with `400 FUTURE_DATE_NOT_ALLOWED`. | Step 3 (cannot set opening balance because it already exists) | **BLOCKED** | `EV-UAT-02-a`, `EV-UAT-02-b` |
| **UAT-03** | Siriwan (ปลวกแดง) | 2026-11-22 16:18 | Subtitle "(67)", commit `64c98f4` | Receipt Bank 30,500 (Salary 30k + Int 500); Payment Wallet 2,250.50 (Dining 450.50 + Groceries 1,800); Payment Card 1,200 (Elec 700 + Telecom 500); Payment Bank 4,000 (Card repay) | All 4 transactions created (HTTP 201). Wallet went negative (-2,123.50 ฿) with Negative balance label (D-02). Card charge counted as expense; Card repayment did NOT count as expense (BR-09). Month Net delta: +27,049.50 ฿. | None | **PASS** | `EV-UAT-03-a`, `EV-UAT-03-b`, `EV-UAT-03-c` |
| **UAT-04** | Thanabun (ปลวกแดง) | 2026-11-22 16:19 | Subtitle "(67)", commit `64c98f4` | Allocation mismatch (500 vs 300); Total = 0; Future date; Card to Bank; Wallet to Wallet; Receipt to Card | All invalid operations rejected with 400: `INVALID_ALLOCATION_SUM`, `VALIDATION_ERROR`, `FUTURE_DATE_NOT_ALLOWED`, `INVALID_TARGET_ACCOUNT`, `INVALID_SOURCE_ACCOUNT`. Protected state and balances remained completely unchanged. | None | **PASS** | `EV-UAT-04-a`, `EV-UAT-04-b` |
| **UAT-05** | Siriwan (ปลวกแดง) | 2026-11-22 16:20 | Subtitle "(67)", commit `64c98f4` | Re-login Alice; view History; view detail of row 4; summary presets; custom invalid date range | Balances persisted after re-login. History shows newest-first transactions with correct split lines. Row 4 detail (`00ad577a...`) verified. Invalid custom range returns `400 VALIDATION_ERROR` ("from must not be later than to"). Default API summary returns integer satang. | None | **PASS** | `EV-UAT-05-a`, `EV-UAT-05-b` |
| **UAT-06** | Thanabun (ปลวกแดง) | 2026-11-22 16:22 | Subtitle "(67)", commit `64c98f4` | Bob Wallet opening 0; Bob receipt 1,000 (Salary); Alice probes Bob transaction `0bd009c2...` | Bob starts with clean 0.00 balances. Bob sets 0 opening balance and saves 1,000.00 receipt (`201`). Alice accessing Bob's transaction via `/api/v1/transactions/<bob-id>` receives `404 NOT_FOUND` (IDOR prevented, D-03). Alice's summary and history completely isolated. | None | **PASS** | `EV-UAT-06-a`, `EV-UAT-06-b` |
| **UAT-07** | Siriwan (ปลวกแดง) | 2026-11-22 16:23 | Subtitle "(67)", commit `64c98f4` | Admin login; Admin accesses `/accounts`, `/transactions`, `/summary`; Alice accesses `/admin/users` | Admin lands strictly on `/admin/users` (no financial links). Admin calling `/accounts`, `/transactions`, or `/summary/income-expense` gets `403 FORBIDDEN` (BR-02). Alice calling `/admin/users` gets `403 FORBIDDEN`. Admin users list contains 3 users with no financial fields. | None | **PASS** | `EV-UAT-07-a`, `EV-UAT-07-b` |
| **UAT-08** | Thanabun (ปลวกแดง) | 2026-11-22 16:24 | Subtitle "(67)", commit `64c98f4` | Admin disables self; Admin disables Bob; Bob active session; Bob login; Admin re-enables Bob; Bob re-login | Admin disabling self gets `409 CANNOT_DISABLE_SELF` (BR-03). Disabling Bob succeeds (`200`). Bob's existing active session is revoked immediately with `401 UNAUTHENTICATED` (BR-13). Bob login rejected with generic 401. Admin re-enables Bob. Bob logs in successfully; data and Wallet 1,000.00 ฿ intact. | None | **PASS** | `EV-UAT-08-a`, `EV-UAT-08-b` |

---

## 3. Figures Seen at Key Checkpoints (Part B Table)

| Checkpoint | Wallet | Bank Account | Credit Card (Debt) | Income (Month) | Expenses (Month) | Net (Month) | History count |
|---|---|---|---|---|---|---|:---:|
| **Starting state (Alice)** *(Pre-UAT, unreset)* | 127.00 ฿ | 1,000.67 ฿ | 20.00 ฿ | +1,000.00 ฿ | 1,000.00 ฿ | 0.00 ฿ | 5 |
| **UAT-02 step 5** *(Attempted second opening)* | 127.00 ฿ | 1,000.67 ฿ | 20.00 ฿ | +1,000.00 ฿ | 1,000.00 ฿ | 0.00 ฿ | 5 (unchanged) |
| **UAT-03 step 4** *(End of normal journey)* | −2,123.50 ฿ *(Negative balance)* | 27,500.67 ฿ | −2,780.00 ฿ | +31,500.00 ฿ | 4,450.50 ฿ | +27,049.50 ฿ | 9 |
| **UAT-04 steps 13–14 & 19** *(After rejected inputs)* | −2,123.50 ฿ | 27,500.67 ฿ | −2,780.00 ฿ | +31,500.00 ฿ | 4,450.50 ฿ | +27,049.50 ฿ | 9 (unchanged) |
| **UAT-06 step 8** *(Alice after Bob receipt)* | −2,123.50 ฿ | 27,500.67 ฿ | −2,780.00 ฿ | +31,500.00 ฿ | 4,450.50 ฿ | +27,049.50 ฿ | 9 (no Bob data) |
| **UAT-06 Bob** *(Bob's isolated figures)* | 1,000.00 ฿ | 0.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 2 |
| **UAT-08 step 8** *(Bob after re-enable)* | 1,000.00 ฿ | 0.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 2 (intact) |

*Note on Accounting Consistency:*  
In UAT-03, while Alice had initial non-zero balances from 18 Nov, the **net changes** resulting from the UAT-03 test cases matched the specification with satang precision:
- Income change: $+30,000.00$ (Salary) $+ 500.00$ (Interest) $= \mathbf{+30,500.00\text{ ฿}}$
- Expense change: $450.50$ (Dining) $+ 1,800.00$ (Groceries) $+ 700.00$ (Elec) $+ 500.00$ (Telecom) $= \mathbf{3,450.50\text{ ฿}}$
- Net Savings delta: $+30,500.00 - 3,450.50 = \mathbf{+27,049.50\text{ ฿}}$
- Card repayment of $4,000.00\text{ ฿}$ correctly did NOT increment expenses.

---

## 4. Defect / Finding Report (Part C, Section 7.2)

One finding arose during testing:

### Finding `UATF-01`: Starting Test Environment Not Reset (Unwiped Baseline Data on Alice)

| Field | Content |
|---|---|
| **Issue ID** | `UATF-01` |
| **Title** | `UAT-02 step 3: Alice user account contains unreset opening balances from 2026-11-18, blocking clean opening balance creation` |
| **Product (owning team)** | Pangtao, team ผิงโหด |
| **Reporter, team, date** | Thanabun Tikaew & Siriwan, team ปลวกแดง, 2026-11-22 |
| **Tested version** | Subtitle "(67)", commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx` |
| **Linked case / requirement** | `UAT-02` step 1 & 3; Handoff §4.1 (Starting state); AC-04.1 |
| **Preconditions and data** | Logged in as `alice@example.test`. Expected 0 transactions per §4.1. |
| **Steps to reproduce** | 1. Log in as `alice@example.test`.<br>2. Inspect `/` (Dashboard) or `GET /api/v1/accounts`.<br>3. Observe Bank Account (`1,000.67 ฿`), Wallet (`127.00 ฿`), and Credit Card (`20.00 ฿`) already have opening balances.<br>4. Attempt to execute UAT-02 Step 3 to set opening balance of 50,000.00 ฿ on Bank Account. |
| **Expected result** | Per §4.1: "USER-A and USER-B start with no transactions: every balance is 0.00 ฿... both Users have the Set opening balance button". Setting opening balance succeeds (HTTP 201). |
| **Actual result** | Opening balance button is absent. POST to `/api/v1/accounts/<bank-id>/opening-balance` returns HTTP 409 `OPENING_BALANCE_EXISTS` ("This account already has an opening balance"). |
| **Severity** | **Minor / Operational**: The backend logic correctly guards against duplicate opening balances (`409 OPENING_BALANCE_EXISTS`), but test environment setup instructions in §4.1 were not executed on Cloud Run before handoff, blocking execution of clean initial setup for Alice (though verified on Bob in UAT-06). |
| **Evidence** | `EV-UAT-02-a` (409 response on Alice), `EV-UAT-06-a` (clean 0 opening balance verified on Bob). |
| **Current Disposition** | **Reported to Partner / Retest Requested**: The UAT Team has officially communicated this finding to the Product Team to request a database reset on Cloud Run. Per handout §4, the final Sprint 1 acceptance decision remains **PENDING** until UAT-02 is retested on a clean database or resolved with explicit documented acceptance. |

---

## 5. Evidence Log & Artifacts (§4.2 Compliance)

Every evidence record below corresponds to an excerpted artifact saved under `docs/labs/lab-06/evidence/<Evidence-ID>.txt`.

| Evidence ID | Action | Expected Result | Actual Observed Result | Time (Bangkok) | Tested Version & Revision | Result |
|---|---|---|---|:---:|---|:---:|
| `EV-PRE-01` | `GET /api/v1/health` | HTTP 200 `{"status":"ok"}` | HTTP 200 `{"status":"ok"}` | 16:15:05 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-00` | `GET /` (Login Page) | Subtitle reads `"Log in to your Pangtao account (67)"` | Subtitle contains version marker `(67)` | 16:15:10 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-01-a` | `POST /api/v1/auth/login` (Invalid credentials) | HTTP 401 with generic `INVALID_CREDENTIALS` | HTTP 401 `{"error":{"code":"INVALID_CREDENTIALS","message":"Invalid email or password"}}` | 16:15:30 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-01-b` | `GET /api/v1/accounts` (Anonymous) | HTTP 401 UNAUTHENTICATED, no data | HTTP 401 `{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}` | 16:15:45 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-02-a` | `POST /api/v1/accounts/<bank-id>/opening-balance` (Duplicate) | HTTP 201 per clean starting state, or 409 if duplicate | HTTP 409 `{"error":{"code":"OPENING_BALANCE_EXISTS","message":"This account already has an opening balance"}}` | 16:17:15 | Commit `64c98f4` / `pangtao-00006-cjx` | **BLOCKED** |
| `EV-UAT-02-b` | `POST /api/v1/accounts/<bank-id>/opening-balance` (Negative) | HTTP 400 VALIDATION_ERROR | HTTP 400 `{"error":{"code":"VALIDATION_ERROR","message":"Invalid input payload","details":[{"field":"amount","issue":"amount must be at least 0 satang"}]}}` | 16:17:30 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-03-a` | `POST /api/v1/transactions` (Receipt 30.5k THB) | HTTP 201 Created; Bank balance increases | HTTP 201 Created; ID `00ad577a-fb05-418b-9ff1-6e001120fd23`; Bank +30.5k ฿ | 16:18:05 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-03-b` | `POST /api/v1/transactions` (Payment 2,250.50 THB) | HTTP 201 Created; Wallet overdraft allowed | HTTP 201 Created; ID `48f26f7d-546e-4e88-a78c-f4dec2509580`; Wallet -2,123.50 ฿ | 16:18:15 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-03-c` | `POST /api/v1/transactions` (Card Repayment 4k THB) | HTTP 201 Created; Expenses unchanged | HTTP 201 Created; ID `326aac25-dc34-4bf5-a182-0213be1bb092`; Expenses unchanged | 16:18:25 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-04-a` | `POST /api/v1/transactions` (Allocation Mismatch) | HTTP 400 INVALID_ALLOCATION_SUM | HTTP 400 `{"error":{"code":"INVALID_ALLOCATION_SUM","message":"Allocation lines must add up to the total amount"}}` | 16:19:10 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-04-b` | `POST /api/v1/transactions` (Future Date) | HTTP 400 FUTURE_DATE_NOT_ALLOWED | HTTP 400 `{"error":{"code":"FUTURE_DATE_NOT_ALLOWED","message":"Date cannot be later than today in Bangkok time"}}` | 16:19:25 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-05-a` | `GET /api/v1/summary/income-expense` (Invalid range) | HTTP 400 VALIDATION_ERROR | HTTP 400 `{"error":{"code":"VALIDATION_ERROR","message":"from must not be later than to"}}` | 16:20:15 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-05-b` | `GET /api/v1/transactions/<id>` (Row 4 Detail) | HTTP 200 with split line details | HTTP 200; Lines: Salary 30k ฿, Interest 500 ฿; Memo: `UAT salary` | 16:20:40 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-06-a` | `POST /api/v1/accounts/<bob-wallet-id>/opening-balance` | HTTP 201 Created with 0 amount | HTTP 201 Created; ID `33c4a565-ce5a-453b-88a6-4f90030949dc` | 16:22:10 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-06-b` | `GET /api/v1/transactions/<bob-tx-id>` as Alice | HTTP 404 NOT_FOUND (IDOR prevented) | HTTP 404 `{"error":{"code":"NOT_FOUND","message":"Transaction not found"}}` | 16:22:30 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-07-a` | `GET /api/v1/accounts` as Admin | HTTP 403 FORBIDDEN (Admin denied finances) | HTTP 403 `{"error":{"code":"FORBIDDEN","message":"You do not have permission to access this resource"}}` | 16:23:15 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-07-b` | `GET /api/v1/admin/users` as Alice | HTTP 403 FORBIDDEN (Non-admin denied) | HTTP 403 `{"error":{"code":"FORBIDDEN","message":"You do not have permission to access this resource"}}` | 16:23:45 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-08-a` | `PATCH /api/v1/admin/users/<admin-id>` (Self-disable) | HTTP 409 CANNOT_DISABLE_SELF | HTTP 409 `{"error":{"code":"CANNOT_DISABLE_SELF","message":"You cannot disable your own account"}}` | 16:24:10 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-08-b` | `GET /api/v1/accounts` with Bob's disabled session | HTTP 401 UNAUTHENTICATED (immediate revocation) | HTTP 401 `{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}` | 16:24:35 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |

---

## 6. Overall Assessment & Conclusion

1. **Sprint 1 Functionality:**
   * **Authentication & Authorization (F-01, F-02):** Role segregation between `USER` and `ADMIN`, session revocation on disable, self-disable guard (`409 CANNOT_DISABLE_SELF`), and rate-limiting.
   * **Accounting Engine & Exact Satang (F-03, F-04, F-05, F-06, F-07, F-08):** Exact satang calculations, atomic split allocation transactions, negative balance support, debt repayment exclusion from expenses, and date preset summaries all behave exactly per specifications.
   * **Multi-tenant Data Isolation:** Fully protected. Accessing another user's financial record ID returns `404 NOT_FOUND` to protect against IDOR.
2. **Current Acceptance Decision Status:**
   * **7 out of 8 cases PASS** completely.
   * **1 case (UAT-02) is BLOCKED** on Alice due to an unreset deployment environment (`UATF-01`).
   * **Decision:** **PENDING / NOT YET ACCEPTED** until the Product Team resets Alice's baseline on Cloud Run and UAT-02 is retested, or the UAT Team records an explicit documented limitation. Per Lab 6 §4, acceptance cannot be signed off while required test cases remain BLOCKED.
