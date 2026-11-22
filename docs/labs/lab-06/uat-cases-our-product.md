# Lab 6 - UAT Cases for OUR Sprint 1 Product (Part A handoff)

> **Product Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **UAT Team (executing these cases):** `yakginmomo/pangtao` team
> **Issue:** #44 (corrects the approach of #36/#42) · **Handout:** §1, §2, §3.1

These are the cases **we authored for our own application**. We send them to the partner so the
partner, acting as our UAT Team, can execute them on our identified Cloud release. This is the
Part A handoff (20 points). The separate `uat-cases-for-partner.md` is our own independent UAT
design for pangtao and is **not** a substitute for this document.

---

## 1. Version and handoff

| Item | Value |
| :--- | :--- |
| Application | CPE 334 Theme 5 - Workflow and Approval System (corporate expense and purchase requests) |
| Repository | <https://github.com/ssiriwan/cpe334-approval-system> (public) |
| Public URL | <https://sd3cdaba1-4d7hbszvwq-as.a.run.app> |
| Sprint 1 baseline | tag `v0.1.0-sprint1` (commit `f35ad24…`) |
| Running commit (health) | `f371c232715f1185bc46b64ea28335639ae8eabf` - confirmed by `GET /api/health` on 22 Nov 2026 |
| `main` HEAD | `eeeda0c692e8aa981bc16f7f8548b7f1fbccff84` - a documentation-only merge with `[skip ci]`, so **no new deployment occurred**; the runtime is still `f371c23…` |
| Deployed revision | `sd3cdaba1-00007-h8g` (last Cloud Run revision; to be re-confirmed from `kit.sh status`) |
| Accepted-for-test scope | **Sprint 1 only**: authentication, request creation, My Requests/data isolation, assigned review queue and decision, self-approval/state guards, append-only history, reviewer assignment. Sprint 2/3 features (return-for-revision, multi-stage, attachments, admin, reporting) are out of scope. |
| Handoff date | 22 Nov 2026 |

### 1.1 Safe test accounts (labels only - passwords sent privately)

| Label | Email | Role | Notes |
| :--- | :--- | :--- | :--- |
| Requester | `oum.requester@cpe334.local` | `REQUESTER` | Creates requests; must not be able to review |
| Reviewer-A | `t.reviewer@cpe334.local` | `REVIEWER` | Primary reviewer for `EQUIPMENT`/`TRAVEL` |
| Reviewer-B | `manager.hybrid@cpe334.local` | `REVIEWER` | Used for the self-approval and unrelated-reviewer cases |

All passwords are supplied privately. **Do not put a password, token or connection string in the
PDF, Git, a chat transcript or a screenshot.**

### 1.2 Data setup, sequencing and cleanup

- The database is seeded with the three demo accounts and contains synthetic test requests only.
- **Sequence:** run `UAT-OUM-01` first; `UAT-OUM-02` and `UAT-OUM-03` are independent of each other
  but assume the records from case 01 exist; `UAT-OUM-04` runs **last**, after our end-of-session redeploy.
- **Cleanup:** Sprint 1 has no delete endpoint. Record every `requestNo` created during testing and
  return the list with the results; the Product Team will reset the test data before grading. Do not
  delete cloud resources.
- Use synthetic titles/amounts only. No real financial or personal data.

---

## 2. UAT-OUM-01 - Normal domain journey

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-OUM-01` |
| **Requirement / AC** | FR-01, FR-02, FR-03, FR-04, FR-05; AC-01, AC-03, AC-05, AC-06, AC-AUTH-01 |
| **Purpose** | Verify the complete Sprint 1 journey from request creation through assignment and review to requester-visible status and history. |
| **Role** | `REQUESTER` then `REVIEWER` (Reviewer-A) |
| **Preconditions** | Requester and Reviewer-A can log in; requester has no existing request with the chosen title. |
| **Synthetic inputs** | title `UAT laptop for finance team`; amount `1500.00`; category `EQUIPMENT`; description `UAT case 01`; review comment `Approved for UAT`. |

### Numbered actions

1. Log in as `oum.requester@cpe334.local`.
2. Open **New Request**, fill the inputs above and submit.
3. Open **My Requests** and then the detail of the new request.
4. Log out; log in as `t.reviewer@cpe334.local`.
5. Open **Pending Reviews**, open the request created in step 2, enter the comment and click **Approve**.
6. Log out; log in again as the Requester and reopen **My Requests** and the detail.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| After step 2 | HTTP 201; `status = PENDING`; a unique `requestNo` of the form `REQ-YYYYMMDD-NNNN`; `assignedReviewerId` set to Reviewer-A for `EQUIPMENT`. |
| After step 3 | The request appears in My Requests with `PENDING`; detail shows one `SUBMITTED` history entry. |
| After step 5 | HTTP 200; status changes to `APPROVED`; `updatedAt` changes; a new `APPROVED` history entry has actor = Reviewer-A and the exact comment. |
| After step 6 | Requester sees `APPROVED` and two history entries in order. |

**Evidence IDs:** `E-OUM-01a` (created + My Requests), `E-OUM-01b` (review action), `E-OUM-01c` (final requester view).

---

## 3. UAT-OUM-02 - Business rule / boundary rejection

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-OUM-02` |
| **Requirement / AC** | BR-04, BR-07, BR-02; AC-02, AC-12, AC-08 |
| **Purpose** | Verify that invalid payloads and a second decision are rejected and that rejected operations create no record and no history entry. |
| **Role** | `REQUESTER`, then `REVIEWER` |
| **Preconditions** | `UAT-OUM-01` exists and is `APPROVED`. |
| **Synthetic inputs** | `amount = 0`; `amount = 10000000.00`; `title = AB`; `category = OTHER`; empty `description`; REJECT without comment; a second APPROVE on the decided request. |

