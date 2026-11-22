# Lab 6 - Independent Execution Results (Partner Product: Pangtao)

> **UAT Team (Testers):** ปลวกแดง — Thanabun Tikaew (`67070501021`, `@thhanabun`) and Siriwan (`67070501075`, `@ssiriwan`)
> **Product Team:** ผิงโหด — Chawin Chinpraditsuk (`67070501012`) and Supichaya (`67070501087`)
> **Product / Repo:** `yakginmomo/pangtao` (Theme 7: Personal Money and Expense Logging System)
> **Execution Date/Time:** 22 November 2026, 16:15–16:25 (Initial Run) & 21:35–21:40 (Retest Run on Clean DB) (Bangkok / Asia/Bangkok time)
> **Cases document executed:** `docs/labs/lab-06/uat.md` (from partner's repo `yakginmomo/pangtao`, branch `chore/lab6-uat-doc` / PR #41)
> **Handout coverage:** Lab 6 §3.2 (Part B complete, 100% PASS) and §3.3 (Part C outgoing resolved; incoming findings pending partner UAT report on our app)

---

## 1. Release Under Test & Environment Verification

| Item | Expected (from partner `uat.md`) | Verified Actual | Status |
|---|---|---|:---:|
| Public URL | `https://pangtao-vowtduxdha-as.a.run.app` | `https://pangtao-vowtduxdha-as.a.run.app` | MATCH |
| Version Marker | Subtitle: "Log in to your Pangtao account (67)" | Verified in JS bundle: `Log in to your Pangtao account (67)` | MATCH (`EV-UAT-00`) |
| Git Commit | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (PR #40) | Partner confirmed release `64c98f4` | MATCH |
| Service Revision | `pangtao-00006-cjx` | Image digest `sha256:0c479894775aa1ac88e0aff965f1e59af94436193f422541f44397f7cb78ff45` | MATCH |
| Health Status | `GET /api/v1/health` → `{"status":"ok"}` | Returned HTTP 200 `{"status":"ok"}` | PASS (`EV-PRE-01`) |

*Version Note:* The health endpoint (`/api/v1/health`) does not expose a git commit in its JSON response. Therefore, the tested version is corroborated together by the login subtitle marker "(67)", the partner-confirmed commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, and Cloud Run revision `pangtao-00006-cjx` (image digest `sha256:0c479894775aa1ac88e0aff965f1e59af94436193f422541f44397f7cb78ff45`).

---

## 2. Case Execution Summary (Part B, Section 7.1)

| Case | Tester (name, team) | Date and time (Bangkok) | Version checked (subtitle "(67)", commit) | Inputs used | Actual result | Failed or blocked step | PASS / FAIL / BLOCKED | Evidence IDs |
|---|---|---|---|---|---|---|:---:|---|
| **UAT-01** | Siriwan (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Wrong pass, unknown email, valid Alice/Admin credentials, anonymous API calls | Subtitle (67) confirmed; generic 401 on wrong pass & unknown email; Alice lands on `/`, Admin lands on `/admin/users`; logout revokes cookie; anonymous API calls all return 401 UNAUTHENTICATED. | None | **PASS** | `EV-UAT-00`, `EV-UAT-01-a`, `EV-UAT-01-b` |
| **UAT-02** | Thanabun (ปลวกแดง) | 2026-11-22 21:35 *(Retest after DB reset)* | Subtitle "(67)", commit `64c98f4` | Bank 50,000, Wallet 2,000, Card 3,500; negative amount, future date, duplicate attempt | Clean database confirmed (0.00 ฿ on all accounts, openingBalance: null). Bank opening balance 50,000.00 ฿ saved (HTTP 201). Duplicate attempt rejected with 409 `OPENING_BALANCE_EXISTS`. Wallet opening 2,000.00 ฿ saved (HTTP 201). Card opening 3,500.00 ฿ saved (HTTP 201). Negative amount rejected with 400 `VALIDATION_ERROR`. Future date rejected with 400 `FUTURE_DATE_NOT_ALLOWED`. | None *(Resolved on retest)* | **PASS** | `EV-UAT-02-a`, `EV-UAT-02-b`, `EV-UAT-02-c` |
| **UAT-03** | Siriwan (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Receipt Bank 30,500 (Salary 30k + Int 500); Payment Wallet 2,250.50 (Dining 450.50 + Groceries 1,800); Payment Card 1,200 (Elec 700 + Telecom 500); Payment Bank 4,000 (Card repay) | All 4 transactions created (HTTP 201). Wallet went negative (-250.50 ฿) with Negative balance label (D-02). Card charge counted as expense; Card repayment did NOT count as expense (BR-09). Month Net: +27,049.50 ฿. Ending balances match exactly. | None | **PASS** | `EV-UAT-03-a`, `EV-UAT-03-b`, `EV-UAT-03-c` |
| **UAT-04** | Thanabun (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Allocation mismatch (500 vs 300); Total = 0; Future date; Card to Bank; Wallet to Wallet; Receipt to Card | All invalid operations rejected with 400: `INVALID_ALLOCATION_SUM`, `VALIDATION_ERROR`, `FUTURE_DATE_NOT_ALLOWED`, `INVALID_TARGET_ACCOUNT`, `INVALID_SOURCE_ACCOUNT`. Protected state and balances remained completely unchanged. | None | **PASS** | `EV-UAT-04-a`, `EV-UAT-04-b` |
| **UAT-05** | Siriwan (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Re-login Alice; view History; view detail of row 4; summary presets; custom invalid date range | Balances persisted after re-login. History shows newest-first transactions with correct split lines (7 rows total). Row 4 detail (`e7cb1266...`) verified with Salary 30k ฿ and Interest 500 ฿ lines. Invalid custom range returns `400 VALIDATION_ERROR` ("from must not be later than to"). | None | **PASS** | `EV-UAT-05-a`, `EV-UAT-05-b` |
| **UAT-06** | Thanabun (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Bob Wallet opening 0; Bob receipt 1,000 (Salary); Alice probes Bob transaction | Bob starts with clean 0.00 balances. Bob sets 0 opening balance and saves 1,000.00 receipt (`201`). Alice accessing Bob's transaction via `/api/v1/transactions/<bob-id>` receives `404 NOT_FOUND` (IDOR prevented, D-03). Alice's summary and history completely isolated. | None | **PASS** | `EV-UAT-06-a`, `EV-UAT-06-b` |
| **UAT-07** | Siriwan (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Admin login; Admin accesses `/accounts`, `/transactions`, `/summary`; Alice accesses `/admin/users` | Admin lands strictly on `/admin/users` (no financial links). Admin calling `/accounts`, `/transactions`, or `/summary/income-expense` gets `403 FORBIDDEN` (BR-02). Alice calling `/admin/users` gets `403 FORBIDDEN`. Admin users list contains 3 users with no financial fields. | None | **PASS** | `EV-UAT-07-a`, `EV-UAT-07-b` |
| **UAT-08** | Thanabun (ปลวกแดง) | 2026-11-22 21:35 | Subtitle "(67)", commit `64c98f4` | Admin disables self; Admin disables Bob; Bob active session; Bob login; Admin re-enables Bob; Bob re-login | Admin disabling self gets `409 CANNOT_DISABLE_SELF` (BR-03). Disabling Bob succeeds (`200`). Bob's existing active session is revoked immediately with `401 UNAUTHENTICATED` (BR-13). Bob login rejected with generic 401. Admin re-enables Bob. Bob logs in successfully; data and Wallet 1,000.00 ฿ intact. | None | **PASS** | `EV-UAT-08-a`, `EV-UAT-08-b` |

---

## 3. Figures Seen at Key Checkpoints (Part B Table)

All values are in Thai Baht (฿), tested with exact satang integer arithmetic:

| Checkpoint | Wallet | Bank Account | Credit Card (Debt) | Income (Month) | Expenses (Month) | Net (Month) | History count |
|---|---|---|---|---|---|---|:---:|
| **Starting state (Alice)** *(Pre-UAT, clean reset)* | 0.00 ฿ | 0.00 ฿ | 0.00 ฿ | 0.00 ฿ | 0.00 ฿ | 0.00 ฿ | 0 |
| **UAT-02 step 5** *(After all 3 openings saved)* | 2,000.00 ฿ | 50,000.00 ฿ | 3,500.00 ฿ | 0.00 ฿ | 0.00 ฿ | 0.00 ฿ | 3 (openings) |
| **UAT-03 step 1** *(Salary & Interest receipt)* | 2,000.00 ฿ | 80,500.00 ฿ | 3,500.00 ฿ | +30,500.00 ฿ | 0.00 ฿ | +30,500.00 ฿ | 4 |
| **UAT-03 step 2** *(Wallet dining & groceries payment)* | **−250.50 ฿** *(Negative balance)* | 80,500.00 ฿ | 3,500.00 ฿ | +30,500.00 ฿ | 2,250.50 ฿ | +28,249.50 ฿ | 5 |
| **UAT-03 step 3** *(Credit Card utilities charge)* | −250.50 ฿ | 80,500.00 ฿ | 4,700.00 ฿ | +30,500.00 ฿ | 3,450.50 ฿ | +27,049.50 ฿ | 6 |
| **UAT-03 step 4** *(Card repayment from Bank)* | −250.50 ฿ | 76,500.00 ฿ | 700.00 ฿ | +30,500.00 ฿ | **3,450.50 ฿** *(unchanged)* | **+27,049.50 ฿** | 7 |
| **UAT-04 steps 1–11** *(After rejected inputs)* | −250.50 ฿ | 76,500.00 ฿ | 700.00 ฿ | +30,500.00 ฿ | 3,450.50 ฿ | +27,049.50 ฿ | 7 (unchanged) |
| **UAT-06 Bob** *(Bob's isolated figures)* | 1,000.00 ฿ | 0.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 2 |
| **UAT-06 Alice** *(Alice after Bob receipt)* | −250.50 ฿ | 76,500.00 ฿ | 700.00 ฿ | +30,500.00 ฿ | 3,450.50 ฿ | +27,049.50 ฿ | 7 (no Bob data) |
| **UAT-08 step 8** *(Bob after re-enable)* | 1,000.00 ฿ | 0.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 0.00 ฿ | +1,000.00 ฿ | 2 (intact) |

*Accounting Exactness Verification:*
- Opening balances: Wallet $+2,000.00$, Bank $+50,000.00$, Card $+3,500.00$ (Debt).
- Cash Total: $2,000.00 + 50,000.00 = 52,000.00\text{ ฿}$.
- Total Income: $+30,000.00$ (Salary) $+ 500.00$ (Interest) $= \mathbf{+30,500.00\text{ ฿}}$.
- Total Expenses: $450.50$ (Dining) $+ 1,800.00$ (Groceries) $+ 700.00$ (Elec) $+ 500.00$ (Telecom) $= \mathbf{3,450.50\text{ ฿}}$.
- Net Savings: $+30,500.00 - 3,450.50 = \mathbf{+27,049.50\text{ ฿}}$.
- Wallet Overdraft: $2,000.00 - 2,250.50 = \mathbf{-250.50\text{ ฿}}$ with "Negative balance" badge.
- Debt Repayment: $4,000.00\text{ ฿}$ repayment to Credit Card reduced debt from $4,700.00$ to $700.00\text{ ฿}$ and reduced Bank from $80,500.00$ to $76,500.00\text{ ฿}$ without counting towards expenses (BR-09).

---

## 4. Defect / Finding Report (Part C, Section 7.2)

### Finding `UATF-01`: Starting Test Environment Not Reset (Unwiped Baseline Data on Alice) — **RESOLVED**

| Field | Content |
|---|---|
| **Issue ID** | `UATF-01` |
| **Title** | `UAT-02 step 3: Alice user account contains unreset opening balances from 2026-11-18, blocking clean opening balance creation` |
| **Product (owning team)** | Pangtao, team ผิงโหด |
| **Reporter, team, date** | Thanabun Tikaew & Siriwan, team ปลวกแดง, 2026-11-22 |
| **Tested version** | Subtitle "(67)", commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx` |
| **Linked case / requirement** | `UAT-02` step 1 & 3; Handoff §4.1 (Starting state); AC-04.1 |
| **Preconditions and data** | Logged in as `alice@example.test`. Expected 0 transactions per §4.1. |
| **Initial finding (16:17)** | Alice had unreset opening balances from 18 Nov, returning HTTP 409 `OPENING_BALANCE_EXISTS` and blocking UAT-02 step 3. |
| **Resolution & Retest (21:35)** | **RESOLVED & VERIFIED PASS**: Product team reset the database on Cloud Run. At 21:35, UAT team re-tested UAT-02 from scratch. Verified 0.00 starting balances, successful Bank opening balance save (HTTP 201), Wallet opening balance save (HTTP 201), Credit Card opening balance save (HTTP 201), duplicate rejection (HTTP 409), negative amount validation (HTTP 400), and future date validation (HTTP 400). |
| **Status** | **CLOSED / PASS ON RETEST** |
| **Evidence** | `EV-UAT-02-a` (201 Created), `EV-UAT-02-b` (400 Validation), `EV-UAT-02-c` (409 Conflict). |

---

## 5. Evidence Log & Artifacts (§4.2 Compliance)

Every evidence record below corresponds to an artifact saved under `docs/labs/lab-06/evidence/<Evidence-ID>.txt`.

| Evidence ID | Action | Expected Result | Actual Observed Result | Time (Bangkok) | Tested Version & Revision | Result |
|---|---|---|---|:---:|---|:---:|
| `EV-PRE-01` | `GET /api/v1/health` | HTTP 200 `{"status":"ok"}` | HTTP 200 `{"status":"ok"}` | 21:35:47 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-00` | `GET /` (Login Page) | Subtitle reads `"Log in to your Pangtao account (67)"` | Subtitle contains version marker `(67)` | 21:35:47 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-01-a` | `POST /api/v1/auth/login` (Invalid credentials) | HTTP 401 with generic `INVALID_CREDENTIALS` | HTTP 401 `{"error":{"code":"INVALID_CREDENTIALS","message":"Invalid email or password"}}` | 21:35:48 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-01-b` | `GET /api/v1/accounts` (Anonymous) | HTTP 401 UNAUTHENTICATED, no data | HTTP 401 `{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}` | 21:35:49 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-02-a` | `POST /api/v1/accounts/<bank-id>/opening-balance` (50k THB) | HTTP 201 Created; opening balance saved | HTTP 201 Created; Bank Account = 50,000.00 ฿ (`5000000` satang) | 21:35:50 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-02-b` | `POST /api/v1/accounts/<bank-id>/opening-balance` (Negative) | HTTP 400 VALIDATION_ERROR | HTTP 400 `{"error":{"code":"VALIDATION_ERROR","message":"Invalid input payload","details":[{"field":"amount","issue":"amount must be at least 0 satang"}]}}` | 21:35:49 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-02-c` | `POST /api/v1/accounts/<bank-id>/opening-balance` (Duplicate) | HTTP 409 OPENING_BALANCE_EXISTS | HTTP 409 `{"error":{"code":"OPENING_BALANCE_EXISTS","message":"This account already has an opening balance"}}` | 21:35:50 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-03-a` | `POST /api/v1/transactions` (Receipt 30.5k THB) | HTTP 201 Created; Bank balance increases | HTTP 201 Created; ID `e7cb1266-b808-43f3-a1e8-0a2098990b8e`; Bank = 80,500.00 ฿ | 21:35:50 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-03-b` | `POST /api/v1/transactions` (Payment 2,250.50 THB) | HTTP 201 Created; Wallet overdraft allowed | HTTP 201 Created; ID `fdaaa340-763d-4bf9-9457-d62a1a959b57`; Wallet = −250.50 ฿ | 21:35:50 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-03-c` | `POST /api/v1/transactions` (Card Repayment 4k THB) | HTTP 201 Created; Expenses unchanged | HTTP 201 Created; ID `2eb86c54-f119-40c5-8bf4-34585f573131`; Expenses unchanged (3,450.50 ฿) | 21:35:51 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-04-a` | `POST /api/v1/transactions` (Allocation Mismatch) | HTTP 400 INVALID_ALLOCATION_SUM | HTTP 400 `{"error":{"code":"INVALID_ALLOCATION_SUM","message":"Allocation lines must add up to the total amount"}}` | 21:35:51 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-04-b` | `POST /api/v1/transactions` (Future Date) | HTTP 400 FUTURE_DATE_NOT_ALLOWED | HTTP 400 `{"error":{"code":"FUTURE_DATE_NOT_ALLOWED","message":"Date cannot be later than today in Bangkok time"}}` | 21:35:51 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-05-a` | `GET /api/v1/summary/income-expense` (Invalid range) | HTTP 400 VALIDATION_ERROR | HTTP 400 `{"error":{"code":"VALIDATION_ERROR","message":"from must not be later than to"}}` | 21:35:52 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-05-b` | `GET /api/v1/transactions/<id>` (Row 4 Detail) | HTTP 200 with split line details | HTTP 200; Lines: Salary 30k ฿, Interest 500 ฿; Memo: `UAT salary` | 21:35:52 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-06-a` | `POST /api/v1/accounts/<bob-wallet-id>/opening-balance` | HTTP 201 Created with 0 amount | HTTP 201 Created; zero opening balance allowed | 21:35:53 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-06-b` | `GET /api/v1/transactions/<bob-tx-id>` as Alice | HTTP 404 NOT_FOUND (IDOR prevented) | HTTP 404 `{"error":{"code":"NOT_FOUND","message":"Transaction not found"}}` | 21:35:53 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-07-a` | `GET /api/v1/accounts` as Admin | HTTP 403 FORBIDDEN (Admin denied finances) | HTTP 403 `{"error":{"code":"FORBIDDEN","message":"You do not have permission to access this resource"}}` | 21:35:54 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-07-b` | `GET /api/v1/admin/users` as Alice | HTTP 403 FORBIDDEN (Non-admin denied) | HTTP 403 `{"error":{"code":"FORBIDDEN","message":"You do not have permission to access this resource"}}` | 21:35:54 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-08-a` | `PATCH /api/v1/admin/users/<admin-id>` (Self-disable) | HTTP 409 CANNOT_DISABLE_SELF | HTTP 409 `{"error":{"code":"CANNOT_DISABLE_SELF","message":"You cannot disable your own account"}}` | 21:35:54 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |
| `EV-UAT-08-b` | `GET /api/v1/accounts` with Bob's disabled session | HTTP 401 UNAUTHENTICATED (immediate revocation) | HTTP 401 `{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}` | 21:35:54 | Commit `64c98f4` / `pangtao-00006-cjx` | **PASS** |

---

## 6. Overall Assessment & Conclusion

1. **Sprint 1 Functionality:**
   * **Authentication & Authorization (F-01, F-02):** Role segregation between `USER` and `ADMIN`, session revocation on disable, self-disable guard (`409 CANNOT_DISABLE_SELF`), and rate-limiting.
   * **Accounting Engine & Exact Satang (F-03, F-04, F-05, F-06, F-07, F-08):** Exact satang calculations, atomic split allocation transactions, negative balance support, debt repayment exclusion from expenses, and date preset summaries all behave exactly per specifications.
   * **Multi-tenant Data Isolation:** Fully protected. Accessing another user's financial record ID returns `404 NOT_FOUND` to protect against IDOR.
2. **Acceptance Decision:**
   * **8 out of 8 cases PASS** completely (100% pass rate).
   * **0 cases FAIL**, **0 cases BLOCKED**.
   * Previous operational finding `UATF-01` was verified **RESOLVED** on Cloud Run retest.
   * **Decision:** **ACCEPTED (Sprint 1 Complete)**. The product team's delivered release meets all Sprint 1 acceptance criteria specified in `uat.md`.
