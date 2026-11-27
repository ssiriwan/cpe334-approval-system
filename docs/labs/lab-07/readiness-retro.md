# Lab 7 - Release Readiness Checklist & Retrospective (Part C & D)

> **Team:** Oum (`67070501075`, `@ssiriwan`) & T (`67070501021`, `@thhanabun`)  
> **Release Target:** `main` (Commit `a5b9636`) / Google Cloud Run Revision `sd3cdaba1-00012-skm`  
> **Evaluated Release:** v1.1.0-lab7 (CR-04 Dynamic Reviewer Assignment)  
> **Date:** 27 November 2026

---

## 1. Release Readiness Checklist (Maintained Sprint 1 Scope)

### Final Verdict: **READY FOR RELEASE**

| Checklist Item | Requirement & Standard | Evidence & Current Status | Verdict |
| :--- | :--- | :--- | :---: |
| **Submitted / Deployed Version** | Clean tag on `main` HEAD matching deployed container commit | Commit `a5b9636` verified by `GET /api/health` on Cloud Run revision `sd3cdaba1-00012-skm` | **PASS** |
| **Open Defect Classification** | Zero Critical or Major open defects; all known issues documented | 0 Critical, 0 Major, 0 Minor open defects. Historical UAT defects (F-PB-01/02) fully resolved | **PASS** |
| **Automated Test Results** | 100% test pass rate across unit, integration, and regression suites | 43/43 tests passing (0 failed, 0 skipped) across 7 suites (`requests`, `review`, `auth`, `health`, UI) | **PASS** |
| **Live Deployed Verification** | Post-deployment verification of changed and preserved paths on Cloud Run | Both `REQ-20261127-0001` (6000 ฿ ➔ Manager) and `REQ-20261127-0002` (1500 ฿ ➔ T Reviewer) verified | **PASS** |
| **Technical Debt Assessment** | Known debt items documented with clear mitigation strategies | 3 non-blocking items cataloged with remediation plans (see Section 2 below) | **PASS** |
| **Configuration & Secrets** | Zero secrets in Git; production credentials managed in Secret Manager | WIF keyless auth used; DB and JWT credentials injected via Google Secret Manager | **PASS** |
| **Documentation & Run Instructions** | Contract v1.1, SRS/SDS excerpts, and evidence records up to date | `docs/labs/lab-07/` complete with full version trace and reproducible commands | **PASS** |
| **CI/CD Quality Gate** | All PR and deployment workflows succeed on official runners | 5/5 GitHub Actions runs succeeded (`CI quality gate` + `Deploy demo` = 100% green) | **PASS** |

---

## 2. Technical Debt Catalog

| Debt ID | Category | Description | Impact | Remediation Plan & Owner |
| :---: | :--- | :--- | :--- | :--- |
| **TD-01** | Architecture | Hardcoded fallback reviewer emails (`manager.hybrid@cpe334.local`, `t.reviewer@cpe334.local`) in `request.service.ts`. | Low (demo environment has fixed users). | Refactor reviewer routing to a configurable database table / environment mapping in Sprint 2. *(Owner: T)* |
| **TD-02** | Testing | Reliance on `vi.useFakeTimers({ toFake: ['Date'] })` in unit tests for time boundary verification. | Low (deterministic for CI, but requires careful date mocking). | Abstract time provider into an injectable service clock (`IClock`) across all service layers. *(Owner: Oum)* |
| **TD-03** | CI Pipeline | Playwright browser UI tests run locally but are not yet wired into the headless GitHub Actions CI runner. | Medium (UI regressions must be verified via React Testing Library). | Add headless Playwright container step to `ci-docker.yml` for nightly end-to-end verification. *(Owner: Oum)* |

---

## 3. Retrospective (Three Core Questions)

1. **What helped?**  
   Strict adherence to the Test-First (TDD) RED/GREEN sequence coupled with `vi.useFakeTimers` in Vitest immediately exposed subtle timezone boundary traps (Asia/Bangkok offset) and prevented self-approval regressions before implementation code reached staging.

2. **What hurt?**  
   The timing mismatch between the initial implementation and the formal teammate contract sign-off required resetting staging and reopening PR #63 to ensure an honest, auditable peer-review record without invented approval timestamps.

3. **What will change?**  
   For the final project release, we will configure automated GitHub branch protection rules requiring an approved contract specification review before any feature branch PR can be merged, and centralize all role-reviewer routing into an injectable configuration module.

---

## 4. Team Contribution Table (50/50 Balanced Partnership)

| Team Member | Student ID | GitHub | Primary Role & Contributions in Lab 7 |
| :--- | :---: | :---: | :--- |
| **Siriwan Yindeepot (Oum)** | `67070501075` | `@ssiriwan` | • Authored 6 automated boundary/security tests (RED commit `2b56a7b`).<br>• Implemented bounded reviewer escalation logic (GREEN commit `fede788`).<br>• Configured Vitest fake timers and verified 43/43 regression suite.<br>• Reviewed and merged Release PR #64 into `main`.<br>• Executed live Cloud Run verification tests (`REQ-20261127-0001` & `0002`). |
| **Thanaboon Tikaew (T)** | `67070501021` | `@thhanabun` | • Authored Part A change request, impact analysis, and contract v1.1 (PR #61).<br>• Conducted substantive peer review on PR #63 with CHANGES_REQUESTED.<br>• Authored documentation refinements and process disclosures (commit `64d02c6`).<br>• Opened Release PR #64 from `lab7-staging` to `main`.<br>• Verified Google Cloud Run deployment pipeline and health endpoints. |

Both team members contributed actively to requirements analysis, TDD execution, cross-reviewing pull requests, verifying Cloud Run deployments, and assembling the final report. Neither author approved their own pull requests.

---

## 5. AI-Use Declaration & Known Limitations

### AI-Use Declaration
AI coding assistance (Google Antigravity / Gemini) was utilized during Lab 7 for:
1. Drafting boilerplate contract revision templates and Markdown tables based on course handouts.
2. Formulating Vitest fake timer mock syntax (`{ toFake: ['Date'] }`) to prevent `bcrypt.compare` timeouts.
3. Structuring LaTeX report formatting and table alignment.

**Safety & Integrity Verification:** Every piece of code, automated test assertion, and evidence log was executed, audited, and verified locally by the human authors. Zero production credentials, Google Cloud secret values, or database passwords were pasted into agent prompts or committed to Git repositories.

### Known Limitations
1. **Contract Review Sequence:** As honestly disclosed in `README.md` and PR #63, the teammate review of the revised contract took place during PR #63 review rather than strictly prior to writing the implementation commit. No approval date was fabricated.
2. **Instructor/TA Approval:** Per updated course instructions, instructor/TA pre-approval was waived for Lab 7 and is honestly recorded as **NOT AVAILABLE**.
3. **Database Migration:** Zero schema changes were required for CR-04; historical requests created prior to Lab 7 retain their original reviewer assignment and remain fully queryable.
