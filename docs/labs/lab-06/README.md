# Lab 6 - Evidence Index

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Lab 6 topics:** (1) Product Team - our Sprint 1 product is tested by the partner;
> (2) UAT Team - we independently test the partner's Sprint 1 product.
> **Partner:** `yakginmomo/pangtao` - <https://github.com/yakginmomo/pangtao>
> **Submission:** `lab6_sec1_ปลวกแดง.pdf` (Parts A-D, LEB2, 22 Nov 2026 23:59)

## Issues (label `lab6`, board <https://github.com/users/ssiriwan/projects/6>)

| Issue | Workstream | Handout part |
| :---: | :--- | :--- |
| #36 | Author UAT cases for pangtao + handoff | A |
| #37 | Independently execute those cases on pangtao Cloud | B |
| #38 | Run partner-supplied cases on our Cloud release | B / D |
| #39 | Defect reporting and triage, both directions | C |
| #40 | RED/GREEN fix, reviewed release, independent retest, decision | D |
| #41 | Assemble docs and submit PDF | All |

## Documents (this folder)

| File | Content | Part |
| :--- | :--- | :--- |
| `review-partner.md` | Source-level review, versions, scope, CI/CD risks and handoff requests | A / B |
| `uat-cases-for-partner.md` | Five executable cases `UAT-PT-01..05` with IDs, references, purpose, role, preconditions, inputs, numbered actions, expected results and evidence IDs | A |
| `execution-results-partner.md` | Independent execution results (to be filled) | B |
| `partner-cases-execution.md` | Partner-authored cases executed on our product (to be filled) | B / D |
| `findings-triage.md` | Outgoing reports + incoming findings table (to be filled) | C |
| `defect-chain.md` | RED/GREEN, review, CI, release, retest (to be filled) | D |
| `acceptance.md` | Final independent decision, contributions, AI use, limitations | D |
| `evidence/` | Screenshots and logs with `E-PT-*` / `E-OUM-*` IDs | A-D |

## Version table (fill as the lab progresses)

| Role | Tag / baseline | Commit | Deployed revision | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Our product (Product Team) | `v0.1.0-sprint1` | `f371c23…` | `sd3cdaba1-00007-h8g` (TBC) | Live at <https://sd3cdaba1-4d7hbszvwq-as.a.run.app> |
| Partner product (UAT target) | `v0.1.0` (baseline `bec5575…`) | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` | commit on `main`, confirmed by the partner as the deployed version | `GET /api/v1/health` returns `{"status":"ok"}` but does not expose a commit; live at <https://pangtao-vowtduxdha-as.a.run.app> |

## Honest status

- Completed: partner repo review and the five authored cases (#36).
- Pending: private credentials from the partner; the deployed version is the commit on their `main` (`64c98f4…`). If credentials do not arrive, login cases
  are `BLOCKED` with the notification evidence, not silently passed.
- Unauthenticated probes on the partner Cloud URL were executed on 22 Nov 2026 (see `execution-results-partner.md`); the credential-dependent steps are still BLOCKED. No acceptance decision or correction is claimed until actually executed.
