# Contract E0 - F-01 Auth and Session

> **Feature ID:** F-01
> **Issue:** #3 - Auth foundation: schema, seed, login/logout/me
> **Linked requirements:** FR-01, NFR-01, NFR-04
> **Owner:** T (67070501021)
> **Reviewer:** Oum (67070501075)
> **Status:** v1.1 implemented and verified locally
> **Artifact:** `docs/sprints/sprint-1/feature-00-auth.md`

---

## 1. Feature SDS

The system must support authenticated sessions for the requester and reviewer
slices:

- verify email/password credentials against the `User` table;
- issue a signed JWT in an httpOnly cookie;
- load the current user for protected requests;
- expose login, logout, and current-user endpoints;
- reject missing, invalid, expired, or deleted-user sessions with `401`;
- reject authenticated users who lack the required role with `403`;
- never return or log `passwordHash`.

Authentication is stateless in Sprint 1. Logout clears the cookie on the client;
server-side token revocation is a documented limitation and is deferred.

---

## 2. UI Specification

### LoginPage

- Fields: `email`, `password`.
- Inline validation for required fields and email format.
- Loading state while the request is in flight.
- Invalid credentials show the server error code/message.
- Successful login redirects according to the user's role.
- The client must not store the JWT in `localStorage`.

### Session behavior

- Authenticated screens call `GET /api/auth/me` on load or use the login response.
- A `401` response clears client auth state and redirects to `/login`.
- The logout action calls `POST /api/auth/logout` and redirects to `/login`.
- Role-aware navigation is a UX aid, not an authorization boundary.

---

## 3. API Specification

All responses use the standard envelope:

- Success: `{ "data": ... }`
- Failure: `{ "error": { "code": "...", "message": "...", "details"?: ... } }`

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/auth/login` | POST | `{ email, password }` | `200 { data: { user: { id, email, name, role } } }` + `Set-Cookie` | `400 VALIDATION_ERROR`; `401 UNAUTHORIZED` |
| `/api/auth/logout` | POST | cookie | `200 { data: { message } }` + cleared cookie | `401 UNAUTHORIZED` |
| `/api/auth/me` | GET | cookie | `200 { data: { user } }` | `401 UNAUTHORIZED` |

### Cookie contract

| Attribute | Value |
| :--- | :--- |
| Name | `token` |
| `httpOnly` | `true` |
| `sameSite` | `lax` |
| `secure` | `true` in production; `false` for local/test |
| `path` | `/` |
| `maxAge` | 8 hours |

### Authentication header behavior

- The API reads the cookie, not an `Authorization` header.
- Missing or invalid cookie -> `401 UNAUTHORIZED`.
- Expired token -> `401 UNAUTHORIZED`.
- A token whose user no longer exists -> `401 UNAUTHORIZED`.

### Role guard behavior

`requireRole('REVIEWER')` returns `403 FORBIDDEN` for an authenticated
`REQUESTER`. For Issue #3, `TEST-AUTH-04` exercises this middleware through a
test-only reviewer route; the product reviewer endpoints are added in Issue #5.

---

## 4. Data Specification

Uses the existing Prisma models:

- `User.id` (UUID)
- `User.email` (unique)
- `User.passwordHash` (bcrypt, cost 12)
- `User.name`
- `User.role` (`REQUESTER`, `REVIEWER`, future `ADMIN`)
- `User.createdAt`

The seed script is idempotent and upserts three synthetic accounts. No schema
change beyond the foundation is required for this contract.

---

## 5. Acceptance Criteria

| ID | Acceptance criterion |
| :--- | :--- |
| AC-AUTH-01 | Valid email/password login returns `200`, sets an httpOnly `token` cookie, and returns the user without `passwordHash`. |
| AC-AUTH-02 | Wrong password or unknown email returns `401 UNAUTHORIZED` and does not set a cookie. |
| AC-AUTH-03 | `GET /api/auth/me` returns the current user when authenticated; missing/invalid session returns `401`; logout clears the cookie and subsequent `/me` returns `401`. |
| AC-AUTH-04 | A `REQUESTER` calling a reviewer-only route receives `403 FORBIDDEN`; backend role enforcement is not UI-only. |
| AC-AUTH-05 | Stored passwords use bcrypt with cost 12; JWT expiry is 8 hours; no plaintext password or hash appears in responses. |

---

## 6. Software Test Specification

| Test ID | AC | Level | Preconditions / input | Action | Expected |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-AUTH-01 | AC-AUTH-01 | API integration | Seeded active user | `POST /api/auth/login` with valid credentials | `200`; `Set-Cookie` contains httpOnly `token`; body contains public user fields; no `passwordHash` |
| TEST-AUTH-02 | AC-AUTH-02 | API integration | Wrong password and unknown email | `POST /api/auth/login` | `401 UNAUTHORIZED`; no `Set-Cookie` |
| TEST-AUTH-03 | AC-AUTH-03 | API integration | No cookie; valid session; logout | `GET /me`; `POST /logout`; `GET /me` again | `401`; then `200`; then cleared cookie and `401` |
| TEST-AUTH-04 | AC-AUTH-04 | API integration | Requester cookie and reviewer cookie | Request a reviewer-only guard route | Requester `403 FORBIDDEN`; reviewer `200` |
| TEST-AUTH-05 | AC-AUTH-05 | Unit/API integration | DB user row and login response | Inspect hash and decode JWT | Hash starts with `$2` and cost 12; `exp - iat = 8h`; no plaintext password |

Additional negative checks:

- invalid email shape -> `400 VALIDATION_ERROR`;
- missing body fields -> `400 VALIDATION_ERROR`;
- logout without a session -> `401 UNAUTHORIZED`;
- tampered token -> `401 UNAUTHORIZED`.

---

## 7. Definition of Done

- [x] Contract committed before implementation.
- [x] Migration and seed run from a clean database (`prisma migrate reset` + seed).
- [x] Login/logout/me implementation uses the standard response shape.
- [x] Cookie flags match this contract.
- [x] `TEST-AUTH-01..05` implemented and passing (9 server tests total).
- [x] No plaintext password or hash in responses/logs.
- [ ] Teammate review completed; author does not self-approve. (pending PR review)
- [ ] PR merged into `sprint-1-staging`. (pending)
- [x] Red/green TDD evidence recorded (red run: `8 failed | 1 passed`).

---

## 8. Version History

| Version | Date | Change | Reason | Commit/PR |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 10 Nov 2026 | Initial auth contract. | Sprint 1 baseline. | `fc8f548` |
| v1.1 | 10 Nov 2026 | Implementation notes: config/env loader, Prisma singleton, central error handler, `requireAuth`/`requireRole`, auth routes, initial migration, TEST-AUTH-01..05 green. | Auth foundation implemented and verified. | This PR |
| v1.2 | 11 Nov 2026 | Prisma root scripts now load the repository-root `.env`; seed loads it explicitly. Verified `cp .env.example .env && npm run prisma:migrate && npm run prisma:seed` in a clean shell. | Review finding: clean-clone setup failed with `P1012 Environment variable not found: DATABASE_URL`. | This PR |