### Numbered actions

1. As Requester, try to submit each invalid payload in turn and record the response code and body.
2. As Reviewer-A, try to REJECT a `PENDING` request with an empty comment.
3. As Reviewer-A, try to APPROVE the already-`APPROVED` request from `UAT-OUM-01`.
4. Reopen My Requests / history and count the records and entries.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| Step 1 | Every invalid submit returns `400 VALIDATION_ERROR`; **no new request row** is created. |
| Step 2 | `400 VALIDATION_ERROR`; request remains `PENDING`; no history added. |
| Step 3 | `400 INVALID_STATE_TRANSITION`; the status remains `APPROVED`; **no new history entry**. |
| Step 4 | The number of requests and history entries is unchanged from before this case. |

**Evidence IDs:** `E-OUM-02a` (validation responses), `E-OUM-02b` (state-transition response), `E-OUM-02c` (unchanged list/history).

---

## 4. UAT-OUM-03 - Forbidden role / ownership

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-OUM-03` |
| **Requirement / AC** | FR-04, FR-06; BR-01, BR-03, BR-05; AC-04, AC-07, AC-09, AC-10, AC-AUTH-03/04 |
| **Purpose** | Verify backend enforcement of role, ownership, assignment and the no-self-approval rule (not merely hidden buttons). |
| **Role** | Unauthenticated, `REQUESTER`, `REVIEWER` (Reviewer-B) |
| **Preconditions** | The request from `UAT-OUM-01` is assigned to Reviewer-A; Reviewer-B is a different reviewer. |
| **Synthetic inputs** | Reviewer-B creates an `EQUIPMENT` request of its own; the existing request ID from case 01. |

### Numbered actions

1. With no session cookie, call `GET /api/requests/my`.
2. As the Requester, call `POST /api/requests/:id/review` on the request from case 01.
3. As Reviewer-B, call `POST /api/requests/:id/review` on the request from case 01 (assigned to Reviewer-A).
4. As Reviewer-B, create an `EQUIPMENT` request (system assigns it to Reviewer-A), then call review on **its own** new request.
5. Reopen the case-01 request and confirm its status and history.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| Step 1 | `401 UNAUTHORIZED` and no private data. |
| Step 2 | `403 FORBIDDEN` - a requester may never review. |
| Step 3 | `403 ACCESS_DENIED` - not the assigned reviewer. |
| Step 4 | The self-created request is assigned to Reviewer-A; the review call returns `403 SELF_APPROVAL_NOT_ALLOWED`, checked **before** assignment. |
| Step 5 | Status and history of case 01 are unchanged by all rejected calls. |

**Evidence IDs:** `E-OUM-03a` (401), `E-OUM-03b` (403 FORBIDDEN), `E-OUM-03c` (ACCESS_DENIED), `E-OUM-03d` (SELF_APPROVAL_NOT_ALLOWED).

---

## 5. UAT-OUM-04 - State / history / persistence

| Field | Value |
| :--- | :--- |
| **ID** | `UAT-OUM-04` |
| **Requirement / AC** | BR-06, NFR-03; AC-04b, AC-11 |
| **Purpose** | Verify that a decided request and its append-only history survive a redeploy and cannot be edited or deleted. |
| **Role** | `REQUESTER` and Product Team (redeploy) |
| **Preconditions** | `UAT-OUM-01` is `APPROVED` with two history entries. |
| **Synthetic inputs** | The `requestNo` from case 01. |

### Numbered actions

1. Record the `requestNo`, status and both history entries.
2. Wait for the Product Team's agreed redeploy and obtain the new revision.
3. Log in again as the Requester and reopen the detail.
4. Attempt any update/delete of a history entry (no such endpoint should exist).

### Specific expected results

The same `requestNo`, status `APPROVED`, and the same history entries (unchanged, append-only) are still present after the redeploy. No update/delete operation is available or succeeds. If the redeploy does not happen, record **BLOCKED** with the coordination evidence, never PASS.

**Evidence IDs:** `E-OUM-04a` (before), `E-OUM-04b` (after + revision).

---

## 6. Result recording template (for the executing UAT Team)

```
Case ID | Tester (name/team) | Date/time | Tested version (commit/revision) | Inputs | ACTUAL result (do NOT copy expected) | PASS / FAIL / BLOCKED | Evidence IDs
UAT-OUM-01 | <partner tester> | 2026-11-22 .. | f371c23 / sd3cdaba1-00007-h8g | 1500 EQUIPMENT | <observed> | ... | E-OUM-01a,b,c
```

A FAIL must produce a defect report with: Issue ID, product owner/team, reporter, tested version, linked case + requirement, preconditions/data, reproduction steps, expected, actual, severity with user impact, and evidence. The Product Team will triage every finding in `findings-triage.md`.
