# Lab 6 - UAT Cases for OUR Sprint 1 Product (Part A handoff)

> **Product Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **UAT Team (executing these cases):** `yakginmomo/pangtao` team
> **Issue:** #44 (corrects the approach of #36/#42) · **Handout:** §1, §2, §3.1

These are the cases **we authored for our own application**. We send them to the partner so the
partner, acting as our UAT Team, can execute them on our identified Cloud release. This is the
Part A handoff (20 points). The filename is kept as `uat-cases-for-partner.md` because it is the
document we hand to the partner; its contents are cases for **our** product, as handout §1/§2 require.

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
| Deployed revision | `sd3cdaba1-00008-2pg` at 08:30 UTC (Cloud Run revision changes on restart/redeploy; re-check with `kit.sh status` before each case). Image digest `sha256:8c1ed41dc500696e9e605b79c2c4ebd8e6e9a39b750310a11ab9a1c3622dbdce`. |
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
| **Preconditions** | `UAT-OUM-01` exists and is `APPROVED`. For step 2 the Requester must first create a **new PENDING** request (see actions). |
| **Synthetic inputs** | `amount = 0`; **`amount = 10000000000.00`** (10 billion - above the BR-04 maximum of 9,999,999,999.99); `title = AB`; `category = OTHER`; empty `description`; target for step 2: title `UAT-OUM-02 reject target`, amount `250.00`, category `EQUIPMENT`, description `case 02 target`; REJECT with an empty comment; a second APPROVE on the decided request. |

### Numbered actions

1. As Requester, try to submit each invalid payload in turn through the **UI**. Record the inline field error shown and whether the form submits. Optionally repeat the same payload with the browser DevTools `fetch` (see §7.2) and record the `400 VALIDATION_ERROR` body.
2. **Target setup:** as Requester create the new `PENDING` request from the synthetic inputs (title `UAT-OUM-02 reject target`, 250.00, EQUIPMENT). Then, as Reviewer-A, open its detail in Pending Reviews and try to **REJECT with an empty comment**. The request from case 01 is already `APPROVED` and must **not** be used for this step.
3. As Reviewer-A, try to APPROVE the already-`APPROVED` request from `UAT-OUM-01`.
4. Reopen My Requests / history and count the records and entries.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| Step 1 via UI | The form shows an inline validation error and does **not** submit; no new request row is created. |
| Step 1 via API (optional) | Each invalid payload returns `400 VALIDATION_ERROR` with the code in the body; no new request row. |
| Step 2 | The new reject-target request remains `PENDING`; API returns `400 VALIDATION_ERROR`; no history added. |
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
5. As Reviewer-B, open the **detail page/API** of the case-01 request (assigned to Reviewer-A, owned by the Requester).
6. Reopen the case-01 request as the Requester and confirm its status and history.

### Specific expected results

| Observation | Expected |
| :--- | :--- |
| Step 1 | `401 UNAUTHORIZED` and no private data. |
| Step 2 | `403 FORBIDDEN` - a requester may never review. |
| Step 3 | `403 ACCESS_DENIED` - not the assigned reviewer. |
| Step 4 | The self-created request is assigned to Reviewer-A; the review call returns `403 SELF_APPROVAL_NOT_ALLOWED`, checked **before** assignment. |
| Step 5 | Reviewer-B is neither owner nor assigned reviewer, so `GET /api/requests/:id` returns `403 ACCESS_DENIED` and no request data/history is disclosed (data isolation). |
| Step 6 | Status and history of case 01 are unchanged by all rejected calls. |

