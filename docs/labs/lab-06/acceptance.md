# Lab 6 - UAT Acceptance Decision and Handoff Record

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Partner:** ผิงโหด - `yakginmomo/pangtao`
> **Handout:** §3.4 / §3.5 (one final decision, only the UAT Team may confirm), §4 (front matter), §4.2 (contribution, AI use, limitations)
> **Status:** Decision A (Pangtao) ACCEPTED (100% PASS); Decision B (Our App) PENDING partner report.

---

## 1. Decision A - we are the UAT Team for Pangtao

| Field | Value |
| :--- | :--- |
| **Decision** | **ACCEPTED** (All 8 required UAT cases PASS; finding `UATF-01` verified resolved on clean database reset) |
| Tested release | Pangtao `v0.1.0`, commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx`, marker `(67)` |
| Tester identity | Siriwan (`67070501075`) and Thanabun (`67070501021`), team ปลวกแดง - independent UAT Team |
| Date of execution | 22 Nov 2026, 16:15–16:25 (initial) & 21:35–21:40 ICT (retest on clean database) |
| Result summary | 8 of 8 cases PASS (100% pass rate, 0 FAIL, 0 BLOCKED); `UATF-01` resolved & closed |
| Evidence | `execution-results-partner.md`, `evidence/EV-UAT-*`, `evidence/EV-PRE-01.txt`, `findings-triage.md` |
| Conditions / limitations | None. All Sprint 1 functional and business rule requirements passed cleanly. |

### Final decision (Signed)

- **Verdict:** **Accepted**
- **Reason:** All 8 test cases from `docs/labs/lab-06/uat.md` passed with exact satang integer calculation, correct split transactions, negative balance support, multi-tenant isolation (IDOR protected), and role-based access control. Initial database setup block on Alice was reset by partner and verified 100% PASS on retest.
- **Version tested:** Commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx`, subtitle marker `(67)`
- **Tester identity and date:** Siriwan (`67070501075`) & Thanabun (`67070501021`), team ปลวกแดง, 22 Nov 2026 21:40 ICT
- **Evidence references:** `EV-PRE-01`, `EV-UAT-00` through `EV-UAT-08-b` (20 files under `docs/labs/lab-06/evidence/`)
- **Conditions / accepted minor limitations:** None.

---

## 2. Decision B - partner is the UAT Team for our product

| Field | Value |
| :--- | :--- |
| **Decision** | **PENDING - 2 accepted defects fixed, deployed and smoke-tested; awaiting the partner's independent retest** |
| Tested release | Original partner run: `v0.1.0-sprint1` / commit `f371c23…` / revision `sd3cdaba1-00009-gxv`. Corrected release (F-PB-01/F-PB-02): commit `90e9fac…`, revision `sd3cdaba1-00010-lxj`, image `sha256:77c3445e…`, deployed 23 Nov 03:59 UTC. |
| UAT Team (signatory) | Partner team ผิงโหด - to be confirmed by their report |
| Cases supplied to them | `uat-cases-for-partner.md` (UAT-OUM-01..04) |
| Our obligations | Triage every incoming finding in `findings-triage.md`; correct release-blocking defects with RED/GREEN (`defect-chain.md`); redeploy; request independent retest |

### Final decision (fill when the partner reports)

```
Accepted / Accepted with documented minor limitations / Not Accepted
Reason:
Version tested (commit + revision):
UAT Team signatory (name/team) and date:
Evidence references:
Conditions / accepted minor limitations:
```

---

## 3. Contribution table (R-11 / §4.2)

| Member | Contribution in Lab 6 | Evidence |
| :--- | :--- | :--- |
| Oum (`67070501075`) | UAT case authoring for our product; independent execution of partner cases UAT-01/03/05/07; peer review of PR #48, #49, #50; release/redeploy coordination | Issues #36/#44, PRs #42/#45/#47/#50, `execution-results-partner.md` |
| T (`67070501021`) | Partner repo review; independent execution of cases UAT-02/04/06/08; finding `UATF-01`; Part D skeletons; evidence files; docs assembly | `review-partner.md`, `findings-triage.md`, `evidence/EV-*`, PR #49 |

Pair work: both members executed cases and reviewed each other's work; the partner team also has two named testers.

---

## 4. AI-use declaration

AI agents were used under human supervision for: drafting the UAT case documents, reviewing the partner
repository, formatting the execution/evidence records, and preparing this PDF. No AI agent changed
billing, IAM, or a database on its own; the Cloud Run redeploy was executed by a human with the
portal-provided kit. No secret, password, token, or connection string was pasted into an agent chat,
Git, or the PDF. Every proposed command was read before use.

---

## 5. Known limitations / honest disclosure

- `UAT-02` was cleanly retested and PASSED after partner database reset; Decision A signed as **Accepted**.
- Partner's incoming findings on our product have not yet been received; Part C incoming is pending.
- If no legitimate code defect exists, a TA-controlled exercise must be requested (§3.5); none is claimed here.
- The assessed deployments and both repositories must remain available until grading ends.
- No video is required; the PDF is the single grading surface.
