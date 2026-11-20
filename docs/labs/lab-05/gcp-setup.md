# Lab 5 - GCP Setup Runbook (human-run)

> **Issue:** #19 (Lab 5 GCP project, Cloud SQL, secrets, Workload Identity)
> **Audience:** a team member running the GCP steps by hand. An AI agent must **not** change billing, IAM, or databases on its own (Lab 5 handout, Section 9).
> **Time:** about 20-25 minutes. Cloud SQL creation is the slow part (5-10 min).
> **Never paste a secret, password, connection string, or key file into an agent chat.**

> **STATUS (updated 20 Nov 2026): partly superseded.**
> This runbook documents the *self-provisioned* project (own project, own Cloud SQL,
> own Artifact Registry). The team now deploys into the **course shared project**
> `cpe-se-course-2026` with the fixed team prefix `sd3cdaba1`, where the portal/TA
> pre-provisions the project, Cloud SQL, Artifact Registry, Secret Manager entries,
> service account and Cloud Run service/job. `deploy/deploy.sh` asserts those
> resources exist and refuses to create project-level IAM, so steps 1-8 below do
> **not** apply as written; the one part that still does is the Workload Identity
> Federation and repository variable/secret setup that the deploy workflow needs.
> The runbook will be rewritten for the shared project as soon as the account
> access is granted (Issue #19). Until then it is kept as reference, not as a
> procedure to follow.

This runbook is the executable companion to `deployment.md`. Follow it top to bottom.
Every step has a *Done check* - do not continue until it passes.

---

## Step 0 - Prerequisites and cost control

1. Use a **personal Gmail** account that has never used the GCP Free Trial (USD 300). Do **not** use `@mail.kmutt.ac.th`.
2. Open **Cloud Shell** at <https://shell.cloud.google.com> while signed in as that account. `gcloud` is preinstalled and already authenticated - there is nothing to install locally.
3. Do **not** prepay and do **not** click *Upgrade* to a paid account.

Create the project first, then an **alerts-only budget** before any billable resource:

- Console -> Billing -> Budgets & alerts -> Create budget
- Scope: the new project, Amount: `USD 5`, Alerts at 50% / 90% / 100%
- Leave "Connect a Pub/Sub topic" off; alerts only.

> Done check: Billing -> Credits shows the free-trial credit and the budget appears in the list.

---

## Step 1 - Project

Run in **Cloud Shell** and edit the two variables first:

```bash
export PROJECT_ID="cpe334-sec1-teamNN"        # EDIT: your project id
export REGION="asia-southeast1"
export REPO="ssiriwan/cpe334-approval-system"

gcloud projects create "$PROJECT_ID" --name="CPE 334 Approval System"
gcloud config set project "$PROJECT_ID"

gcloud billing accounts list                  # copy the ACCOUNT_ID
gcloud billing projects link "$PROJECT_ID" --billing-account=<ACCOUNT_ID>
```

> Done check: `gcloud billing projects describe "$PROJECT_ID" | grep billingEnabled` returns `true`.

**Add the teammate** (Console -> IAM -> Grant access -> their Gmail -> role *Editor*). IAM changes take a minute to propagate; if the next step fails right after this, wait 60 s and retry.

---

## Step 2 - Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com
```

> Done check: `gcloud services list --enabled --filter="name:(run|sqladmin|artifactregistry|secretmanager)"` lists all four.
>
> If you see `FAILED_PRECONDITION` or `UREQ_PROJECT_BILLING_NOT_OPEN`, billing is not open - go back to Step 1.

---

## Step 3 - Artifact Registry

```bash
gcloud artifacts repositories create approval-system \
  --repository-format=docker \
  --location="$REGION" \
  --description="Approval system container images"
```

> Done check: `gcloud artifacts repositories list --location="$REGION"` shows `approval-system`.

---

## Step 4 - Cloud SQL (persistent PostgreSQL 17)

```bash
gcloud sql instances create approval-db \
  --database-version=POSTGRES_17 \
  --edition=enterprise \
  --tier=db-f1-micro \
  --region="$REGION" \
  --storage-size=10GB \
  --no-storage-auto-increase \
  --availability-type=zonal

gcloud sql databases create approval_db --instance=approval-db

DB_PASSWORD="$(openssl rand -hex 16)"          # URL-safe: hex only
gcloud sql users create approval_user --instance=approval-db --password="$DB_PASSWORD"
```

> `db-f1-micro` is only accepted with `--edition=enterprise` (handout Section 10).
>
> Done check: `gcloud sql instances describe approval-db --format='value(state)'` returns `RUNNABLE`.

Keep `$DB_PASSWORD` in this shell session - the next step uses it. Do not echo it, do not screenshot it.

---

## Step 5 - Secret Manager

Cloud Run reaches Cloud SQL through a unix socket, so the host is `localhost` and the socket path is a query parameter:

```bash
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

printf '%s' "postgresql://approval_user:${DB_PASSWORD}@localhost/approval_db?host=/cloudsql/${PROJECT_ID}:${REGION}:approval-db&schema=public" \
  | gcloud secrets create DATABASE_URL --data-file=- --replication-policy=automatic

openssl rand -hex 32 \
  | gcloud secrets create JWT_SECRET --data-file=- --replication-policy=automatic

unset DB_PASSWORD
```

> Done check: `gcloud secrets list` shows `DATABASE_URL` and `JWT_SECRET`; `gcloud secrets versions access latest --secret=JWT_SECRET | wc -c` prints 65 (64 hex chars + newline). Never paste the output into a chat or a document.
>
> If a secret is ever exposed: add a new version **and** change the underlying value (e.g. the database user password), then redeploy.

---

## Step 6 - Service accounts (least privilege)

Two accounts, two jobs:

- `approval-runtime` - used by the Cloud Run **service and migration job** at runtime.
- `github-deploy` - used by **GitHub Actions** to deploy.

```bash
gcloud iam service-accounts create approval-runtime --display-name="Cloud Run runtime"
gcloud iam service-accounts create github-deploy    --display-name="GitHub Actions deploy"

RUNTIME_SA="approval-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_SA="github-deploy@${PROJECT_ID}.iam.gserviceaccount.com"

# Runtime account: read the DB over the socket and read the two secrets.
for role in roles/cloudsql.client roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SA}" --role="$role" --condition=None
done

