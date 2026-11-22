# Lab 6 - Review of the Partner Repository (Pangtao)

> Reviewer: Oum & T (UAT Team) · Date: 22 Nov 2026 · Issue #36
> Partner: <https://github.com/yakginmomo/pangtao>

This review establishes **what version we are testing** and what the Sprint 1 contract says, before
executing `uat-cases-for-partner.md`. It is a source-level and documentation review only; no
billing/IAM/database change was made.

## 1. Identity and versions

| Item | Value |
| :--- | :--- |
| Repository | Public, default branch `main` |
| `main` HEAD at review | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` |
| Release tag `v0.1.0` | `bec5575c3ce434b4b1eac0899e734e513e672d9f` |
| Deployed revision | Commit on `main`: `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` (partner-confirmed). Issues #27/#28 remain open in their repo, so the runtime evidence is still their responsibility. |
| Public URL | <https://pangtao-vowtduxdha-as.a.run.app> |
| Health | `GET /api/v1/health` returned `{"status":"ok"}` at review time |
| Repo created / last push | 2026-11-07 / 2026-11-17 |

**Important:** the health handler does not report a commit. The exact deployed version must come from the
deploy run summary (`Commit image tag` / `Digest`), the image label `org.opencontainers.image.revision`,
the startup log `🚀 Pangtao server running ... commit <sha>`, or `gcloud run services describe pangtao`.
The partner confirmed that the commit on `main` is the deployed version; we record `64c98f4…` with that source of truth.

## 2. Stack and security model (source review)

- Front end: React 18 + TypeScript + Vite + React Router + TanStack Query.
- Back end: Node.js 20, Express, TypeScript, Zod validation.
- Data: PostgreSQL 16 + Prisma, managed migrations; sessions, failed-login counters and ledger data in PostgreSQL (no state only in the container).
- Auth: HTTP-only session cookie, SHA-256 session-token hashing, bcrypt cost 12, default-deny `USER`/`ADMIN` authorization, CSRF protection.
- Routes: `/` Dashboard (USER), `/transactions/new`, `/transactions`, `/transactions/:id`, `/summary`, `/admin/users` (ADMIN). `ProtectedRoute` enforces `allowedRole`.
- Amounts stored as integer satang (`NFR-03`); money formatting/parsing in `web/src/utils/money.ts`.

## 3. Sprint 1 scope relevant to our cases

| Feature | Sprint 1 requirement | Case we wrote |
| :--- | :--- | :--- |
| Auth / roles | FR-01..04, NFR-02 | UAT-PT-03, UAT-PT-05 |
| Admin users | FR-05, FR-06; BR-03, BR-13 | UAT-PT-05 |
| Accounts and balances | FR-08; BR-01, BR-04, BR-07, BR-14 | UAT-PT-01, UAT-PT-04 |
| Opening balance | FR-10; BR-11 | UAT-PT-01 |
| Payment / Receipt | FR-12, FR-13; BR-05, BR-06, BR-10, BR-16 | UAT-PT-01, UAT-PT-02 |
| History | FR-17 | UAT-PT-01, UAT-PT-02, UAT-PT-04 |
| Summary | FR-22; BR-08, BR-09 | UAT-PT-01 |
| Ownership / ADMIN denial | BR-01, BR-02 | UAT-PT-03 |

Not in the assessed Sprint 1 scope: BR-12 voiding (F-13 is Sprint 2), multi-stage/advanced search,
and the `LOG_LEVEL` variable (reserved, not read by code).

## 4. CI/CD review and risks

- `ci.yml` has four independent jobs: lint/type-check/build; Vitest unit + API with an 80% service-layer
  coverage gate; Playwright E2E after migrate + seed; Docker build with `GIT_SHA` label check. A PR into
  `main` or `sprint-*-staging` runs all four; `deploy.yml` reuses them via `workflow_call`.
- `deploy.yml` requires the `demo` environment variables `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`
  and `WIF_SERVICE_ACCOUNT`; the ruleset on `main` must require the four CI checks, not `test-and-docker`.
- Open Lab 5 issues **#27** (deploy workflow/first pipeline release) and **#28** (persistence check)
  mean the live deployment state is not fully evidenced in their repo. We therefore ask for the
  deployed revision before recording any version.
- Closed issue **#31** records two intermittent E2E failures with Prisma `P2028`. If our UAT sees a
  transaction fault, we will record the exact time and response rather than assume a product defect.

## 5. Questions / handoff requests to the Product Team

2. Please supply the three demo passwords privately; we will not put them in Git or the PDF.
3. Please confirm Sprint 1 scope only is under test, and notify us before any redeploy.
4. Please perform the agreed redeploy at the end so `UAT-PT-04` can be executed (before/after evidence).
5. Please run the cases we supplied as a self-check; our independent execution is recorded separately.

## 6. Review outcome

The repository is public, has a clear Sprint 1 contract, automated CI, a documented release procedure,
and synthetic demo accounts for all three roles. It is ready for independent UAT **once the deployed
revision and private credentials are confirmed**. No billing, IAM or database change was made by us.
