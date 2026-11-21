# Lab 5 - Evidence Index (source for the submitted PDF)

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Topic:** Theme 5 - Workflow and Approval System (corporate expense and purchase request)
> **Repository:** <https://github.com/ssiriwan/cpe334-approval-system> (public, R-12)
> **Starting point:** Sprint 1 release `v0.1.0-sprint1` (`f35ad24`)
> **Public URL:** <https://sd3cdaba1-4d7hbszvwq-as.a.run.app>
> **Serving commit:** `74d37cb67cbdc25c3baedefbe4a1dd518891125a` (release `main` HEAD, verified with `GET /api/health`)

This file is the working copy of the submitted PDF. Each rubric part lists a direct
link, one or two sentences of explanation, and - only where a link cannot show it -
a numbered screenshot caption. `PENDING` means the evidence does not exist yet and
must never be presented as done.

---

## Answer Part 0: Team and Evidence Index

| Member | Student ID | GitHub | Contribution in Lab 5 |
| :--- | :---: | :--- | :--- |
| Oum | `67070501075` | `@ssiriwan` | Merge gate/rulesets (#20), review of the GCP runbook and deploy changes (#23), Docker clean-clone verification (#21), release PR review (#22) |
| T | `67070501021` | `@thhanabun` | GCP provisioning (#19), deploy workflow changes (#23), Docker/CI pipeline (#13), release and persistence evidence (#22), PDF assembly |

**Lab 5 Issues and Pull Requests**

| Item | Link | What it covers |
| :--- | :--- | :--- |
| Issue #13 | <https://github.com/ssiriwan/cpe334-approval-system/issues/13> | Umbrella: Docker image, CI quality gate, repeatable GCP pipeline |
| Issue #19 | <https://github.com/ssiriwan/cpe334-approval-system/issues/19> | GCP project, Cloud SQL, Secret Manager, Workload Identity |
| Issue #20 | <https://github.com/ssiriwan/cpe334-approval-system/issues/20> | Required check ruleset and the temporary failing PR (C-01, C-02) |
| Issue #21 | <https://github.com/ssiriwan/cpe334-approval-system/issues/21> | Clean-clone Docker build and run (C-03) |
| Issue #22 | <https://github.com/ssiriwan/cpe334-approval-system/issues/22> | Release pipeline run, persistence proof, evidence PDF (C-04, C-05, C-06) |
| PR #14 | <https://github.com/ssiriwan/cpe334-approval-system/pull/14> | First Lab 5 delivery: Dockerfile, compose, CI gate, deploy workflow, deployment.md |
| PR #23 | <https://github.com/ssiriwan/cpe334-approval-system/pull/23> | GCP setup runbook, explicit Cloud Run runtime service account, ruleset JSON |
| PR #24 | <https://github.com/ssiriwan/cpe334-approval-system/pull/24> | Temporary failing check demonstration (never merged) |

**Evidence index**

| Rubric part | Artifact / direct link | IDs / version | Verification result |
| :--- | :--- | :--- | :--- |
| 1. CI and quality gate | [PR #26](https://github.com/ssiriwan/cpe334-approval-system/pull/26) + [run 44777880489](https://github.com/ssiriwan/cpe334-approval-system/actions/runs/44777880489) | C-01, R-05, commit `38d7211` | PASS - 7 files / 34 tests, Docker smoke OK |
| 1. CI and quality gate | [PR #24](https://github.com/ssiriwan/cpe334-approval-system/pull/24), rulesets 27451785 / 27451799 | C-02, R-06, commit `28c45e3` | PASS - check FAILURE, merge `BLOCKED`, closed unmerged |
| 2. Docker and reproducible configuration | [`evidence/c03-clean-clone.log`](./evidence/c03-clean-clone.log) | C-03, R-01, R-02, commit `f35ad24` | PASS - empty volume, migration applied, API round trip |
| 3. GCP deployment and persistence | <https://sd3cdaba1-4d7hbszvwq-as.a.run.app> + [`evidence/c04-live.log`](./evidence/c04-live.log) | C-04, R-03, commit `263133d` | PASS - login, create, three 403 rules |
| 3. GCP deployment and persistence | [`c05-before.log`](./evidence/c05-before.log) / [`c05-after.log`](./evidence/c05-after.log) | C-05, R-04, revision 00003 -> 00004 | PASS - `REQ-20261121-0001` survived redeploy |
| 4. Repeatable release pipeline | [PR #30](https://github.com/ssiriwan/cpe334-approval-system/pull/30) + [run 44879473855](https://github.com/ssiriwan/cpe334-approval-system/actions/runs/44879473855) | C-06, R-07, R-08, commit `74d37cb` | PASS - CI + deploy success, revision `00007-h8g`, health = release SHA |

---

## Answer Part 1: CI and Quality Gate (30)

**Workflow:** [`.github/workflows/ci-docker.yml`](../../../.github/workflows/ci-docker.yml) - one job,
`CI quality gate`, which starts PostgreSQL 17 as a service container, applies migrations, seeds,
runs the full Vitest suite (34 tests), builds client and server, builds the Docker image, starts the
container, and asserts `/api/health` reports the commit being tested.

### C-01 - a normal PR runs the build and all tests (R-05)

- **Pull request:** [PR #26](https://github.com/ssiriwan/cpe334-approval-system/pull/26) - reviewed by teammate, merged into `sprint-1-staging`.
- **Actions run:** [44777880489](https://github.com/ssiriwan/cpe334-approval-system/actions/runs/44777880489) - `CI quality gate: SUCCESS` (2m10s), commit `38d7211`.
- **Result:** 7 test files / **34 passed, 0 failed, 0 skipped**; client and server build, Docker image build, and container `/api/health` smoke test all passed. A second green run after adding `lab5-staging` to the CI triggers is [44873769377](https://github.com/ssiriwan/cpe334-approval-system/actions/runs/44873769377) (PR #28).
- **Why it is meaningful:** the suite is not smoke-only: `TEST-05..13` assert the business rules
  (self-approval blocked before assignment, state transitions, unrelated reviewer denied, decision
  validation) against a real PostgreSQL instance, and the container smoke test proves the image that
  CI just built actually serves traffic and reports the same commit.

### C-02 - a failing PR cannot be merged (R-06)

- **Temporary PR:** <https://github.com/ssiriwan/cpe334-approval-system/pull/24>
- **Ruleset:** [`rulesets/main.json`](./rulesets/main.json) and [`rulesets/sprint-1-staging.json`](./rulesets/sprint-1-staging.json)
- **Result:** PASS. After the two rulesets became active, PR #24 showed `CI quality gate: FAILURE`
  and `mergeStateStatus: BLOCKED` (GitHub API, 21 Nov 2026). The PR was closed on 17 Nov 2026
  without merging; `mergedAt` is empty.
- **Figure 1.** C-02 (R-06): PR #24 from the temporary branch `lab5/c02-failing-check`; the required
  check `CI quality gate` failed and merging was blocked. Commit `28c45e3`.
- **Cleanup:** the PR is closed without merging, so the released application is unaffected.

---

## Answer Part 2: Docker and Reproducible Configuration (20)

**Artifacts:** [`Dockerfile`](../../../Dockerfile), [` .dockerignore`](../../../.dockerignore),
[`docker-compose.yml`](../../../docker-compose.yml), [`deployment.md`](./deployment.md),
[`.env.example`](../../../.env.example)

The image is a multi-stage build: dependencies, then Prisma client + client/server build, then a
runtime stage that copies the built artefacts and keeps the Prisma CLI and `tsx` available so the
same image can run the migration job and the seed script. One container serves the React client and
the Express API; PostgreSQL is never inside the container.

### C-03 - a fresh clone builds and runs with only `.env.example` (R-01, R-02)

- **Log:** `docs/labs/lab-05/evidence/c03-clean-clone.log`
- **Result:** PASS - see [`evidence/c03-clean-clone.log`](./evidence/c03-clean-clone.log). From a fresh clone at `f35ad24` with only `.env.example` copied and an empty
  compose volume, `migrate` applied `20261110084745_init_schema`, `app` became healthy, `/api/health`
  reported the clone's own commit, the seed created 3 demo accounts, and login -> create request
  (`REQ-20261115-0001`) -> read back all succeeded.
- Commands (new empty directory, no local artefacts):
  ```bash
  git clone https://github.com/ssiriwan/cpe334-approval-system.git
  cd cpe334-approval-system
  cp .env.example .env
  APP_PORT=3100 POSTGRES_PORT=5435 GIT_COMMIT=$(git rev-parse HEAD) docker compose up --build -d
  curl http://localhost:3100/api/health
  ```
- **Figure 2.** C-03 (R-01): `docker compose ps` from the clean clone - `db` healthy, `migrate`
  exited 0, `app` running; captured in `c03-clean-clone.log`, clone commit `f35ad24`.
- **Figure 3.** C-03 (R-02): the environment variable table in [`deployment.md`](./deployment.md);
  every variable the application reads is listed and no real value is committed.

---

## Answer Part 3: GCP Deployment and Persistence (35)

**Runbook:** [`gcp-setup.md`](./gcp-setup.md) - project, budget alert, Artifact Registry, Cloud SQL
PostgreSQL 17, Secret Manager, runtime and deploy service accounts, Workload Identity Federation.

- **Public URL:** <https://sd3cdaba1-4d7hbszvwq-as.a.run.app>
- **Cloud Run service / revision:** `sd3cdaba1` / `sd3cdaba1-00007-h8g` (current; `00004-wpw` was the persistence-check revision)
- **Cloud SQL instance:** `cpe-se-course-2026:asia-southeast1:sd3cdaba1-pg`
- **Image:** `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/sd3cdaba1/sd3cdaba1@sha256:627b1c14b90eb71e9b3a044a3cc1773d584ccf358b6e0383fa74d9c8feb68b04` (tag `git-263133d1899f`)
- **Connectivity:** the UI is served by the same container as the API; the API reaches PostgreSQL
  over the Cloud SQL unix socket; `GET /api/health` returns `status: ok` with the commit.

### C-04 - the domain workflow works on the public URL (R-03)

- **Result:** PASS - see [`evidence/c04-live.log`](./evidence/c04-live.log). Sign-in as
  `oum.requester@cpe334.local` -> create `REQ-20261121-0001` (`PENDING`, assigned to `t.reviewer`)
  -> read back from My requests -> three rule rejections, all from the backend:
  `403 FORBIDDEN` (requester calls review), `403 ACCESS_DENIED` (unrelated reviewer
  `manager.hybrid`), `403 SELF_APPROVAL_NOT_ALLOWED` (reviewer reviews own request).
- **Figure 4.** C-04 (R-03): sign-in on the public URL
  <https://sd3cdaba1-4d7hbszvwq-as.a.run.app>; the browser address bar shows the Cloud Run hostname.
- **Figure 5.** C-04 (R-03): requester creates `REQ-20261121-0001` and sees it in "My requests" with
  status `PENDING`; the same record is visible through `GET /api/requests/my`.
- **Figure 6.** C-04 (R-03): a reviewer who is not assigned gets `403 ACCESS_DENIED`, and a reviewer
  who owns the request gets `403 SELF_APPROVAL_NOT_ALLOWED` - backend rule rejections, not hidden
  buttons.

### C-05 - data survives a restart and a redeploy (R-04)

- **Result:** PASS - [`c05-before.log`](./evidence/c05-before.log) /
  [`c05-after.log`](./evidence/c05-after.log). Created `REQ-20261121-0001`, then a new Cloud Run
  revision replaced the running instance (`sd3cdaba1-00003-h6g` -> `sd3cdaba1-00004-wpw`) and a
  redeploy was executed; `/api/health` still reported commit `263133d` and the same record was still
  present with the same `requestNo`.
- **Figure 7.** C-05 (R-04): `REQ-20261121-0001` before and after the revision replacement and
  redeploy, with the public URL and `GET /api/health` commit `263133d`.

---

## Answer Part 4: Repeatable Release Pipeline (15)

**Workflow:** [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml) - image tagged with the full
commit SHA, pushed to Artifact Registry, migration job executed before the service is updated, service
deployed **by digest**, then a smoke test asserts `/api/health` reports the release commit.

**Release procedure:** [`deployment.md` Section 6](./deployment.md) - reviewed change, CI, merge into
`sprint-1-staging`, release PR into `main`, pipeline deploys, record SHA/digest/revision.

### C-06 - a reviewed change reaches main and is deployed (R-07 to R-10)

- **Feature PRs:** [PR #27](https://github.com/ssiriwan/cpe334-approval-system/pull/27),
  [PR #28](https://github.com/ssiriwan/cpe334-approval-system/pull/28),
  [PR #29](https://github.com/ssiriwan/cpe334-approval-system/pull/29) - all labelled `lab5`, each
  with a specific teammate review; the author never approved their own PR.
- **Release PR:** [PR #30](https://github.com/ssiriwan/cpe334-approval-system/pull/30)
  (`lab5-staging` -> `main`), reviewed and merged by the non-author, CI green before merge.
- **Deploy run:** [44879473855](https://github.com/ssiriwan/cpe334-approval-system/actions/runs/44879473855)
  - `test / CI quality gate: success`, `deploy: success`, commit `74d37cb67cbdc25c3baedefbe4a1dd518891125a`.
- **Running commit:** `GET /api/health` returns `74d37cb67cbdc25c3baedefbe4a1dd518891125a`, equal
  to the release SHA merged into `main`. `kit.sh status` shows revision `sd3cdaba1-00007-h8g` with
  the digest pinned by the workflow.
- **Figure 8.** C-06 (R-07, R-08): the deploy run summary with the image digest and the smoke-test
  step, next to `GET /api/health` returning the same commit.

---

## Known limitations (disclosed, not hidden)

| Item | Status at submission |
| :--- | :--- |
| Cloud staging environment | Not used - the handout does not require one (Lab 5 Section 4.2) |
| Automatic rollback | Documented manual rollback in `deployment.md` 6.2; no automated canary |
| Monitoring dashboards / load tests | Out of scope per Lab 5 Section 4.2 |
| Demo account passwords | Seeded into Cloud SQL, shared with the Lab 6 partner team privately; never committed |
