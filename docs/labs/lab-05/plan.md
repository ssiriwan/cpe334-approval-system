# Lab 5 - Execution Plan (working plan, updated 21 Nov 2026)

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Repository:** <https://github.com/ssiriwan/cpe334-approval-system> (public, R-12)
> **Integration branch:** `lab5-staging` (all Lab 5 PRs target this branch)
> **Sources:** `01_SE_Lab_5_updated.pdf` (Sections 4, 7, 8, 12) and Issues #13, #19, #20, #21, #22
> **Status:** items are marked **DONE** only when evidence exists; `PENDING` is never presented as passing.

This plan is the human-readable companion to [`evidence-index.md`](./evidence-index.md). It records
what is already shipped, what is left, and the exact order of the remaining work.

---

## 0. Decisions needed before the cloud work (Step 0)

| Question | Current evidence | Action |
| :--- | :--- | :--- |
| Shared course project or a personal project? | The handout (Section 4.4) says a personal Free Trial project, but the provided `project-kit/resources.env` and `deploy/deploy.sh` are fixed to `cpe-se-course-2026` / `sd3cdaba1` / `asia-southeast1`. `kit.sh doctor` passes against the shared project. | Ask the TA to confirm. Until then, follow the **kit** (it is what the course supplied). |
| Section number for the PDF filename `lab5_sec<section>_<group>.pdf` | Not stated in the handout copy we have. | Ask the TA. |
| New submission deadline | The PDF says 15 Nov 2026; the team was told it moved. | Ask the TA and record the date here. |

---

## 1. Already done (do not redo)

| Handout Step | Issue | What landed | Evidence |
| :--- | :---: | :--- | :--- |
| 2 - cloud-ready configuration | #13 | All settings from the environment; `.env.example` + env table in `deployment.md`. No committed secret: the JWT signing key is created in Secret Manager and the demo seed password comes from `DEMO_USER_PASSWORD`. | PR #26 (`38d7211`, `d7692f6`), merged as `e7f961b` |
| 3 - containerize | #13, #21 | Multi-stage `Dockerfile`, `.dockerignore`, `docker-compose.yml` (`db` / `migrate` / `app` / optional `seed`); one container serves UI + API. | [`evidence/c03-clean-clone.log`](./evidence/c03-clean-clone.log) |
| 4 - CI on Pull Requests | #13, #20 | `CI quality gate`: PostgreSQL service → migrate → seed → 34 tests → client/server build → Docker build → container health check. | [run 44777880489](https://github.com/ssiriwan/cpe334-approval-system/actions/runs/44777880489) (pass, commit `38d7211`) |
| 6 - required merge gate | #20 | Rulesets active on `main` and `sprint-1-staging`: require PR + 1 approval + `CI quality gate`, block force push and deletion. Temporary PR #24 failed its check and was closed without merging. | GitHub rulesets 27451785 / 27451799; PR #24 = `BLOCKED` + `FAILURE` |
| 5 - deployment scripts (not yet executed) | #13, #19 | `deploy.yml`, `deploy/deploy.sh`, `deploy/release.sh`, `deploy/smoke_test.py` on `lab5-staging`; image tagged by SHA, deployed by digest, migration job before service update, health smoke test. | PR #26 |
| Evidence skeleton | #20–#22 | `evidence-index.md` with Answer Part 0–4 and figure captions; `PENDING` where evidence does not exist yet. | `docs/labs/lab-05/evidence-index.md` |

---

## 2. Kit readiness check (executed 21 Nov 2026)

`project-kit` was unzipped into the repository root but is **not committed**: `resources.env`
contains pre-filled team values and must be scanned before any commit. The readiness check was run
from the project root with Git Bash:

```bash
bash project-kit/kit.sh doctor
```

Result ([`evidence/kit-doctor.log`](./evidence/kit-doctor.log)): all checks passed except one warning
("docker is not configured for the registry"), which the kit's `build` command handles automatically.
The kit confirms the team identity `sd3cdaba1`, project `cpe-se-course-2026`, region
`asia-southeast1`, and can see the pre-provisioned Cloud Run service, migration job and Artifact
Registry repository.

---

## 3. Remaining work, in order

### Phase 1 - kit configuration (local, no cloud change)

```bash
bash project-kit/kit.sh --stack node init
cp project-kit/app.env.example app.env
```

`app.env` holds **plain** values only. Passwords, tokens and API keys go to the five Secret Manager
slots in Phase 2. Do not commit `app.env`, `resources.env`, or any secret.

### Phase 2 - GCP provisioning / verification (human-run, handout Section 9)

