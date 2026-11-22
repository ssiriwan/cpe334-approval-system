# Lab 6 - Defect Resolution Chain (Part D, 35 pts)

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Handout:** §3.4 (resolution + independent retest), §3.5 (controlled exercise if no real defect)
> **Status:** SKELETON - no correction is claimed until it is actually executed.

This file records the traceable chain from each accepted defect to the corrected, independently
re-tested release. If no legitimate defect arises, §3.5 applies: obtain a controlled exercise from
the TA on an isolated branch and record it here **separately** from the healthy released Sprint 1.

---

## 1. Version chain

| Role | Baseline (tested) | Defective commit(s) | Test change commit | Corrected `main` release | Deployed revision | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Our product (we are Product Team) | `v0.1.0-sprint1` / runtime `f371c23…` | *(none recorded yet)* | - | - | `sd3cdaba1-00009-gxv` (redeploys do not change the code) | Redeploy for partner's UAT-OUM-04: same image digest `8c1ed41d…`, no data reset |
| Partner product (we are UAT Team) | `v0.1.0` / commit `64c98f4…` / `pangtao-00006-cjx` | `UATF-01` is an environment-setup finding, **not** a code defect | - | - | - | Awaiting partner reset + UAT-02 retest |

Merge commits only integrate reviewed changes; the application code reviewed here is unchanged.

---

## 2. Accepted defect chain (one subsection per Issue)

> Template - fill once a real accepted defect exists.

### Issue `#___` - short title

| Field | Value |
| :--- | :--- |
| Reported by / date | |
| Linked UAT case + requirement | |
| Severity (Critical/Major/Minor) and user impact | |
| Classification (accepted defect / duplicate / not-defect / enhancement) | |
| Fix branch (from `sprint-1-staging`) | |
| **RED** test file + test name | |
| RED command | |
| RED actual output (fail reason, counts) | |
| Defective commit tested | |
| **GREEN** command after fix | |
| GREEN actual output (pass, counts) | |
| Regression suite command + result | |
| PR number + substantive review text | |
| CI run link + result | |
| Release PR to `main` + merge commit | |
| Deploy run + corrected revision | |
| Post-deploy smoke check (`/api/health` commit) | |
| Independent retest by UAT Team (tester, date, version, evidence) | |
| Final disposition | |

---

## 3. If no legitimate defect (handout §3.5)

- [ ] All independent UAT cases completed: yes / no
- [ ] UAT Team's documented acceptance decision obtained: pending (see `acceptance.md`)
- [ ] TA contacted for a **controlled defect exercise** on an isolated version/branch: date / channel / response
- [ ] Exercise kept separate from the healthy released Sprint 1: yes / no
- [ ] If the TA has not provided it despite timely notification: record the unresolved dependency here; **do not fabricate a finding** and do not break the live release.

| Exercise step | Evidence | Status |
| :--- | :--- | :--- |
| TA request sent | | Pending |
| Isolated branch/version identified | | Pending |
| RED test reproducing the controlled defect | | Pending |
| GREEN after fix | | Pending |
| Independent retest | | Pending |

---

## 4. Honest status

- No accepted **code** defect has been corrected in this lab so far.
- `UATF-01` is a test-environment finding on the partner's product; the partner was asked to reset
  Alice's baseline and enable a clean UAT-02 retest. It is **not** presented as a code fix.
- The redeploy recorded in §1 was for the partner's UAT-OUM-04; it changed only the Cloud Run revision.
