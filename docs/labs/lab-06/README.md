# Lab 6 - Evidence Index

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Roles (handout §2):** Product Team for **our** app (partner tests us) and UAT Team for **the partner's** app (we test them).
> **Partner:** `yakginmomo/pangtao` - <https://github.com/yakginmomo/pangtao>
> **Submission:** `lab6_sec1_ปลวกแดง.pdf` (Parts A-D, LEB2, **29 Nov 2026 23:59** - deadline extended by the instructor)

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
| #37 | Independently execute cases on pangtao Cloud | B | Closed (Merged PR #48, #50) |
| #38 | Run partner-supplied cases on our Cloud release | B / D | In progress |
| #39 | Defect reporting and triage, both directions | C | In progress (Outgoing closed, Incoming pending) |
| #40 | RED/GREEN fix, reviewed release, independent retest, decision | D | Pending partner report |
| #41 | Assemble docs and submit PDF | All | In progress |
| #44 | Correct Part A: author cases for OUR product | A | Closed |

## Documents (this folder)

| File | Content | Part | Status |
| :--- | :--- | :---: | :---: |
| `uat-cases-for-partner.md` | Our authored cases `UAT-OUM-01..04` for our app, with full fields and handoff (partner executes them) | A | Complete (Merged PR #46, #47) |
| `review-partner.md` | Source-level review of the partner repo, scope, CI/CD and version | A/B support | Complete |
| `execution-results-partner.md` | Our independent execution results covering partner's 8 UAT cases with actual results, checkpoints, and evidence IDs | B | Complete (100% PASS, 20 evidence files) |
| `partner-cases-execution.md` | Partner-authored cases executed on our product (to be filled) | B / D | Pending |
| `findings-triage.md` | Outgoing reports (`UATF-01` resolved) + incoming findings table | C | In progress |
| `defect-chain.md` | RED/GREEN, review, CI, release, retest | D | Skeleton (ready for real or controlled defect) |
| `acceptance.md` | Both independent decisions, contributions, AI use, limitations | D | Decision A Accepted; Decision B Pending |
| `evidence/` | Text logs and captures with `EV-UAT-00..08`, `EV-PRE-01`, and `EV-OUM-*` IDs | A-D | Complete for Part B (20 evidence files committed) |
| `handoff-message.md` | Ready-to-send message with the two requests (run ours; send us yours) | A/B | Complete |

## Version table

| Role | Tag / baseline | Commit | Deployed revision | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Our product (Product Team) | `v0.1.0-sprint1` | runtime `f371c23…` | `sd3cdaba1-00009-gxv` | Redeployed for partner's UAT-OUM-04; same image digest `8c1ed41d…`, no data reset; confirmed live at <https://sd3cdaba1-4d7hbszvwq-as.a.run.app> |
| Partner product (UAT target) | `v0.1.0` (baseline `bec5575…`) | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (PR #40) | `pangtao-00006-cjx` (image digest `sha256:0c479894...`) | Subtitle marker "(67)"; `/api/v1/health` omits commit so corroborated via (67) marker + commit + revision; confirmed live at <https://pangtao-vowtduxdha-as.a.run.app> |

## Execution summary (Part B)

- Partner's authored UAT plan `uat.md` (8 cases) and private seed credentials were received.
- Independent execution was carried out on 22 Nov 2026 by Siriwan (`67070501075`) and Thanabun (`67070501021`).
- Initial execution (16:15–16:25): **7 cases PASS**, **1 case BLOCKED** (`UAT-02` on unreset DB, reported as `UATF-01`).
- Retest execution (21:35–21:40) after partner reset Cloud Run database: **All 8 cases PASS** (100% pass rate, 0 FAIL, 0 BLOCKED).
- Final Acceptance Decision: **ACCEPTED (Sprint 1 Complete)**. All functional and business rule requirements verified on live Cloud Run.
- Our Cloud Run was redeployed for the partner's UAT-OUM-04: revision `sd3cdaba1-00008-2pg` → `sd3cdaba1-00009-gxv`, same image digest, health commit unchanged, no data reset (Issue #38 comment).