1. **Verify** the portal-provisioned resources: Cloud SQL PostgreSQL 17, database/user, Secret
   Manager entries, the two service accounts, and the Workload Identity Federation provider.
2. If a personal project is used instead: create an alerts-only budget **first**, then enable
   `run`, `sqladmin`, `artifactregistry`, `secretmanager`, `iamcredentials`, `cloudbuild`; create the
   Artifact Registry repo, Cloud SQL (`db-f1-micro`, Enterprise edition, auto-increase **off**),
   database/user, secrets and least-privilege service accounts.
3. Store team values in the five secret slots:
   ```bash
   ./project-kit/kit.sh secrets add 1
   ./project-kit/kit.sh secrets map API_KEY 1
   ./project-kit/kit.sh deploy
   ./project-kit/kit.sh secrets list
   ```
4. Connect GitHub through WIF (no JSON key); give the runtime service account only
   `cloudsql.client` + `secretmanager.secretAccessor`.

**Done:** `gcloud` can describe the service, job, repository and secrets; WIF provider exists.

### Phase 3 - GitHub configuration (owner/admin action)

Create environment **`demo`** (the name is fixed by `deploy.yml`) and add:

| Name | Type | Where |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | variable | `demo` |
| `GCP_REGION` | variable | `demo` |
| `WIF_PROVIDER` | variable | `demo` |
| `WIF_SERVICE_ACCOUNT` | variable | `demo` |
| `SMOKE_EMAIL` / `SMOKE_PASSWORD` | variable + secret | `demo` (optional; set both or neither) |

**Done:** `gh variable list --env demo` and `gh secret list --env demo` show every entry.

### Phase 4 - first build and deploy → C-04 (Part 3, 35 points)

```bash
./project-kit/kit.sh build          # configures docker auth automatically
MIGRATE_COMMAND='npx prisma migrate deploy' ./project-kit/kit.sh migrate
./project-kit/kit.sh --dry-run deploy
./project-kit/kit.sh deploy
./project-kit/kit.sh status
./project-kit/kit.sh open
```

Then collect **C-04** on the public URL (screenshots must show the address bar):
sign in → create a request → trigger one rule rejection or access restriction (e.g. a reviewer who
is not assigned gets `403 ACCESS_DENIED`). Also show `/api/health` reporting the running commit.

### Phase 5 - persistence → C-05

Create a record, note its `requestNo`, restart the Cloud Run service, redeploy, then show the same
record still present. Keep before/after screenshots and the `gcloud run revisions describe` output.

### Phase 6 - release pipeline → C-06 (Part 4, 15 points)

1. A labelled change (`lab5`) goes through a reviewed PR into `lab5-staging`; the reviewer names a
   specific check in the review. Authors never approve their own PR (R-09).
2. Open a release PR `lab5-staging → main`, reviewed by the other member, CI green.
3. The deploy run builds by SHA, migrates, deploys by digest, and the smoke test passes.
4. Show the running revision/commit next to `/api/health`.

> `main` is irrelevant during daily Lab 5 work, but handout R-07/R-08 and check C-06 explicitly
> require a release from `main`; hence this step is mandatory at the end.

### Phase 7 - submission

1. Replace every resolved `PENDING` in `evidence-index.md` with a direct link and result; leave
   `PENDING` only where evidence truly does not exist.
2. Finish `deployment.md` with the real project, region, URL, service, revision and release results.
3. Assemble `lab5_sec<section>_<group>.pdf` with **Answer Part 0** to **Answer Part 4** in order,
   links first and screenshots only where a link cannot show the fact (blocked merge button, GCP
   console setting, before/after redeploy). Hide or blur any secret before inserting an image.
4. Keep the service running until the instructor announces the end of grading, and close Issues
   #13, #19, #20, #21, #22 on the board.

---

## 4. Rules that must not be broken

| Rule | Why |
| :--- | :--- |
| Never commit `.env`, `app.env`, `resources.env` values, passwords, connection strings or keys | Public repository (R-02, R-12) |
| Never let an agent change billing, IAM or databases | Handout Section 9 |
| Never force-push or rewrite commits / CI runs | R-10; Lab 7 uses the run history |
| Every PR has a substantive teammate review; no self-approval | R-09 |
| `PENDING` must not be presented as passing | Spec 11 / honest evidence |

---

## 5. Open questions

- [ ] TA: shared project or personal project?
- [ ] TA: Lab 5 section number for the PDF filename.
- [ ] TA: new submission deadline.
- [ ] Should a ruleset also protect `lab5-staging`? (Currently only `main` and `sprint-1-staging`
      are protected; an owner/admin must add it.)
