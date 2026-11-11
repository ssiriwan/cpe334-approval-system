# Lab 5 - Deployment Guide and Release Procedure

> **Team:** Oum (`67070501075`, `ssiriwan`) and T (`67070501021`, `thhanabun`)
> **Application:** CPE 334 Theme 5 - Workflow and Approval System
> **Repository:** <https://github.com/ssiriwan/cpe334-approval-system>
> **Issue:** #13 - Lab 5 Docker, CI/CD, and GCP deployment
> **Stack:** Docker, GitHub Actions, Artifact Registry, Cloud Run, Cloud Run Jobs, Cloud SQL for PostgreSQL 17, Secret Manager
> **Status:** Local Docker stack, CI pipeline, and deploy pipeline implemented. GCP resources must be provisioned by a team member with the project's billing/IAM access.

---

## 1. Delivery Path

```text
feature/fix branch -> PR -> sprint-1-staging (reviewed + CI)
        -> release PR -> main (CI) -> deploy workflow
        -> build image tagged with commit SHA -> push to Artifact Registry
        -> Cloud Run migration job (prisma migrate deploy)
        -> Cloud Run service updated by image digest
        -> smoke test /api/health verifies status + running commit
```

One container serves the built React client and the Express API. PostgreSQL is
never inside the container; local data lives in a named Docker volume and cloud
data lives in Cloud SQL.

---

## 2. Required Files

| File | Purpose |
| :--- | :--- |
| `Dockerfile` | Multi-stage build: install workspace dependencies, generate Prisma client, build client + server, then produce one runtime image. |
| `.dockerignore` | Keeps Git history, `node_modules`, build output, env files, and local docs out of the build context. |
| `docker-compose.yml` | Local production-like stack: `db`, one-off `migrate`, `app`, and an optional `seed` profile. |
| `.github/workflows/ci-docker.yml` | PR quality gate: migrate, seed, test, build, Docker build, container smoke test. |
| `.github/workflows/deploy.yml` | Main deploy: image by SHA, migration job, Cloud Run deploy by digest, health verification. |
| `.env.example` | Every environment variable with placeholder values only. |

---

## 3. Environment Variables

No real value is committed. Local values come from `.env` (ignored by Git).
Cloud values come from GitHub repository variables and Secret Manager.

| Variable | Purpose | Secret? | Local source | GCP source |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | `.env` | Secret Manager `DATABASE_URL` (version `latest`) |
| `JWT_SECRET` | HS256 signing key, at least 32 characters | **Yes** | `.env` | Secret Manager `JWT_SECRET` (version `latest`) |
| `JWT_EXPIRES_IN_SECONDS` | Session lifetime, default `28800` (8h) | No | `.env` | Cloud Run env var (default used if omitted) |
| `PORT` | Server port, `3000` | No | `.env` / image default | Cloud Run `--port 3000` |
| `NODE_ENV` | `production` in containers | No | `.env` | Cloud Run env var |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS | No | `.env` | Cloud Run env var (`GCP_PUBLIC_ORIGIN`) |
| `COOKIE_SECURE` | `true` for HTTPS cookies | No | `.env` (`false` locally) | Set `true` for production |
| `GIT_COMMIT` | Commit reported by `GET /api/health` | No | `local` or shell | Deploy workflow sets the GitHub SHA |

GitHub configuration:

| Name | Type | Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Repository variable | GCP project ID, e.g. `cpe334-sec1-teamNN` |
| `GCP_REGION` | Repository variable | e.g. `asia-southeast1` |
| `GCP_ARTIFACT_REPOSITORY` | Repository variable | `approval-system` |
| `GCP_SERVICE_NAME` | Repository variable | `approval-system` |
| `GCP_MIGRATION_JOB` | Repository variable | `approval-system-migrate` |
| `GCP_CLOUD_SQL_INSTANCE` | Repository variable | `project:region:instance` |
| `GCP_PUBLIC_ORIGIN` | Repository variable | `https://<cloud-run-url>` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Repository secret | Workload Identity provider resource name |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Repository secret | Deploy service account email |

---

## 4. Local Commands

### 4.1 Tests, build, migration, seed (host)

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate       # development migrations; use migrate deploy for release-like runs
npm run prisma:seed
npm test
npm run build
```

### 4.2 Build the image

```bash
docker build --tag approval-system:local .
# or
npm run docker:build
```

### 4.3 Run the full stack with Docker

```bash
cp .env.example .env
docker compose up --build
```

- `db` starts PostgreSQL 17 with a named volume (`db-data`).
- `migrate` runs `npx prisma migrate deploy --schema prisma/schema.prisma` and must exit successfully.
- `app` starts only after `migrate` completes.
- Open <http://localhost:3000>; the UI and API are served by the same container.

Optional demo accounts (synthetic only):

```bash
docker compose --profile seed run --rm seed
```

### 4.4 Inspect and stop

```bash
docker compose ps
docker compose logs app
docker compose down          # keep data
docker compose down --volumes  # delete the local database volume
```

### 4.5 Verify the running commit locally

```bash
curl http://localhost:3000/api/health
# {"status":"ok","commit":"local",...}
```

---

## 5. GCP Resources

| Resource | Suggested name | Notes |
| :--- | :--- | :--- |
| Project | `cpe334-sec<section>-team<NN>` | One project for Lab 5-7 and the Final Project. |
| Region | `asia-southeast1` | Keep all resources in one region. |
| Artifact Registry | `approval-system` | Docker repository. |
| Cloud Run service | `approval-system` | Minimum instances `0`, maximum `3`, 512 MiB. |
| Cloud Run job | `approval-system-migrate` | Runs `prisma migrate deploy` before each deploy. |
| Cloud SQL | `approval-db` | PostgreSQL 17, smallest tier, storage auto-increase off. |
| Secret Manager | `DATABASE_URL`, `JWT_SECRET` | Runtime secrets. |
| Service account | `github-deploy` | Used by GitHub Actions through Workload Identity Federation. |

### 5.1 One-time setup (human-run)

These commands change billing, IAM, or databases, so a team member runs and
reviews them. Do not let an AI agent change billing or IAM.

```bash
gcloud config set project <PROJECT_ID>
gcloud services enable \
  run.googleapis.com sqladmin.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com

