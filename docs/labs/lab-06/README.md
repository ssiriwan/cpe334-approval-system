# Lab 6 - Evidence Index

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Roles (handout §2):** Product Team for **our** app (partner tests us) and UAT Team for **the partner's** app (we test them).
> **Partner:** `yakginmomo/pangtao` - <https://github.com/yakginmomo/pangtao>
> **Submission:** `lab6_sec1_ปลวกแดง.pdf` (Parts A-D, LEB2, 22 Nov 2026 23:59)

## Role map - which cases belong to which part

| Who authors | Whose app | Who executes | Document | Handout part |
| :--- | :--- | :--- | :--- | :--- |
| **We** (Product Team) | **Our** Approval System | **Partner** | [`uat-cases-our-product.md`](./uat-cases-our-product.md) | **A - our handoff** |
| **Partner** (Product Team) | Pangtao | **We** | partner's cases (to be supplied) | **B - our execution** |
| We (supplementary design) | Pangtao | We | [`uat-cases-for-partner.md`](./uat-cases-for-partner.md) | supports B, **not** a Part A substitute |

The handout says: "Give another team an executable UAT plan for **your** delivered Sprint 1 product"
(§1) and "Prepare Sprint 1 UAT cases and safe test accounts for **your application**" (§2). The
Personal Finance paragraph in §3.1 is guidance for the team whose own product is Personal Finance.

## Issues (label `lab6`, board <https://github.com/users/ssiriwan/projects/6>)

| Issue | Workstream | Handout part |
| :---: | :--- | :--- |
| #36 | Initial (superseded) case authoring | - |
| #37 | Independently execute cases on pangtao Cloud | B |
| #38 | Run partner-supplied cases on our Cloud release | B / D |
| #39 | Defect reporting and triage, both directions | C |
| #40 | RED/GREEN fix, reviewed release, independent retest, decision | D |
| #41 | Assemble docs and submit PDF | All |
| #44 | Correct Part A: author cases for OUR product | A |

## Documents (this folder)

| File | Content | Part |
| :--- | :--- | :--- |
| `uat-cases-our-product.md` | Our five authored cases `UAT-OUM-01..05`-style (01..04) for our app, with full fields and handoff | A |
| `review-partner.md` | Source-level review of the partner repo, scope, CI/CD and version | A/B support |
| `uat-cases-for-partner.md` | Supplementary independent UAT design for pangtao (`UAT-PT-01..05`) | B support only |
| `execution-results-partner.md` | Our independent execution results with actual results and evidence IDs | B |
| `partner-cases-execution.md` | Partner-authored cases executed on our product (to be filled) | B / D |
| `findings-triage.md` | Outgoing reports + incoming findings table (to be filled) | C |
| `defect-chain.md` | RED/GREEN, review, CI, release, retest (to be filled) | D |
| `acceptance.md` | Final independent decision, contributions, AI use, limitations | D |
| `evidence/` | Screenshots and logs with `E-PT-*` / `E-OUM-*` IDs | A-D |
| `handoff-message.md` | Ready-to-send message with the two requests (run ours; send us yours) | A/B |

## Version table

| Role | Tag / baseline | Commit | Deployed revision | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Our product (Product Team) | `v0.1.0-sprint1` | runtime `f371c23…` (= `main` before the docs-only merge) | `sd3cdaba1-00007-h8g` | `main` HEAD `eeeda0c…` is `[skip ci]` docs only, so the runtime did not change |
| Partner product (UAT target) | `v0.1.0` (baseline `bec5575…`) | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (partner-confirmed `main` commit) | same | Live at <https://pangtao-vowtduxdha-as.a.run.app> |

## Honest status

- Completed: partner review, our Part A cases, the supplementary pangtao design, and the first Cloud session
  (health/UI PASS; unauthenticated 401s).
- Pending: the partner must **run our cases** and **send us their cases**; without their credentials
  our credential-dependent cases remain BLOCKED and the TA must be notified if they stay unavailable.
- No finding, acceptance decision or correction is claimed in this index until actually executed.
