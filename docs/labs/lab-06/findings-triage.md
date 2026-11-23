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

Source: `yakginmomo/pangtao` branch `sprint-2-staging`, `docs/labs/lab-06/partner-cases-execution.md`
(executed 22 Nov 2026 by Chawin and Supichaya). Full report and screenshots remain in their repository.

| Finding ID | Case / Ref | Summary | Severity | Classification | Reason tied to Sprint 1 contract | Disposition / Action |
|---|---|---|:---:|:---:|---|---|
| `F-PB-01` | `UAT-PB-03` / AC-01, BR-04 | Valid amount `1234567.89` rejected by the form as "more than 2 decimal places" | **Major** | **Accepted defect - CLOSED** | BR-04 allows positive amounts up to 9,999,999,999.99 with at most 2 decimals; AC-01 requires creation to succeed. Floating-point check `v*100` misclassifies large valid values. | Fixed (PR #51, commit `90e9fac…`), deployed revision `sd3cdaba1-00010-lxj`. UAT retest 23 Nov: **PASS 6/6 API + UI** (`REQ-20261123-0002/-0003/-0005`). |
| `F-PB-02` | `UAT-PB-04` / AC-02, AC-04, NFR-04 | 200,000-character body returns HTTP 500 `INTERNAL_ERROR` instead of a 4xx | **Minor** | **Accepted defect - CLOSED** | NFR-04 requires no 500/stack trace for invalid input; AC-02/AC-04 require a standard 4xx error code. Body-parser 413 fell through to the generic 500 handler. | Fixed (PR #51), deployed revision `sd3cdaba1-00010-lxj`. UAT retest 23 Nov: **PASS**, 400 `VALIDATION_ERROR` with/without session; 1,001-char description and 151-char title rejected, 1,000-char accepted. Deviation 2b accepted as a documented minor limitation. |
| `F-OUM-02-01` | Partner's first run of our handoff | Case data defect: `10000000.00` listed as invalid although BR-04 allows it | - | **Not a product defect** | Our case data was wrong; product correctly accepted the amount. | Resolved by correcting the handoff to `10000000000.00` (commit `284533d`). Partner's corrected run: 37/37 PASS. |

### Triage Rules (Handout §3.3)
- **Critical / Major:** Blocks Sprint 1 acceptance. Must be corrected via Red/Green regression test, PR review, CI pass, deployment, and independent retest by partner.
- **Minor:** Must be fixed or explicitly accepted by the UAT Team as documented known limitations.
- **Enhancement / Not-defect:** Enhancements outside agreed Sprint 1 scope need not be implemented.
