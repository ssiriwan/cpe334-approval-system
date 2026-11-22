# Lab 6 - Findings and Defect Triage (Part C)

> **Team:** ปลวกแดง — Siriwan (`67070501075`, `@ssiriwan`) and Thanabun (`67070501021`, `@thhanabun`)
> **Partner:** ผิงโหด — Chawin Chinpraditsuk (`67070501012`) and Supichaya (`67070501087`), repo `yakginmomo/pangtao`
> **Covers:** Lab 6 §3.3 (Part C, 20 points)

---

## 1. Outgoing Reports (Findings Discovered on Partner Product: Pangtao)

These findings were discovered by our team while independently testing `yakginmomo/pangtao` against their official Sprint 1 UAT plan (`docs/labs/lab-06/uat.md`).

| Issue ID | Case & Step | Title | Severity | Impact | Evidence ID | Status & Disposition |
|---|---|---|:---:|---|:---:|---|
| **`UATF-01`** | `UAT-02` step 3 | Alice user account contains unreset opening balances from 2026-11-18, blocking clean opening balance creation | **Minor / Operational** | Does not affect accounting math or access security, but unreset database violates starting state preconditions (§4.1) and prevents executing the happy-path opening balance creation on Alice (though verified on Bob in UAT-06). | `EV-UAT-02-a`, `EV-UAT-06-a` | Reported to partner team via agreed channel. Awaiting partner triage. |

### Details for `UATF-01`
- **Reporter:** Thanabun Tikaew & Siriwan (team ปลวกแดง)
- **Tested Version:** Subtitle "(67)", commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx`
- **Preconditions:** Logged in as `alice@example.test`. Expected 0 transactions per §4.1.
- **Reproduction Steps:**
  1. Log in as `alice@example.test`.
  2. Inspect `/` (Dashboard) or `GET /api/v1/accounts`.
  3. Observe Bank Account (`1,000.67 ฿`), Wallet (`127.00 ฿`), and Credit Card (`20.00 ฿`) already have opening balances.
  4. Attempt to execute UAT-02 Step 3 to set opening balance of 50,000.00 ฿ on Bank Account.
- **Expected:** Setting opening balance succeeds (HTTP 201).
- **Actual:** Opening balance button absent. POST returns HTTP 409 `OPENING_BALANCE_EXISTS` ("This account already has an opening balance").
- **Classification:** Accepted Defect / Test Environment Operational Finding.

---

## 2. Incoming Findings (Findings Received about Our Approval System)

*(To be filled when partner returns their execution results on our product)*

| Finding ID | Case / Ref | Summary | Severity | Classification | Reason tied to Sprint 1 contract | Disposition / Action |
|---|---|---|:---:|:---:|---|---|
| *(Pending)* | - | Awaiting partner UAT execution reports | - | - | - | - |

### Triage Rules (Handout §3.3)
- **Critical / Major:** Blocks Sprint 1 acceptance. Must be corrected via Red/Green regression test, PR review, CI pass, deployment, and independent retest by partner.
- **Minor:** Must be fixed or explicitly accepted by the UAT Team as documented known limitations.
- **Enhancement / Not-defect:** Enhancements outside agreed Sprint 1 scope need not be implemented.
