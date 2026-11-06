# Cross-workspace tests

This directory is reserved for tests that span the `client/` and `server/`
workspaces, such as API/database integration tests and acceptance checks.

- Client unit/component tests live in `client/src/**/*.test.tsx`.
- Server API/unit tests live in `server/tests/**/*.test.ts`.
- Root-level integration tests can be added here as `*.test.ts` and are run by
  `npm test` through `tests/vitest.config.ts`.
- Playwright browser journeys are configured separately under `e2e/`.
