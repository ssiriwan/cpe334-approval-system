# Deliverable 2 Setup Summary (Part E)

> Mirrors `README.md` on the candidate commit. Environment variable **names** only — no real secrets or demo passwords are reproduced here.

## 1. Requirements
- Node.js ≥ 20, npm ≥ 10, PostgreSQL ≥ 17 (local or Docker, host port 5434).

## 2. Clean-clone setup
```bash
git clone https://github.com/ssiriwan/cpe334-approval-system.git
cd cpe334-approval-system
npm install
cp .env.example .env          # edit DATABASE_URL / JWT_SECRET for your machine
npm run prisma:generate
npm run prisma:migrate         # dev: applies both migrations
npm run prisma:seed
npm run dev:server             # terminal 1, http://localhost:3000
npm run dev:client             # terminal 2, http://localhost:5173
```

Production/released databases use `npx prisma migrate deploy --schema prisma/schema.prisma`, then `npx prisma migrate status`.

## 3. Migrations on the candidate
| Migration | Scope |
| :--- | :--- |
| `20261110084745_init_schema` | Sprint 1 core tables and enums |
| `20261127183708_sprint2_lifecycle_and_attachments` | CR-05 lifecycle values, `stage` columns, `Attachment` table |

The second migration is additive; verification and rollback procedure: `docs/sprints/sprint-2/migration-note.md`.

## 4. Environment variables (names only)
`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`, `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`, `COOKIE_SECURE`, `GIT_COMMIT`, `UPLOAD_DIR`, `MAX_ATTACHMENT_MB`, `DEMO_USER_PASSWORD`, `SEED_DEMO_DATA`.
Secrets are never committed; production supplies them through Secret Manager (Lab 5).

## 5. Demo accounts (synthetic)
Four seeded accounts: one requester, three reviewers (primary category reviewers + the distinct stage-2 reviewer). Credentials are documented privately in the README and are not reproduced in the PDF.

## 6. Build / test / deploy
```bash
npm run build        # client + server TypeScript/build
npm test             # 14 files / 75 tests on the candidate
npm run e2e          # Playwright journeys
npm run docker:build # image approval-system:local
```
CI: `ci-docker.yml` runs on PR/push to `sprint-2-staging` and `main`.
Deployment: `deploy.yml` triggers on push to `main` (or manual dispatch) and verifies `/api/health` reports the release commit.

## 7. Known limitations
Admin endpoints (F-10), full reporting/aggregation, p95 measurement, final clean-clone recheck and CSRF/rate limiting are planned (F-11). Multi-stage is capped at two stages; no `RETURN` from `PENDING_STAGE2`. Attachments are append-only and the MIME check trusts the declared content type.