# Deploy account: push images, deploy Cloud Run, act as the runtime account.
for role in roles/run.admin roles/artifactregistry.writer roles/cloudsql.client roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOY_SA}" --role="$role" --condition=None
done

gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOY_SA}" --role="roles/iam.serviceAccountUser"
```

> Why a dedicated runtime account: Cloud Run defaults to the Compute Engine default
> service account, which **cannot read Secret Manager** out of the box. That failure looks
> like a container that starts and immediately exits - a common dead end at 23:00.
>
> Done check: `gcloud projects get-iam-policy "$PROJECT_ID" --flatten="bindings[].members" --filter="bindings.members:$RUNTIME_SA" --format='value(bindings.role)'` lists both roles.

---

## Step 7 - Workload Identity Federation (no JSON key)

```bash
gcloud iam workload-identity-pools create github \
  --location=global --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${REPO}'"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${REPO}"

gcloud iam workload-identity-pools providers describe github-provider \
  --location=global --workload-identity-pool=github \
  --format='value(name)'
```

> Done check: the last command prints
> `projects/<number>/locations/global/workloadIdentityPools/github/providers/github-provider`.
> Copy it - it becomes the `GCP_WORKLOAD_IDENTITY_PROVIDER` secret.

---

## Step 8 - Configure the repository (local shell)

Run these **on your laptop** in the repository, where `gh` is authenticated. Nothing here is a real secret except the last two.

```bash
gh variable set GCP_PROJECT_ID            --body "$PROJECT_ID"
gh variable set GCP_REGION                --body "$REGION"
gh variable set GCP_ARTIFACT_REPOSITORY   --body "approval-system"
gh variable set GCP_SERVICE_NAME          --body "approval-system"
gh variable set GCP_MIGRATION_JOB         --body "approval-system-migrate"
gh variable set GCP_CLOUD_SQL_INSTANCE    --body "${PROJECT_ID}:${REGION}:approval-db"
gh variable set GCP_RUNTIME_SERVICE_ACCOUNT --body "approval-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
gh variable set GCP_PUBLIC_ORIGIN         --body "https://placeholder.invalid"

gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body "<provider resource name from Step 7>"
gh secret set GCP_DEPLOY_SERVICE_ACCOUNT     --body "github-deploy@${PROJECT_ID}.iam.gserviceaccount.com"

