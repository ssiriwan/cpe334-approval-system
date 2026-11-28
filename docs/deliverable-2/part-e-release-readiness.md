# Part E — Integrated Release Candidate and Readiness

> **Deliverable 2 Part E (15 pts)** · **Issue #74** · Candidate: `v0.2.0-sprint2` / `125a6cb`
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Date:** 28 Nov 2026

---

## 1. Release identification

| Item | Value |
| :--- | :--- |
| Accepted Sprint 1 baseline | `v0.1.0-sprint1` / `f35ad24` |
| Sprint 2 integration branch | `sprint-2-staging` at `b0743dc` |
| Release PR | #94, `sprint-2-staging → main`, reviewed by teammate, CI pass |
| Release merge commit | `125a6cb9809f070503093d3a4567a31bb04811c3` |
| Release tag | **`v0.2.0-sprint2`** |
| Deploy workflow | `deploy.yml` run `46141649246`, **success** |
| Cloud Run service/revision | `sd3cdaba1` / **`sd3cdaba1-00014-zjj`** (100% traffic) |
| Image tag / digest | `125a6cb98…` / `sha256:8335108b4218f367efff9fb5e05094522cd0e790217baea2de276ce55ff1ab44` |
| Public URL | `https://sd3cdaba1-4d7hbszvwq-as.a.run.app` |

## 2. Build, test and CI evidence (exact candidate)

| Check | Command / run | Result |
| :--- | :--- | :--- |
| Full automated suite | `npm test` | **14 files / 75 tests passed**, 0 failed, 0 skipped |
| Build | `npm run build` | clean (client + server TypeScript) |
| CI quality gate (staging) | `ci-docker.yml` @ `b0743dc` | success — migrate deploy, seed, test, build, Docker image, `/api/health` smoke |
| CI quality gate (release PR) | `ci-docker.yml` @ `125a6cb` | success |
| Deploy smoke | `deploy.yml` step "Smoke test public URL" | `/api/health` HTTP 200, frontend `/` HTTP 200, ALL SMOKE TESTS PASSED |

No test was disabled, skipped or weakened. The F-06 suite clock was frozen in `00bc3ba` to keep CR-04 assignment deterministic after 18:00 ICT.

## 3. Cross-feature checks on the integrated candidate

| Check | Evidence | Result |
| :--- | :--- | :--- |
| Sprint 1 critical journey still works | `docs/deliverable-2/part-a-continuity.md`, EV-D2-A-01..05 | PASS |
| BR-01 at stage 1 and stage 2 | TEST-08, TEST-16.5, EV-D2-C-04 | PASS |
| F-05 read-only history after F-06/F-07 writes | TEST-14.1..14.4, EV-D2-A-03/05 | PASS |
| F-06 resubmit re-resolves reviewer via CR-04 | TEST-15.4 | PASS |
| F-07 queue + F-09 filter co-exist | `review.service.ts` `AND` composition; 75-test suite after two conflict resolves | PASS |
| F-08 attachment authorization after reassignment | TEST-17.4, EV-D2-F08-03 | PASS |
| Append-only history / no delete route | TEST-13, TEST-14.4, TEST-16.6, TEST-17.6 | PASS |
| Data isolation under filters | TEST-18.1, TEST-18.4 | PASS |

## 4. Post-deployment verification

Executed against the public URL after the deploy run completed:

| Check | Method | Observed |
| :--- | :--- | :--- |
| Health + commit match | `GET /api/health` | HTTP 200, `{"status":"ok","commit":"125a6cb9809f070503093d3a4567a31bb04811c3"}` — matches the release tag |
| Protected endpoint without cookie | `GET /api/requests/my` | HTTP 401 `UNAUTHORIZED` |
| Frontend served | deploy smoke step | HTTP 200 with HTML |
| Login with demo account | `POST /api/auth/login` | HTTP 401 `UNAUTHORIZED` — **demo accounts are intentionally not seeded in the production deployment** (`SEED_DEMO_DATA=false` default in `deploy.sh`) |

**Honest note:** the full authenticated journey could not be repeated on the public URL because no demo users exist there by design. The equivalent executed journey on the same code is recorded locally in `docs/deliverable-2/evidence/program-demonstrations.md` (EV-D2-A-01..05) against the migrated database, and the deployed health/commit check proves the tagged code is live. No claim of a live login is made.

## 5. Readiness decision

**READY** for Deliverable 2 assessment of the integrated increment: the release is tagged, deployed, smoke-tested, and the candidate passes the full automated suite with a documented continuity replay.

Outstanding items are explicitly planned, not hidden:
- F-10 admin user/assignment management (contract only, TEST-19.x unexecuted).
- F-11 hardening: p95 measurement, final secret scan, clean-clone deploy recheck (TEST-20.x unexecuted).
- F-09 reporting/aggregation beyond filters.
- Exam-period UAT re-test and final 13 Dec release remain in `docs/sprints/sprint-3/progress-and-remaining-work.md`.

## 6. Known limitations / failed or skipped tests
- No failed or skipped tests on the submitted candidate (75/75).
- Two-stage maximum; `RETURN` from `PENDING_STAGE2` returns `400 INVALID_STATE_TRANSITION`.
- Attachments are append-only (no delete/update) and MIME validation trusts the declared content type.
- Stateless JWT logout clears the cookie but cannot revoke a stolen token.
- No real payment/bank/email/SMS integration; all data synthetic; no real secret in repo or PDF.

## 7. Setup summary
See `docs/deliverable-2/setup-summary.md` (mirrors `README.md`): versions, install, `.env.example` names, two migrations, seed, build/test, Docker/CI and deploy triggers.

## 8. Version history
| Version | Date | Change |
| :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial Part E evidence and readiness decision for `v0.2.0-sprint2`. |
