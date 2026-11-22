# Lab 6 - Evidence Index

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Roles (handout §2):** Product Team for **our** app (partner tests us) and UAT Team for **the partner's** app (we test them).
> **Partner:** `yakginmomo/pangtao` - <https://github.com/yakginmomo/pangtao>
> **Submission:** `lab6_sec1_ปลวกแดง.pdf` (Parts A-D, LEB2, 22 Nov 2026 23:59)

## Role map - which cases belong to which part

| Who authors | Whose app | Who executes | Document | Handout part |
| :--- | :--- | :--- | :--- | :--- |
| **We** (Product Team) | **Our** Approval System | **Partner** | [`uat-cases-for-partner.md`](./uat-cases-for-partner.md) | **A - our handoff** |
| **Partner** (Product Team) | Pangtao | **We** | partner's cases: [`uat.md`](https://github.com/yakginmomo/pangtao/blob/chore/lab6-uat-doc/docs/labs/lab-06/uat.md) | **B - our execution** |

The handout says: "Give another team an executable UAT plan for **your** delivered Sprint 1 product"
(§1) and "Prepare Sprint 1 UAT cases and safe test accounts for **your application**" (§2). The
Personal Finance paragraph in §3.1 is guidance for the team whose own product is Personal Finance.

## Issues (label `lab6`, board <https://github.com/users/ssiriwan/projects/6>)

| Issue | Workstream | Handout part | Status |
| :---: | :--- | :---: | :---: |
| #36 | Initial (superseded) case authoring | - | Closed |
| #37 | Independently execute cases on pangtao Cloud | B | Done / PR open |
| #38 | Run partner-supplied cases on our Cloud release | B / D | In progress |
| #39 | Defect reporting and triage, both directions | C | In progress |
| #40 | RED/GREEN fix, reviewed release, independent retest, decision | D | Pending partner retest |
| #41 | Assemble docs and submit PDF | All | In progress |
| #44 | Correct Part A: author cases for OUR product | A | Closed |

## Documents (this folder)

| File | Content | Part | Status |
| :--- | :--- | :---: | :---: |
| `uat-cases-for-partner.md` | Our authored cases `UAT-OUM-01..04` for our app, with full fields and handoff (partner executes them) | A | Complete (Merged PR #46, #47) |
| `review-partner.md` | Source-level review of the partner repo, scope, CI/CD and version | A/B support | Complete |
| `execution-results-partner.md` | Our independent execution results covering partner's 8 UAT cases with actual results, checkpoints, and evidence IDs | B | Complete (`EV-UAT-00` to `08`) |
| `partner-cases-execution.md` | Partner-authored cases executed on our product (to be filled) | B / D | Pending |
| `findings-triage.md` | Outgoing reports (`UATF-01`) + incoming findings table | C | In progress |
| `defect-chain.md` | RED/GREEN, review, CI, release, retest | D | Pending |
| `acceptance.md` | Final independent decision, contributions, AI use, limitations | D | Pending |
| `evidence/` | Screenshots and logs with `EV-UAT-*` / `E-OUM-*` IDs | A-D | Complete for Part B |
| `handoff-message.md` | Ready-to-send message with the two requests (run ours; send us yours) | A/B | Complete |

## Version table

| Role | Tag / baseline | Commit | Deployed revision | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Our product (Product Team) | `v0.1.0-sprint1` | runtime `f371c23…` | `sd3cdaba1-00008-2pg` | Confirmed live at <https://sd3cdaba1-4d7hbszvwq-as.a.run.app> |
| Partner product (UAT target) | `v0.1.0` (baseline `bec5575…`) | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (PR #40) | `pangtao-00006-cjx` (image digest `sha256:0c479894...`) | Subtitle marker "(67)"; confirmed live at <https://pangtao-vowtduxdha-as.a.run.app> |

## Execution summary (Part B)

- Partner's authored UAT plan `uat.md` (8 cases) and private seed credentials were received.
- Independent execution was carried out on 22 Nov 2026, 16:15–16:25 Bangkok time by Siriwan (`67070501075`) and Thanabun (`67070501021`).
- Results: **7 cases PASS** (UAT-01, 03, 04, 05, 06, 07, 08). **1 case BLOCKED** (UAT-02) because the partner deployment contained unreset baseline data on Alice (`UATF-01`), preventing clean opening balance creation, though its underlying validation, conflict (409) and boundary logic were confirmed.
