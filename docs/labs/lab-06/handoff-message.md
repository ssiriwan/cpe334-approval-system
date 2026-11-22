# Lab 6 handoff message - send to the Pangtao team (copy/paste)

Channel: private message / agreed handoff with the partner. Do **not** include passwords here.

---

Subject: Lab 6 UAT cases for Pangtao (from team Oum & T)

Hi Pangtao team,

For Lab 6 we are the UAT Team for your Sprint 1 release and you are the Product Team for our app.
We reviewed `yakginmomo/pangtao` and authored five executable UAT cases for your product:

**https://github.com/ssiriwan/cpe334-approval-system/blob/docs/36-lab6-uat-cases/docs/labs/lab-06/uat-cases-for-partner.md**

They cover normal journey with explicit money movement, allocation/boundary rejection, cross-user
and ADMIN access denial, persistence after restart/redeploy, and admin user lifecycle. Each case has
an ID, requirement reference, purpose, role, preconditions, synthetic inputs, numbered actions and
specific expected results, plus evidence IDs.

Details:
- Tested scope: **Sprint 1 only** (auth, admin users, accounts/balances, opening balance, payment,
  receipt, history, summary). Tag `v0.1.0`, commit `bec5575…`; your `main` HEAD at our review was
  `64c98f4…`.
- Public URL: https://pangtao-vowtduxdha-as.a.run.app
- Cases are sequential: run `UAT-PT-01` first, then `02`, `03`, `05`; run `04` **last**, after the
  redeploy we agreed.

Could you please:
1. Confirm the **exact deployed revision / running commit** (we could not read a commit from
   `/api/v1/health` and your issues #27/#28 are still open).
2. Send the three demo passwords **privately** (Alice, Bob, Admin). Do not post them in an issue,
   chat transcript, or PDF. If we do not receive them, our login cases must be recorded as BLOCKED
   and we will notify the TA as the handout requires.
3. Run these cases as your own self-check and return any findings in the defect-report format
   (Issue ID, version, linked case, steps, expected, actual, severity with user impact, evidence).
4. Notify us before any redeploy, and perform the agreed redeploy at the end so `UAT-PT-04` can be
   executed with before/after evidence.

In return, we will send you our own Sprint 1 handoff and cases for our app so your team can act as
the independent UAT Team for us.

Thanks,
Oum & T (67070501075 / 67070501021)
