# Lab 6 handoff message - send to the Pangtao team (copy/paste)

Channel: private message / agreed handoff with the partner. Do **not** include any password here.

---

Subject: Lab 6 - UAT handoff (our cases for you to run + request for yours)

Hi Pangtao team,

For Lab 6 we exchange roles. We are the **Product Team** for our Approval System and the **UAT Team**
for your Pangtao release.

## 1. Please run our Sprint 1 UAT cases on our Cloud release

Cases (with IDs, requirement references, purpose, role, preconditions, synthetic inputs, numbered
actions, specific expected results and evidence IDs):

**https://github.com/ssiriwan/cpe334-approval-system/blob/docs/36-correct-part-a/docs/labs/lab-06/uat-cases-our-product.md**

- Public URL: <https://sd3cdaba1-4d7hbszvwq-as.a.run.app>
- Baseline: tag `v0.1.0-sprint1`; runtime commit `f371c232715f1185bc46b64ea28335639ae8eabf` (confirmed
  by `GET /api/health`); `main` HEAD `eeeda0c…` is a docs-only `[skip ci]` merge, so no new deployment.
- Scope: **Sprint 1 only** - auth, request creation, My Requests/data isolation, assigned review and
  decision, self-approval/state guards, append-only history. Sprint 2/3 features are out of scope.
- Accounts (labels only; passwords sent privately): `oum.requester@cpe334.local` (REQUESTER),
  `t.reviewer@cpe334.local` (REVIEWER, primary), `manager.hybrid@cpe334.local` (REVIEWER, for access tests).
- Sequence: run `UAT-OUM-01` first, then `02` and `03`; run `04` **last**, after our agreed redeploy.
  Sprint 1 has no delete endpoint, so please return the list of `requestNo` values you created.

Please record case ID, tester name, date/time, tested version, inputs, **actual** result (not copied
from expected), PASS/FAIL/BLOCKED and evidence IDs, and return any FAIL as a defect report with
version, steps, expected/actual, severity by user impact and evidence.

## 2. Please send us your Sprint 1 UAT cases

As our UAT Team, we need the cases **you authored for your own product** so we can execute them on
your Cloud release (handout §3.2: "Execute the other Product Team's prepared Sprint 1 cases").
Please send them with the tested release/tag, deployed revision, account labels and credentials
privately, and notify us before any redeploy. We already recorded the availability and
unauthenticated-401 checks; the credential-dependent cases stay BLOCKED until we receive them.

If anything is unclear, please tell us before testing so expected behaviour is unambiguous.

Thanks,
Oum & T (67070501075 / 67070501021)