gh variable list
gh secret list
```

> `GCP_PUBLIC_ORIGIN` starts as a placeholder because the Cloud Run URL does not exist until
> the first deploy. Step 10 replaces it.
>
> Done check: eight variables and two secrets are listed.

---

## Step 9 - First deploy

```bash
gh workflow run deploy.yml --ref main
gh run list --workflow=deploy.yml --limit 1
gh run watch <RUN_ID>
```

The workflow builds the image tagged with the commit SHA, pushes it, creates and runs the
migration job, deploys the service by digest, then smoke-tests `/api/health`.

> Done check: all four jobs (`build-and-push`, `migrate`, `deploy`, `smoke`) are green and the
> run summary prints `Release <sha> is serving from https://...`.

If a job fails, read that job's log before changing anything:

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `Permission 'secretmanager.versions.access' denied` | Service is not running as `approval-runtime` | Step 6, then redeploy |
| `Cloud SQL connection failed` / `connect ECONNREFUSED` | Missing `--add-cloudsql-instances` or `cloudsql.client` | Step 6 and the deploy job flags |
| `error: environment variable not found: DATABASE_URL` | Secret not attached | `gcloud run services describe approval-system --region <REGION> --format='value(spec.template.spec.containers[0].env)'` |
| `FAILED_PRECONDITION` on any `gcloud` step | Billing not open | Step 1 |
| Auth step fails with `invalid_target` | Attribute condition or repo name mismatch | Step 7 |

---

## Step 10 - Point the app at its real URL

```bash
gcloud run services describe approval-system --region "$REGION" --format='value(status.url)'

gh variable set GCP_PUBLIC_ORIGIN --body "https://<service-url>"
gh workflow run deploy.yml --ref main
```

> Done check: `curl https://<service-url>/api/health` returns `{"status":"ok","commit":"<sha>",...}`.

---

## Step 11 - Seed the demo accounts (for Lab 6 partners)

Run the seed once against Cloud SQL with a one-off Cloud Run job (same image, same secrets):

```bash
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/approval-system/approval-system:${IMAGE_TAG}"

gcloud run jobs deploy approval-system-seed \
  --image "$IMAGE" \
  --region "$REGION" \
  --service-account "$RUNTIME_SA" \
  --set-cloudsql-instances "${PROJECT_ID}:${REGION}:approval-db" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --command "npx" --args "tsx,prisma/seed.ts" \
  --max-retries 0 --task-timeout 300 --quiet

gcloud run jobs execute approval-system-seed --region "$REGION" --wait
```

The seed is idempotent (`upsert` by email). Share the demo passwords with the partner team
**privately** - never in the repository, the PDF, or a chat with an agent.

---

## Step 12 - Prove the running commit (R-08 / C-06)

```bash
curl https://<service-url>/api/health

gcloud run services describe approval-system \
  --region "$REGION" --format='value(status.latestReadyRevisionName)'

gcloud run revisions describe <REVISION> --region "$REGION" \
  --format='value(spec.containers[0].image)'
```

> Done check: the commit in `/api/health`, the `GIT_COMMIT` env var of the revision, and the
> image tag all show the same full commit SHA.

---

## Step 13 - Teardown after grading

```bash
gcloud run services delete approval-system --region "$REGION" --quiet
gcloud run jobs delete approval-system-migrate --region "$REGION" --quiet
gcloud run jobs delete approval-system-seed --region "$REGION" --quiet
gcloud sql instances delete approval-db --quiet
gcloud secrets delete DATABASE_URL --quiet
gcloud secrets delete JWT_SECRET --quiet
gcloud artifacts repositories delete approval-system --location "$REGION" --quiet
```

Delete the project when the course is finished: `gcloud projects delete "$PROJECT_ID"`.

---

## Values to hand back for `deployment.md` and the Lab 5 PDF

Fill these in once and keep them in one place:

| Value | Where to find it |
| :--- | :--- |
| Project ID | Step 1 |
| Region | `asia-southeast1` |
| Public URL | Step 10 |
| Running commit SHA | Step 12 (`/api/health`) |
| Cloud Run revision | Step 12 |
| Image digest | `deploy.yml` run summary, `deploy` job output |
| Cloud SQL connection name | `${PROJECT_ID}:${REGION}:approval-db` |

**No secret value is ever copied into this file, the repository, or the PDF.**
