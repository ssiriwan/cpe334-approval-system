# Lab 5 - Evidence Index (source for the submitted PDF)

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Topic:** Theme 5 - Workflow and Approval System (corporate expense and purchase request)
> **Repository:** <https://github.com/ssiriwan/cpe334-approval-system> (public, R-12)
> **Starting point:** Sprint 1 release `v0.1.0-sprint1` (`f35ad24`)
> **Public URL:** `PENDING - filled after the first Cloud Run deploy`
> **Serving commit:** `PENDING - verified with GET /api/health`

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
| 1. CI and quality gate | `PENDING` (passing PR + Actions run) | C-01, R-05 | `PENDING` |
| 1. CI and quality gate | PR #24 and its failing run | C-02, R-06 | `PENDING` (needs the active ruleset) |
| 2. Docker and reproducible configuration | `docs/labs/lab-05/evidence/c03-clean-clone.log` | C-03, R-01, R-02 | `PENDING` |
| 3. GCP deployment and persistence | `PENDING` (public URL) | C-04, R-03 | `PENDING` |
| 3. GCP deployment and persistence | `PENDING` (before/after restart and redeploy) | C-05, R-04 | `PENDING` |
| 4. Repeatable release pipeline | `PENDING` (release PR + deploy run + revision) | C-06, R-07, R-08 | `PENDING` |

---

## Answer Part 1: CI and Quality Gate (30)

**Workflow:** [`.github/workflows/ci-docker.yml`](../../../.github/workflows/ci-docker.yml) - one job,
`CI quality gate`, which starts PostgreSQL 17 as a service container, applies migrations, seeds,
runs the full Vitest suite (34 tests), builds client and server, builds the Docker image, starts the
container, and asserts `/api/health` reports the commit being tested.

### C-01 - a normal PR runs the build and all tests (R-05)

- **Pull request:** `PENDING` (link the PR and its run)
- **Result:** `PENDING` - paste the job summary line (tests passed / failed / skipped, commit)
- **Why it is meaningful:** the suite is not smoke-only: `TEST-05..13` assert the business rules
  (self-approval blocked before assignment, state transitions, unrelated reviewer denied, decision
  validation) against a real PostgreSQL instance, and the container smoke test proves the image that
  CI just built actually serves traffic and reports the same commit.

### C-02 - a failing PR cannot be merged (R-06)

- **Temporary PR:** <https://github.com/ssiriwan/cpe334-approval-system/pull/24>
- **Ruleset:** [`rulesets/main.json`](./rulesets/main.json) and [`rulesets/sprint-1-staging.json`](./rulesets/sprint-1-staging.json)
- **Result:** `PENDING` - the required check fails and the merge button is disabled
- **Figure 1.** C-02 (R-06): PR #24 from a temporary branch; the required check `CI quality gate`
  failed and merging is blocked. Commit `PENDING`.
- **Cleanup:** the PR is closed without merging and the branch deleted, so the released application
  is unaffected.

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
- **Result:** `PENDING`
- Commands (new empty directory, no local artefacts):
  ```bash
  git clone https://github.com/ssiriwan/cpe334-approval-system.git
  cd cpe334-approval-system
  cp .env.example .env
  APP_PORT=3100 POSTGRES_PORT=5435 GIT_COMMIT=$(git rev-parse HEAD) docker compose up --build -d
  curl http://localhost:3100/api/health
  ```
- **Figure 2.** C-03 (R-01): `docker compose ps` from the clean clone - `db` healthy, `migrate`
  exited 0, `app` running. `PENDING`.
- **Figure 3.** C-03 (R-02): the environment variable table in `deployment.md`; every variable the
  application reads is listed and no real value is committed. `PENDING`.

---

## Answer Part 3: GCP Deployment and Persistence (35)

**Runbook:** [`gcp-setup.md`](./gcp-setup.md) - project, budget alert, Artifact Registry, Cloud SQL
PostgreSQL 17, Secret Manager, runtime and deploy service accounts, Workload Identity Federation.

- **Public URL:** `PENDING`
- **Cloud Run service / revision:** `PENDING`
- **Cloud SQL instance:** `PENDING` (`PROJECT:REGION:approval-db`)
- **Connectivity:** the UI is served by the same container as the API; the API reaches PostgreSQL
  over the Cloud SQL unix socket; `GET /api/health` returns `status: ok` with the commit.

### C-04 - the domain workflow works on the public URL (R-03)

- **Result:** `PENDING` - sign in, create a request, and one rule rejection or access restriction
- **Figure 4.** C-04 (R-03): sign-in on the public URL `<url>`; the browser address bar shows the
  Cloud Run hostname. `PENDING`.
- **Figure 5.** C-04 (R-03): requester creates a request and sees it in "My requests" with status
  `PENDING`; the same record is visible through the API. `PENDING`.
- **Figure 6.** C-04 (R-03): a reviewer who is not assigned to the request gets
  `403 ACCESS_DENIED` (a rule rejection, not a hidden button). `PENDING`.

### C-05 - data survives a restart and a redeploy (R-04)

- **Result:** `PENDING`
- Procedure: create a record, note its `requestNo`, restart the Cloud Run service with a new
  revision, then redeploy from `main`; the record must still exist with the same `requestNo`.
- **Figure 7.** C-05 (R-04): the record before and after the restart and redeploy. `PENDING`.

---

## Answer Part 4: Repeatable Release Pipeline (15)

**Workflow:** [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml) - image tagged with the full
commit SHA, pushed to Artifact Registry, migration job executed before the service is updated, service
deployed **by digest**, then a smoke test asserts `/api/health` reports the release commit.

**Release procedure:** [`deployment.md` Section 6](./deployment.md) - reviewed change, CI, merge into
`sprint-1-staging`, release PR into `main`, pipeline deploys, record SHA/digest/revision.

### C-06 - a reviewed change reaches main and is deployed (R-07 to R-10)

- **Feature PR:** `PENDING` (labelled `lab5`, specific teammate review)
- **Release PR:** `PENDING` (`sprint-1-staging` -> `main`)
- **Deploy run:** `PENDING`
- **Running commit:** `PENDING` - `/api/health` commit equals the release SHA, and
  `gcloud run revisions describe` shows the image tagged with that SHA
- **Figure 8.** C-06 (R-07, R-08): the deploy run summary with the image digest and the smoke-test
  step, next to `GET /api/health` returning the same commit. `PENDING`.

---

## Known limitations (disclosed, not hidden)

| Item | Status at submission |
| :--- | :--- |
| Cloud staging environment | Not used - the handout does not require one (Lab 5 Section 4.2) |
| Automatic rollback | Documented manual rollback in `deployment.md` 6.2; no automated canary |
| Monitoring dashboards / load tests | Out of scope per Lab 5 Section 4.2 |
| Demo account passwords | Seeded into Cloud SQL, shared with the Lab 6 partner team privately; never committed |
