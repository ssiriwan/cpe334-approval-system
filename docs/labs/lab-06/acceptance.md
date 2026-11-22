# Lab 6 - UAT Acceptance Decision and Handoff Record

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Partner:** ผิงโหด - `yakginmomo/pangtao`
> **Handout:** §3.4 / §3.5 (one final decision, only the UAT Team may confirm), §4 (front matter), §4.2 (contribution, AI use, limitations)
> **Status:** SKELETON - no acceptance is claimed until the retest and the partner's report exist.

---

## 1. Decision A - we are the UAT Team for Pangtao

| Field | Value |
| :--- | :--- |
| **Decision** | **PENDING - NOT YET ACCEPTED** (required case UAT-02 is BLOCKED; handout §4 forbids acceptance while a required test is BLOCKED) |
| Tested release | Pangtao `v0.1.0`, commit `64c98f4fcd293fb67f0d32b1db75943dfbf2c749`, revision `pangtao-00006-cjx`, marker `(67)` |
| Tester identity | Siriwan (`67070501075`) and Thanabun (`67070501021`), team ปลวกแดง - independent UAT Team |
| Date of execution | 22 Nov 2026, 16:15-16:25 ICT |
| Result summary | 7 of 8 cases PASS; `UAT-02` BLOCKED by `UATF-01` (unreset Alice baseline) |
| Evidence | `execution-results-partner.md`, `evidence/EV-*`, `findings-triage.md` |
| Conditions to sign | Partner resets Alice's baseline on Cloud Run → we re-run UAT-02 to PASS → we record the final decision below |

### Final decision (fill after the retest)

```
Accepted / Accepted with documented minor limitations / Not Accepted
Reason:
Version tested (commit + revision + marker):
Tester identity and date:
Evidence references:
Conditions / accepted minor limitations:
```

---

## 2. Decision B - partner is the UAT Team for our product

| Field | Value |
| :--- | :--- |
| **Decision** | **PENDING - awaiting partner's execution report** |
| Tested release | Our `v0.1.0-sprint1`, runtime commit `f371c232715f1185bc46b64ea28335639ae8eabf`, revision `sd3cdaba1-00009-gxv` (redeploy for UAT-OUM-04; same image digest `8c1ed41d…`, no data reset) |
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
| Oum (`67070501075`) | UAT case authoring for our product; independent execution of partner cases UAT-01/03/05/07; peer review of PR #48; release/redeploy coordination | Issues #36/#44, PRs #42/#45/#47, `execution-results-partner.md` |
| T (`67070501021`) | Partner repo review; independent execution of cases UAT-02/04/06/08; finding `UATF-01`; evidence files; docs assembly | `review-partner.md`, `findings-triage.md`, `evidence/EV-*` |

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

- `UAT-02` remains BLOCKED until the partner resets Alice's baseline; no acceptance is signed meanwhile.
- Partner's incoming findings on our product have not been received; Part C incoming is pending.
- If no legitimate code defect exists, a TA-controlled exercise must be requested (§3.5); none is claimed here.
- The assessed deployments and both repositories must remain available until grading ends.
- No video is required; the PDF is the single grading surface.