**Evidence IDs:** `E-OUM-03a` (401), `E-OUM-03b` (403 FORBIDDEN), `E-OUM-03c` (ACCESS_DENIED), `E-OUM-03d` (SELF_APPROVAL_NOT_ALLOWED), `E-OUM-03e` (Reviewer-B detail ACCESS_DENIED).

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
2. Wait for the Product Team's agreed redeploy. We will redeploy the **same code/image** (commit reported by `/api/health` stays `f371c23…`); the Cloud Run **revision number will change** (it was `sd3cdaba1-00008-2pg` at 08:30 UTC). We will notify you of the new revision before the retest.
3. Log in again as the Requester and reopen the detail.
4. There is deliberately **no update/delete endpoint for history**. Report this as an expected absence; do not invent a call. If you want a negative probe, send `PUT`/`DELETE /api/requests/:id/history` and expect `404 NOT_FOUND` or `405 METHOD_NOT_ALLOWED` - neither should change any history entry.

### Specific expected results

The same `requestNo`, status `APPROVED`, and the same history entries (unchanged, append-only) are still present after the redeploy at the new revision. **We will NOT reset the data before your retest** - the same records must be there to prove persistence. Any reset would happen only after grading. If the redeploy does not happen, record **BLOCKED** with the coordination evidence, never PASS.

**Evidence IDs:** `E-OUM-04a` (before), `E-OUM-04b` (after + revision).

---

## 6. Result recording template (for the executing UAT Team)

```
Case ID | Tester (name/team) | Date/time | Tested version (commit/revision) | Inputs | ACTUAL result (do NOT copy expected) | PASS / FAIL / BLOCKED | Evidence IDs
UAT-OUM-01 | <partner tester> | 2026-11-22 .. | f371c23 / sd3cdaba1-00008-2pg (confirm at run time) | 1500 EQUIPMENT | <observed> | ... | E-OUM-01a,b,c
```

A FAIL must produce a defect report with: Issue ID, product owner/team, reporter, tested version, linked case + requirement, preconditions/data, reproduction steps, expected, actual, severity with user impact, and evidence. The Product Team will triage every finding in `findings-triage.md`.

---

## 7. Execution and reporting clarifications (answers to the UAT Team)

### 7.1 Amount boundary in UAT-OUM-02
You are right: `10000000.00` (10 million) is **within** BR-04 (max `9,999,999,999.99`). The input is
corrected to **`10000000000.00`** (10 billion), which is above the maximum and must be rejected.

### 7.2 Using the API from the browser
Yes - use the browser DevTools console while logged in, e.g.:

```js
const r = await fetch('/api/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ title: 'AB', amount: 0, category: 'EQUIPMENT', description: 'x' })
});
console.log(r.status, await r.text());
```

The session is an httpOnly cookie, so `credentials: 'include'` is required; do not copy the cookie value.
Find a request's `:id` from `GET /api/requests/my` → `data.requests[].id`, or from the detail URL
`/requests/<id>` in the browser address bar.

### 7.3 UI vs API for step 1
Test **both**: through the UI expect the inline validation message and no submitted request; through
the API expect `400 VALIDATION_ERROR` (BR-04). Both are legitimate UAT observations; record which one
each evidence ID refers to.

### 7.4 Redeploy and data
Same commit/image, new Cloud Run revision; we notify you before and after. **No data reset before
your retest** - persistence is exactly what case 04 checks.

### 7.5 Where to report and severity
Open a GitHub Issue in **this** repository with label `lab6`, linking the case ID and requirement, or
send the same fields through the agreed handoff if you do not have write access. Use:

| Severity | Meaning (user impact) | Example for our app |
| :--- | :--- | :--- |
| Critical | Security/data leak or unsafe release | Another user can read/modify a request, self-approval succeeds, plaintext secret exposed |
| Major | A Sprint 1 acceptance criterion fails | Wrong status transition allowed, history lost, decision without required comment persisted |
| Minor | Cosmetic or wording issue | Unclear validation message, layout glitch; must be fixed or explicitly accepted as a known limitation |

Enhancements outside the agreed Sprint 1 scope are not defects (e.g. Sprint 2 return-for-revision).

### 7.6 Reviewer-B detail access
Yes, we added step 5 to UAT-OUM-03: Reviewer-B must get `403 ACCESS_DENIED` on the case-01 detail
because they are neither the owner nor the assigned reviewer. This is the data-isolation check.
