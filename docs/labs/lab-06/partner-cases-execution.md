# Lab 6 - Partner's Execution of Our UAT Cases (Received)

> **UAT Team:** Chawin and Supichaya (`yakginmomo/pangtao`)
> **Product Team:** Oum and T (our team)
> **Full original report:** <https://github.com/yakginmomo/pangtao/blob/sprint-2-staging/docs/labs/lab-06/partner-cases-execution.md>
> **Raw evidence and screenshots:** <https://github.com/yakginmomo/pangtao/tree/sprint-2-staging/docs/labs/lab-06/evidence>

This is the partner's independent execution of our Part A handoff (`uat-cases-for-partner.md`,
corrected commit `284533d`) plus nine additional cases they wrote from our Sprint 1 contract.
Their full report and all screenshots remain in their public repository; the material below is the
summary needed for our PDF (Part B/D), not a replacement for their record.

## 1. Tested version

- URL: <https://sd3cdaba1-4d7hbszvwq-as.a.run.app>
- Runtime commit: `f371c232715f1185bc46b64ea28335639ae8eabf` (from `GET /api/health`)
- Revision before our redeploy: `sd3cdaba1-00008-2pg`; after our redeploy a new revision was
  created (we recorded `sd3cdaba1-00009-gxv` from `kit.sh status`). The partner were not given the
  revision name at the time and disclose this in their report §9 item 2; we close that item here.

## 2. Results

| Case set | Observations | PASS | FAIL | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `UAT-OUM-01..04` (our cases) | 37 | **37** | 0 | Includes `UAT-OUM-04` before/after our redeploy: history identical, no update/delete endpoint (404) |
| `UAT-PB-01..09` (their additional cases) | 9 | **7** | **2** | `UAT-PB-03` → `F-PB-01` (Major); `UAT-PB-04` → `F-PB-02` (Minor) |
| First (pre-correction) run at 15:42 | 29 | 26 | 3 | Case-data defect `F-OUM-02-01` (our `10000000.00` input was in fact valid); corrected handoff `284533d` resolved it. Both runs retained by the partner. |

The two accepted product defects are triaged in `findings-triage.md` and their RED/GREEN correction
chain is in `defect-chain.md`. Correction is currently local (branch `fix/lab6-uat-defects`) and
awaits reviewed merge, deployment and an independent retest by this UAT Team.

## 3. Coverage feedback from the partner (their §4/§8)

They found that our four cases did not cover all Sprint 1 acceptance criteria and added nine cases
for invalid login, logout/`/me`, large valid amounts, oversized payloads, REJECT paths, decision
validation, queue exclusion, ordering/ownership and URL-based access. After both sets:
`AC-01` PASS for ordinary amounts but FAIL for `1234567.89`; `AC-02`/`AC-04` FAIL for the oversized
body; `AC-AUTH-05` (bcrypt cost / JWT expiry) is a server internal covered by our automated
`TEST-AUTH-05`, not by UAT. We accept this distinction: the gap was in UAT evidence, not necessarily
in the product, and the two actual product failures are being corrected.

## 4. Honest status

- We do **not** sign Decision B until the fixes are deployed and the partner independently re-tests
  `UAT-PB-03`/`UAT-PB-04` (handout §4: no acceptance while critical/major defects are unresolved).
- No data was deleted by either team; `requestNo` values created by the partner are listed in their
  report §7 for post-grading reset.
- The partner redacted login bodies in all evidence files; no password or cookie value is present.
