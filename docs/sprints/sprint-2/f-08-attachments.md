# Contract F-08 — Request Attachments

> **Feature ID:** F-08 · **Issue:** #71 · **Linked requirements:** FR-09, BR-03, NFR-01, NFR-04, NFR-06
> **Owner:** Oum (67070501075) · **Reviewer:** T (67070501021)
> **Status:** v1.0 pre-implementation — awaiting teammate review (depends on #77)
> **Artifact:** `docs/sprints/sprint-2/f-08-attachments.md`
> **Dependencies:** migration bundle #77, F-03 data isolation, F-07 stage assignment

---

## 1. Feature SDS

Attachments are synthetic files associated with a request, stored on the local filesystem, and served only through an authorized API. No external object store or third-party service is used in Sprint 2.

### Rules

1. **Who may upload:** request owner **or** the currently assigned reviewer (including stage-2 reviewer after F-07). Other authenticated users → `403 ACCESS_DENIED`; unauthenticated → `401 UNAUTHORIZED`; unknown request → `404 NOT_FOUND`.
2. **Who may download:** same set, re-evaluated at download time from the current `assignedReviewerId`. A reviewer who was reassigned away must no longer be able to read a file.
3. **Limits:** one upload ≤ `MAX_ATTACHMENT_MB` (default **5 MB**); MIME allowlist `application/pdf`, `image/png`, `image/jpeg`; other types → `400 VALIDATION_ERROR` (`INVALID_ATTACHMENT_TYPE`); oversize → `400 VALIDATION_ERROR` (`ATTACHMENT_TOO_LARGE`).
4. **Storage:** files are written under `UPLOAD_DIR` (default `uploads/`, gitignored) using a generated UUID filename; the original filename is stored for display only and is never used as a filesystem path (path traversal is impossible). No real or private file may be committed; test fixtures are synthetic.
5. **Append-only:** no update/delete endpoint in Sprint 2. A failed upload leaves **no** database row and **no** orphan file (compensating delete if the DB insert fails).
6. **Metadata only in API:** responses expose `id`, `requestId`, `uploader {id,name,email}`, `filename`, `mime`, `size`, `createdAt`. **No filesystem path** is returned.
7. **Implementation approach:** add a multipart parser dependency (e.g. `multer` + `@types/multer`) in issue #71 with memory storage; validate before writing to disk; raise the JSON body limit only if an alternative JSON/base64 approach is chosen and document the reason. Dependency and env names are recorded in README (#80).

### Check order — upload

`authentication (401) → request existence (404) → ownership/current-assignment (403) → file presence & MIME (400) → size (400) → write + DB insert → 201`.

### Check order — download

`authentication (401) → attachment existence (404) → request existence (404) → ownership/current-assignment (403) → stream bytes (200)`.

> Authorization must never be replaced by an unguessable URL: every download goes through the API.

---

## 2. UI Specification

| Component | Access | States |
| :--- | :--- | :--- |
| `AttachmentSection` on `RequestDetailPage` and `ReviewDetailPage` | owner / current reviewer | loading, empty ("no attachments"), list (filename, size KB, uploader, time), upload control, uploading/disabled, success, error banner with code |

- Upload control is rendered only for eligible users/requests, but the backend enforces the rule.
- Client-side checks mirror the 5 MB limit and MIME allowlist; the server repeats all checks.
- Download link calls the API with the cookie; no direct static URL is exposed.
- No delete/edit button is rendered; a note explains that attachments are append-only in Sprint 2.

---

## 3. API Specification

| Endpoint | Method | Request | Success | Errors |
| :--- | :---: | :--- | :--- | :--- |
| `/api/requests/:id/attachments` | POST | `multipart/form-data` field `file` | `201 { data: { attachment } }` | 401; 403 `ACCESS_DENIED`; 404; 400 `VALIDATION_ERROR` (`INVALID_ATTACHMENT_TYPE` / `ATTACHMENT_TOO_LARGE` / `MISSING_FILE`) |
| `/api/requests/:id/attachments` | GET | cookie | `200 { data: { attachments: [...] } }` | 401; 403 `ACCESS_DENIED`; 404 |
| `/api/attachments/:id` | GET | cookie | `200` file bytes with `Content-Type` and `Content-Disposition: inline; filename="..."` | 401; 403 `ACCESS_DENIED`; 404 `NOT_FOUND` |

- No `PUT/PATCH/DELETE` route for attachments.
- Error bodies follow `{ error: { code, message, details? } }`; a rejected upload returns no bytes and writes no file.

---

## 4. Data Specification (#77)

```prisma
model Attachment {
  id         String   @id @default(uuid())
  requestId  String
  request    ApprovalRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  uploaderId String
  uploader   User     @relation(fields: [uploaderId], references: [id])
  filename   String
  mime       String
  size       Int
  path       String
  createdAt  DateTime @default(now())

  @@index([requestId, createdAt])
}
```

- `size` is in bytes; `mime` validated against the allowlist; `path` is an internal relative path never serialized.
- Relations on `User`/`ApprovalRequest` are additive; no change to Sprint 1 rows.
- `UPLOAD_DIR` and `MAX_ATTACHMENT_MB` are environment names only — values are not committed as real secrets.

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
| :--- | :--- |
| **AC-16.1** | Owner or current assigned reviewer uploads a valid PDF/PNG/JPEG ≤ 5 MB → `201`, one `Attachment` row with correct metadata, file retrievable via `GET /api/attachments/:id`. |
| **AC-16.2** | Wrong MIME, oversize file, or missing file → `400 VALIDATION_ERROR` with the specific code, no row, no file on disk. |
| **AC-16.3** | Owner can list and download attachments of their own request → `200` with metadata only (no `path`). |
| **AC-16.4** | Current assigned/stage reviewer can list and download; after reassignment the previous reviewer receives `403 ACCESS_DENIED` and no bytes. |
| **AC-16.5** | A different requester or unauthenticated caller → `403 ACCESS_DENIED` / `401 UNAUTHORIZED`; unknown attachment or request → `404 NOT_FOUND`; no file bytes in any error response. |
| **AC-16.6** | Attachments are append-only and persist across restart: no update/delete route exists, and metadata + downloaded bytes are identical before/after restart. |

---

## 6. Software Test Specification

| Test ID | AC | Level | Preconditions / Input | Action | Expected result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-17.1** | AC-16.1 | API/DB integration | valid synthetic PNG, 2 KB | `POST /attachments` as owner, then `GET /api/attachments/:id` | `201`, row + bytes, matching metadata |
| **TEST-17.2** | AC-16.2 | API integration | `.txt`, 6 MB PNG, no file | upload three times | `400 VALIDATION_ERROR` with `INVALID_ATTACHMENT_TYPE` / `ATTACHMENT_TOO_LARGE` / `MISSING_FILE`; no row/file |
| **TEST-17.3** | AC-16.3 | API integration | owner cookie | `GET /attachments` list + download | `200`; fields present; `path` absent |
| **TEST-17.4** | AC-16.4 | API/DB integration | assigned reviewer downloads; reviewer changed via F-06 resubmit/F-07 stage switch | download before and after | `200` then `403 ACCESS_DENIED`, no bytes |
| **TEST-17.5** | AC-16.5 | API integration | other requester, no cookie, random ids | list/download | `403`, `401`, `404`; empty error bodies |
| **TEST-17.6** | AC-16.6 | API/DB integration | uploaded file captured; restart | re-list/download; `PUT`/`DELETE` attempts | identical metadata/bytes; no write route |

Additional checks: filename with `../` is stored as display text only and never resolves outside `UPLOAD_DIR`; no secret or real file is committed.

---

## 7. Definition of Done

- [ ] Contract v1.0 reviewed and merged before implementation (Issue #71); migration #77 verified.
- [ ] Multipart parser dependency added and README updated (#80) with env names only.
- [ ] Upload/list/download endpoints implemented with the §1 check order and compensating cleanup.
- [ ] UI attachment section implemented with all states; no path disclosure or delete control.
- [ ] TEST-17.1..17.6 RED→GREEN; regressions F-03 isolation + BR-01/03 pass.
- [ ] Completion table row and evidence `E-D2-F08-*`; only synthetic files used.

## 8. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial attachment contract: local storage, authorization, limits, AC-16.1..16.6, TEST-17.1..17.6. | Deliverable 2 F-08; no external service in Sprint 2. |
