# F-08 Completion Record — Request Attachments

> **Issue:** #71 · **Feature:** F-08 · **Contract:** `f-08-attachments.md` (v1.0, #84)
> **Owner:** Oum (67070501075) · **Reviewer:** T (67070501021)
> **Status:** implemented and tested locally; awaiting teammate PR review
> **Dependencies:** migration bundle #77, F-03 data isolation, F-07 stage assignment

---

## 1. AC → Test → Result

| AC | Test ID | Test file / name | Level | Result | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AC-16.1 | TEST-17.1 | `server/tests/attachments.test.ts` — owner uploads valid synthetic PNG/PDF/JPEG <= 5MB -> 201, row created with metadata, retrievable via GET /api/attachments/:id | API/DB integration | PASS | `8ae1271` |
| AC-16.2 | TEST-17.2 | `server/tests/attachments.test.ts` — wrong MIME, oversize file (>5MB), or missing file -> 400 VALIDATION_ERROR with specific error code, no row, no orphan file on disk | API integration | PASS | `8ae1271` |
| AC-16.3 | TEST-17.3 | `server/tests/attachments.test.ts` — owner lists and downloads attachments of own request -> 200 with metadata only, internal filesystem path is NEVER exposed | API integration | PASS | `8ae1271` |
| AC-16.4 | TEST-17.4 | `server/tests/attachments.test.ts` — current assigned reviewer can list and download; after reassignment / stage switch, previous reviewer receives 403 ACCESS_DENIED | API/DB integration | PASS | `8ae1271` |
| AC-16.5 | TEST-17.5 | `server/tests/attachments.test.ts` — other requester receives 403 ACCESS_DENIED; unauthenticated receives 401; unknown attachment/request receives 404; no file bytes in errors | API integration | PASS | `8ae1271` |
| AC-16.6 | TEST-17.6 | `server/tests/attachments.test.ts` — append-only persistence across restart: metadata and bytes identical, no update/delete route exists | API/DB integration | PASS | `8ae1271` |
| UI (contract §2) | component tests | `client/src/components/AttachmentSection.test.tsx` — render empty state, list attachments, client-side validation for type & size, upload dispatch | UI unit/integration | PASS | `cef53bc` |

---

## 2. TDD evidence

| Phase | Commit | Date | Output |
| :--- | :--- | :--- | :--- |
| RED (test only, endpoints absent) | `7e9d98b` | 28 Nov 2026 | `Test Files 1 failed (1)`, `Tests 6 failed (6)` — 404 on missing attachment routes |
| GREEN (backend implementation) | `8ae1271` | 28 Nov 2026 | `Test Files 1 passed (1)`, `Tests 6 passed (6)` in 2.15s |
| UI & Full regression | `cef53bc` | 28 Nov 2026 | `Test Files 12 passed (12)`, `Tests 70 passed (70)`; `npm run build` succeeded (client + server) |

Evidence IDs: `E-D2-F08-RED` (`7e9d98b` output), `E-D2-F08-GREEN` (`8ae1271` output), `E-D2-F08-REG` (`cef53bc` full 70-test suite pass).

---

## 3. Implementation summary

| Layer | Artifact | Notes |
| :--- | :--- | :--- |
| Config | `server/src/config.ts` | Added `uploadDir` (default `uploads/`, gitignored) and `maxAttachmentBytes` (default `5 * 1024 * 1024` = 5 MB). |
| Service | `server/src/services/attachment.service.ts` | Strict check order: auth (401) → existence (404) → authorization (403) → file/MIME (400) → size (400) → write + insert (201). Compensating file deletion on DB error. Download dynamically re-evaluates current `assignedReviewerId`. Strips `path` from serialization. |
| Routes | `server/src/routes/requests.ts` & `attachments.ts` | `POST /api/requests/:id/attachments` (using `multer.memoryStorage()`), `GET /api/requests/:id/attachments`, and `GET /api/attachments/:id` for authorized file streaming. |
| Middleware | `server/src/middleware/error.ts` | Gracefully handles `MulterError` (e.g. `LIMIT_FILE_SIZE` -> 400 `ATTACHMENT_TOO_LARGE`). |
| Client UI | `client/src/components/AttachmentSection.tsx` | Reusable attachment section with empty, loading, list, download, and upload controls. Embedded into `RequestDetailPage` and `ReviewDetailPage`. Client-side type & size guards matching server policy. |
| Client Tests | `client/src/components/AttachmentSection.test.tsx` | Tests empty list, rendered attachments, client validation on bad file type/size, and upload invocation. |

---

## 4. Verification notes

- **Authorization re-evaluation on reassignment:** Verified in TEST-17.4 that when a request is reassigned or advances to stage 2, the previous reviewer immediately receives `403 ACCESS_DENIED` upon trying to download attachments.
- **Zero internal path leakage:** Verified across all endpoints that `path` is not returned in responses; storage uses random UUIDs on disk to prevent path traversal or file overwrites.
- **Compensating delete on failure:** If database insertion fails during upload, the temporary file written to disk is immediately unlinked.

---

## 5. Definition of Done checklist

- [x] Contract v1.0 committed before code (#84).
- [x] Multipart parser dependency (`multer` & `@types/multer`) installed and configured.
- [x] Endpoints implemented with exact contract check order and compensating cleanup.
- [x] Reviewer & requester UI attachment section implemented with all required states.
- [x] TEST-17.1..17.6 RED→GREEN with real commits.
- [x] Full regression and build green on the GREEN commit.
- [ ] Teammate substantive review and merge into `sprint-2-staging`.
- [ ] Record accepted release in the completion table after merge (Part B).

---

## 6. Version history

| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial completion record with AC→test mapping and TDD evidence. | Deliverable 2 Part B completion table. |
