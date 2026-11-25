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
| Our product (we are Product Team) | `v0.1.0-sprint1` / runtime `f371c23…` | code at `f371c23` (F-PB-01, F-PB-02) | RED `97a01a6`; GREEN merged via PR #51 (`90e9fac…`) | fix merged to `lab5-staging` as `90e9fac…` (release PR to `main` pending) | `sd3cdaba1-00010-lxj`, image `sha256:77c3445e…`, health commit `90e9fac…` | Deployed 23 Nov 03:59 UTC; live smoke PASS for both fixes; partner retest pending |
| Partner product (we are UAT Team) | `v0.1.0` / commit `64c98f4…` / `pangtao-00006-cjx` | `UATF-01` is an environment-setup finding, **not** a code defect | - | - | - | Awaiting partner reset + UAT-02 retest |

Merge commits only integrate reviewed changes; the application code reviewed here is unchanged.

---

## 2. Accepted defect chain (one subsection per Issue)

### Issue `F-PB-01` - valid 2-decimal amount rejected (Major)

| Field | Value |
| :--- | :--- |
| Reported by | Chawin (partner UAT Team), 22 Nov 2026 16:32, via `partner-cases-execution.md` |
| Case / requirement | `UAT-PB-03` · AC-01, BR-04 |
| Severity / impact | Major - legitimate amounts from ~1,000,000 with 2 decimals are refused; requester told valid input is wrong |
| Classification | Accepted defect (not an enhancement) |
| **RED** test | `server/tests/requests.test.ts` → `F-PB-01 (AC-01, BR-04): a valid 2-decimal amount 1234567.89 is accepted`; `client/src/pages/Requests.test.tsx` → `F-PB-01: accepts 1234567.89 and sends it as a decimal string` |
| RED command / output | `npx vitest run --config vitest.config.ts` → 3 failed / 34 passed (both F-PB-01 tests failing); see `evidence/E-FPB-red-green.txt` |
| Root cause | Client and server used floating-point multiplication (`v*100`); `1234567.89*100 = 123456788.99999999` |
| Fix | Validate a decimal **string** with `^\d+(\.\d{1,2})?$`; client sends `amount` as a string; server accepts string or number and converts after validation |
| **GREEN** command / output | `npx vitest run --config vitest.config.ts` → **37 passed / 0 failed / 0 skipped**; `npm run build` passed |
| PR / review / CI | PR #51 (`lab6`), reviewed and merged by Oum; CI green |
| Deployment / retest | Deployed 23 Nov 03:59 UTC, revision `sd3cdaba1-00010-lxj`, health `90e9fac…`; live smoke `201 REQ-20261123-0001` with amount 1234567.89. Partner retest of `UAT-PB-03` pending |

### Issue `F-PB-02` - oversized body returns 500 (Minor)

| Field | Value |
| :--- | :--- |
| Reported by | Chawin (partner UAT Team), 22 Nov 2026 17:31 |
| Case / requirement | `UAT-PB-04` · AC-02, AC-04, NFR-04 |
| Severity / impact | Minor - not reachable from the UI; no data changed or exposed, but an unauthenticated client receives an unexpected 500 |
| Classification | Accepted defect |
| **RED** test | `server/tests/requests.test.ts` → `F-PB-02 (AC-02, NFR-04): an oversized body returns a 4xx error, never 500` |
| RED output | 500 `INTERNAL_ERROR` → RED (see `evidence/E-FPB-red-green.txt`) |
| Root cause | `express.json()` throws `entity.too.large` before routing; the error handler only mapped `SyntaxError`/`ZodError`/`AppError` |
| Fix | Map `entity.too.large` to `400 VALIDATION_ERROR` with the standard error shape |
| **GREEN** output | 37/37 tests pass; build passes |
| PR / deployment / retest | Same PR #51; deployed revision `sd3cdaba1-00010-lxj`; live smoke returned 400 `VALIDATION_ERROR` for the 200k body; partner retest of `UAT-PB-04` pending |

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