gcloud artifacts repositories create approval-system \
  --repository-format=docker --location=<REGION>

gcloud sql instances create approval-db \
  --database-version=POSTGRES_17 --edition=enterprise \
  --tier=db-f1-micro --region=<REGION> \
  --storage-auto-increase

gcloud sql databases create approval_db --instance=approval-db
gcloud sql users create approval_user --instance=approval-db --password='<DB_PASSWORD>'
```

Create secrets (values are never printed or committed):

```bash
printf '%s' 'postgresql://approval_user:<DB_PASSWORD>@localhost/approval_db?host=/cloudsql/<PROJECT_ID>:<REGION>:approval-db&schema=public' \
  | gcloud secrets create DATABASE_URL --data-file=-

openssl rand -hex 32 | gcloud secrets create JWT_SECRET --data-file=-
```

Create the deploy service account and grant only the required roles:

```bash
gcloud iam service-accounts create github-deploy --display-name='GitHub Actions deploy'

for role in roles/run.admin roles/artifactregistry.writer roles/cloudsql.client \
            roles/iam.serviceAccountUser roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding <PROJECT_ID> \
    --member='serviceAccount:github-deploy@<PROJECT_ID>.iam.gserviceaccount.com' \
    --role="$role"
done
```

Configure Workload Identity Federation for GitHub and store the provider name and
service account email as the two repository secrets (Student Guide Episode 6).

### 5.2 Required status check

In **Settings -> Rules -> Rulesets** (or branch protection) for `main` and
`sprint-1-staging`:

- require a pull request before merging and require one approval;
- require the status check **`CI quality gate`**;
- block force pushes and deletions.

A failing check then blocks the merge button (R-06).

---

## 6. Release Procedure

1. Open an Issue with the `lab5` label and link the requirement IDs.
2. Branch from `sprint-1-staging`: `feature/<issue>-<slug>`.
3. Commit the contract/spec change before implementation when behavior changes.
4. Open a PR into `sprint-1-staging`; the teammate reviews specific code and
   checks the `CI quality gate` run. The author never approves their own PR.
5. After merge, open a release PR from `sprint-1-staging` into `main`; the
   teammate reviews and merges it.
6. The push to `main` starts `.github/workflows/deploy.yml`:
   - builds the image and tags it with the full commit SHA;
   - pushes to Artifact Registry and records the image digest;
   - updates and executes the migration job;
   - deploys the service using the image digest;
   - smoke-tests `/api/health` and checks that the reported commit equals the
     release SHA.
7. Record the release SHA, image digest, and Cloud Run revision in the Lab 5
   evidence index.

### 6.1 Find the commit that is running

```bash
curl https://<cloud-run-url>/api/health
# {"status":"ok","commit":"<release SHA>",...}

gcloud run services describe approval-system \
  --region <REGION> --format='value(status.latestReadyRevisionName)'

gcloud run revisions describe <REVISION> \
  --region <REGION> --format='value(spec.containers[0].image)'
```

### 6.2 Rollback

```bash
gcloud run services update approval-system \
  --region <REGION> \
  --image <PREVIOUS_IMAGE>@sha256:<PREVIOUS_DIGEST>
```

Roll back the image first; only revert a migration when it is safe and additive.

### 6.3 Cost control

- Create an alerts-only budget before provisioning resources.
- Cloud Run: minimum instances `0`, maximum `3`.
- Cloud SQL: smallest tier, storage auto-increase off, stop the instance when idle.
- Tear down resources after grading (unless the course requires them to stay).

---

## 7. Evidence Index (Lab 5 PDF)

| Rubric part | Artifact / direct link | IDs / version | Verification result |
| :--- | :--- | :--- | :--- |
| 1. CI and quality gate | `.github/workflows/ci-docker.yml`; PR and Actions run (to be linked) | C-01, C-02 | Pending: needs a pushed PR run and the failing temporary-branch demonstration |
| 2. Docker and reproducible configuration | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, this file; local `docker compose up` output | C-03 | Local build and container smoke test pass |
| 3. GCP deployment and persistence | Public URL (to be filled after provisioning); Cloud SQL instance | C-04, C-05 | Pending: GCP project, secrets, and persistence screenshots |
| 4. Repeatable release pipeline | `.github/workflows/deploy.yml`; release PR, pipeline run, Cloud Run revision | C-06 | Pipeline implemented; first release run pending |

Known status at the time of writing: CI and Docker are implemented and verified
locally. GCP provisioning and the live URL require the team's GCP project
credentials and are performed by a team member; this document does not claim a
live deployment that has not happened.

---

## 8. Version History

| Version | Date | Change | Author | Reviewer |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 11 Nov 2026 | Docker image/compose, CI gate, deploy pipeline, and release procedure. | T | Oum |
