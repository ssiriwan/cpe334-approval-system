# Lab 6 - UAT Cases for the Partner Product (Pangtao)

> **Author team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Partner / Product Team:** `yakginmomo/pangtao` - <https://github.com/yakginmomo/pangtao>
> **Covers:** Lab 6 handout sections 3.1 (Part A) and 3.2 (Part B)
> **Label:** `lab6` (Issue #36 / corrected by #44)

> **IMPORTANT - role correction:** these cases were authored by **us** for the partner's app. Under
> handout §1/§2/§3.2 the Product Team authors cases for **its own** app, so these are **supplementary
> independent UAT design** supporting Part B. They are **not** our Part A handoff. Our actual Part A
> cases for our own app are in [`uat-cases-our-product.md`](./uat-cases-our-product.md). For Part B we
> must execute the cases **supplied by the partner**; these are a fallback/test design only.

These cases were written **by our team as the UAT Team** for the partner's delivered Sprint 1 product.
They give another team a deterministic, executable UAT plan. The partner may run them as a handoff
self-check; **our team separately executes them and records the actual results** as independent UAT
evidence (`docs/labs/lab-06/execution-results-partner.md`).

---

## 1. Version and handoff information

| Item | Value |
| :--- | :--- |
| Application | Pangtao - Personal Money and Expense Logging System (Theme 7) |
| Repository | <https://github.com/yakginmomo/pangtao> (public) |
| Public URL | <https://pangtao-vowtduxdha-as.a.run.app> |
| Health check | `GET /api/v1/health` → `{"status":"ok"}` (no commit in the body) |
| Release tag | `v0.1.0` (commit `bec5575c3ce434b4b1eac0899e734e513e672d9f`) |
| Partner `main` HEAD at review time | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` |
| Deployed revision / running commit | Commit on partner `main`: `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (confirmed by the partner as the deployed version). The health handler does not expose a commit, so the version is identified by the `main` commit plus the public URL. |
| Accepted-for-test scope | **Sprint 1 only**: auth, admin users, accounts/balances, opening balance, payment, receipt, transaction history, income/expense summary. Sprint 2 and 3 features are explicitly out of scope. |
| Date of handoff | 22 Nov 2026 |

### 1.1 Safe test accounts (labels only - passwords are handed over privately)

| Label | Email | Role | Visible data |
| :--- | :--- | :--- | :--- |
| Alice | `alice@example.test` | `USER` | Own ledger: 9 accounts, no transactions at seed time |
| Bob | `bob@example.test` | `USER` | Independent private ledger, tenant-isolated from Alice |
| Admin | `admin@example.test` | `ADMIN` | User administration at `/admin/users` only - **no financial records** |

All three accounts use the partner's `SEED_DEFAULT_PASSWORD`. **Never put the value in the PDF, Git,
a chat transcript, or a screenshot.** The password must be supplied privately by the Product Team.
If it is not supplied, every login case is recorded as `BLOCKED` with the reason and the TA is
notified (handout §2).

### 1.2 Data setup, sequencing and cleanup

- Seed state: Alice and Bob each have nine accounts (**Wallet, Bank Account, Credit Card, Salary,
  Interest Earned, Dining, Groceries, Electricity, Telecom**) with **zero transactions**.
- **Sequence:** run `UAT-PT-01` first (it creates the reference transactions), then `02`, `03`, `05`.
  Run `UAT-PT-04` **last**, after the Product Team performs the agreed redeploy.
- `UAT-PT-02`, `03` and `05` assume the data from `UAT-PT-01` exists but do not depend on each other.
- **Cleanup:** the Sprint 1 scope has no delete endpoint. Record every created transaction ID on the
  results sheet; the Product Team may reset the test database before grading. Do not delete resources.
- Use synthetic data only. No real personal or financial information.

---

## 2. UAT-PT-01 - Normal domain journey with explicit money movement

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-PT-01` |
| **Requirement / AC** | FR-08, FR-10, FR-12; BR-04, BR-07, BR-08, BR-11; AC-03.x / AC-05.x / AC-08.x |
| **Purpose** | Verify that an opening balance and a normal expense are recorded atomically, that every affected balance is derived correctly, and that an opening balance is not counted as income. |
| **Role** | `USER` (Alice) |
| **Preconditions** | Alice can log in; her nine accounts have zero balance; no transactions exist. |
| **Synthetic inputs** | Opening balance `10000.00` THB on **Wallet**, date = today (Asia/Bangkok); payment total `250.00` THB from **Wallet** to **Dining**, date = today, memo `UAT-PT-01`. |

### Numbered actions

1. Log in as `alice@example.test`.
2. On the Dashboard, open **Set opening balance** on the **Wallet** row.
3. Enter amount `10000.00`, today's date, and save. Observe the Dashboard.
4. Select **Record transaction** → tab **Payment**.
5. Set **Paid from** = `Wallet`, **Date** = today, **Total amount (THB)** = `250.00`.
6. Set **Line 1 account** = `Dining`, **Amount (THB)** = `250.00`. Confirm the allocation summary reads Total 250.00 / Allocated 250.00 / Remaining 0.00 ("Fully allocated").
7. Click **Save payment**. Observe the Dashboard and the **This month** widget.
8. Open `/transactions` and then the detail of the payment.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| After step 3 | Wallet balance = **10,000.00 THB**; the row shows "Opening balance 10,000.00 on <today>". |
| After step 7 | Wallet = **9,750.00 THB**; Dining = **250.00 THB** (money moved 10,000.00 − 250.00 = 9,750.00). |
| This month widget | Income **0.00** (BR-11: opening balance is never income), Expenses **250.00**, Net **-250.00**. |
| `/transactions` | Exactly **2** entries: the opening balance and the payment. |
| Payment detail | One allocation line to Dining of **250.00**; total **250.00**. |

**Evidence IDs:** `E-PT-01a` (Dashboard after opening balance), `E-PT-01b` (Dashboard after payment + This month), `E-PT-01c` (history + detail).

---

## 3. UAT-PT-02 - Business-rule / boundary rejection

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-PT-02` |
| **Requirement / AC** | BR-04, BR-05, BR-07, BR-10; AC-04.x / AC-05.x |
| **Purpose** | Verify that an under-allocated transaction, a future date, and invalid amounts are rejected, and that a rejected operation changes **no** balance. |
| **Role** | `USER` (Alice) |
| **Preconditions** | `UAT-PT-01` has run; Wallet = 9,750.00 THB. |
| **Synthetic inputs** | Payment total `1000.00` with a single line `600.00`; future date = tomorrow; invalid totals `0.001` and `100000000.01`. |

### Numbered actions

1. Open `/transactions/new`, tab **Payment**, source = **Wallet**, total = `1000.00`, one line to **Dining** = `600.00`.
2. Read the **Allocation summary**. Try to click **Save payment**.
3. Change **Date** to tomorrow; observe the field error and submit state.
4. Restore today's date; enter total `0.001`; observe the field error.
5. Enter total `100000000.01`; observe the field error.
6. Return to the Dashboard and read the Wallet balance again.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| Step 2 | Summary shows Total **1,000.00**, Allocated **600.00**, Remaining **400.00** with status "Over-allocated"/"Still to allocate"; **Save payment is disabled**; no transaction is created. |
| Step 3 | Inline error **"Date cannot be later than today."**; submit disabled. |
| Steps 4-5 | Inline error **"Enter an amount from 0.01 to 100,000,000.00 THB."**; submit disabled. |
| Step 6 (protected state check) | Wallet is still **9,750.00 THB** and `/transactions` still has exactly **2** entries. No rejection disclosed or changed protected state. |

**Evidence IDs:** `E-PT-02a` (allocation summary + disabled button), `E-PT-02b` (validation errors), `E-PT-02c` (unchanged Dashboard/history after rejection).

---

## 4. UAT-PT-03 - Forbidden access: another user and Administrator

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-PT-03` |
| **Requirement / AC** | FR-04; BR-01, BR-02, NFR-02; AC-01.x / AC-02.x |
| **Purpose** | Verify tenant isolation between two `USER` accounts and that an Administrator cannot read or modify any financial record or summary. |
| **Role** | `USER` (Bob) and `ADMIN` (Admin) |
| **Preconditions** | `UAT-PT-01` has run and its transaction ID is recorded; Alice's Wallet = 9,750.00 THB. |
| **Synthetic inputs** | Bob's credentials; Admin's credentials; Alice's transaction ID from `UAT-PT-01`. |

### Numbered actions

1. Log in as `bob@example.test`. Observe the Dashboard.
2. In the address bar open `/transactions/<alice-transaction-id>` and `/transactions`.
3. Log out. Log in as `admin@example.test`.
4. Try to open `/` (the financial Dashboard) and `/summary`.
5. Open `/admin/users` and read the columns shown.
6. Log out and open `/` without a session.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| Step 1 | Bob sees only his own nine accounts, all **0.00**; no 9,750.00 and no Alice data. |
| Step 2 | Alice's transaction/detail is **not found / not disclosed**; Bob's history does not contain it. |
| Step 4 | Admin is **denied** all financial views (Not Permitted / redirect); no balance, transaction or summary is shown. |
| Step 5 | `/admin/users` shows only email, display name, role, status (and creation timestamp if present) - **no financial data**. |
| Step 6 | Unauthenticated request is redirected to `/login` (API responds 401). |

**Evidence IDs:** `E-PT-03a` (Bob's own zero balances), `E-PT-03b` (Alice record not found), `E-PT-03c` (Admin Not Permitted), `E-PT-03d` (`/admin/users` columns).

---

## 4b. UAT-PT-04 - State / history / persistence

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-PT-04` |
| **Requirement / AC** | BR-07, NFR-06; AC-03.x / AC-05.x / AC-07.x persistence |
| **Purpose** | Verify that saved ledger data survives an application restart/redeploy and that transaction history remains intact. |
| **Role** | `USER` (Alice) |
| **Preconditions** | `UAT-PT-01` data exists; the Product Team confirms a restart or redeploy will occur. |
| **Synthetic inputs** | The transaction ID and balances recorded in `UAT-PT-01`. |

### Numbered actions

1. Before the restart, record: transaction ID(s), Wallet **9,750.00**, Dining **250.00**, history count **2**.
2. Notify the Product Team; wait for their restart/redeploy and obtain the new revision or restart time.
3. Log in again as Alice and reopen `/`, `/transactions` and the transaction detail.
4. Recalculate: Wallet = 10,000.00 − 250.00 = **9,750.00**; Expenses = **250.00**.

### Specific expected results

The same transaction IDs, the same two history entries, Wallet **9,750.00** and Dining **250.00** are still present after the restart/redeploy. If the redeploy does not happen, record `BLOCKED` with the coordination evidence - never mark it PASS.

**Evidence IDs:** `E-PT-04a` (before), `E-PT-04b` (after + revision/restart time).

---

## 5. UAT-PT-05 - Administrator user lifecycle (supplementary)

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-PT-05` |
| **Requirement / AC** | FR-05, FR-06; BR-03, BR-13; AC-02.x |
| **Purpose** | Verify that an Administrator can create and disable a user and that a disabled user cannot log in or keep an active session. |
| **Role** | `ADMIN` |
| **Preconditions** | Admin can log in and `/admin/users` is reachable. |
| **Synthetic inputs** | New user `uat.check@example.test` with a synthetic password supplied privately. |

### Numbered actions

1. Log in as Admin → `/admin/users` → create the synthetic user.
2. Log in as the new user to confirm access works.
3. Back as Admin → disable that user (do **not** disable the Admin's own account - BR-03).
4. Try to log in as the disabled user and continue with any existing session.

### Specific expected results

The user appears in the list with role `USER` and active status after step 1; after step 3 the status is disabled and login is rejected with a generic credential error; an existing session no longer grants access (BR-13). The Admin cannot disable their own account.

**Evidence IDs:** `E-PT-05a` (created user row), `E-PT-05b` (disabled status), `E-PT-05c` (login rejected).

---

## 6. Result recording template (for the executing team)

```
Case ID | Tester (name/team) | Date/time | Tested version (tag + commit/revision) | Inputs | ACTUAL result (do NOT copy expected) | PASS / FAIL / BLOCKED | Evidence IDs
UAT-PT-01 | Oum (Oum&T) | 2026-11-22 .. | v0.1.0 / 64c98f4 | 10000.00 / 250.00 | <what was actually observed> | ... | E-PT-01a,b,c
```

A FAIL must additionally produce a defect report with: Issue ID, product owner/team, reporter, tested version, linked case + requirement, preconditions/data, reproduction steps, expected, actual, severity explained by user impact, and evidence.
