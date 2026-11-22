# Lab 6 - Findings and Defect Triage (Part C)

> **Team:** ปลวกแดง — Siriwan (`67070501075`, `@ssiriwan`) and Thanabun (`67070501021`, `@thhanabun`)
> **Partner:** ผิงโหด — Chawin Chinpraditsuk (`67070501012`) and Supichaya (`67070501087`), repo `yakginmomo/pangtao`
> **Covers:** Lab 6 §3.3 (Part C outgoing findings resolved & closed; incoming findings pending partner UAT execution on our app)

---

## 1. Outgoing Reports (Findings Discovered on Partner Product: Pangtao)

These findings were discovered by our team while independently testing `yakginmomo/pangtao` against their official Sprint 1 UAT plan (`docs/labs/lab-06/uat.md`).

| Issue ID | Case & Step | Title | Severity | Impact | Evidence ID | Status & Disposition |
|---|---|---|:---:|---|:---:|---|
| **`UATF-01`** | `UAT-02` step 3 | Alice user account contains unreset opening balances from 2026-11-18, blocking clean opening balance creation | **Minor / Operational** | Violated starting state preconditions (§4.1), initially blocking UAT-02 happy-path on Alice. | `EV-UAT-02-a`, `EV-UAT-02-c` | **CLOSED / RESOLVED ON RETEST**: Partner reset Cloud Run database. Full retest at 21:35 Bangkok time passed cleanly (`EV-UAT-02-a` HTTP 201). Acceptance decision: **ACCEPTED**. |

### Details for `UATF-01`
- **Reporter:** Thanabun Tikaew & Siriwan (team ปลวกแดง)
- **Tested Version:** Subtitle "(67)", commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx`
- **Preconditions:** Logged in as `alice@example.test`. Expected 0 transactions per §4.1.
- **Initial Discovery (16:17 Bangkok time):**
  - Alice had non-zero baseline data from 2026-11-18. POST to set opening balance returned HTTP 409 `OPENING_BALANCE_EXISTS`.
- **Resolution & Retest Verification (21:35 Bangkok time):**
  - Partner team executed database reset on Cloud Run deployment.
  - Retest verified all accounts start with clean `0.00 ฿` (`openingBalance: null`).
  - Successfully set Bank Account opening balance to 50,000.00 ฿ (HTTP 201).
  - Successfully set Wallet opening balance to 2,000.00 ฿ (HTTP 201).
  - Successfully set Credit Card opening balance to 3,500.00 ฿ (HTTP 201).
  - Duplicate opening balance attempt correctly returned HTTP 409 `OPENING_BALANCE_EXISTS`.
  - Negative amount returned HTTP 400 `VALIDATION_ERROR`.
  - Future date returned HTTP 400 `FUTURE_DATE_NOT_ALLOWED`.
- **Final Classification:** **Resolved & Verified (PASS on Retest)**.

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
