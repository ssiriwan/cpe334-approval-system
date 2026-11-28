# Contract F-11 — Hardening, Regression & Deployment (Planned)

> **Feature ID:** F-11 · **Issue:** #72 · **Linked requirements:** NFR-01..NFR-06
> **Owner:** T (67070501021) · **Reviewer:** Oum (67070501075)
> **Status:** v1.0 **PLANNED** — final Sprint 3 activity; no work claimed as done here
> **Artifact:** `docs/sprints/sprint-3/f-11-hardening-deployment.md`
> **Dependencies:** F-01..F-10 (all product features)

---

## 1. Feature SDS (planned)

Final hardening pass on the integrated product. No new business feature; the goal is measurable NFR evidence and a reproducible final release.

### Planned work items
| Item | NFR | Planned verification |
| :--- | :--- | :--- |
| Secret scan, dependency audit, cookie flags review | NFR-01 | secret scan + code review + TEST-AUTH-01..05 |
| p95 < 300 ms over 50 warm requests for list/review endpoints; no N+1 | NFR-02 | autocannon/timing script with recorded output |
| Restart + clean-clone `migrate deploy` + seed reproducibility | NFR-03 | restart test + clean DB run |
| Negative/boundary suite for every new endpoint, no stack trace/secret in response | NFR-04 | negative tests + error middleware review |
| 100% AC mapped to an executed test | NFR-05 | AC/TEST registry (#81) + traceability (#73) |
| Docker + env injection + `/api/health`, GCP deploy, migration job | NFR-06 | clean-clone build/run + deployed health commit check |
| CSRF token / rate limiting / audit export review | NFR-01/04 | document decision; implement only if approved in change log |

**Out of scope for F-11 unless a change record is approved:** new business rules, new screens, new roles.

---

## 2. Acceptance criteria (planned)

| ID | Criterion |
| :--- | :--- |
| AC-19.1 | Secret scan clean; no real password/token/key in repo, Git history or PDF. |
| AC-19.2 | p95 < 300 ms for the measured Sprint 1/2 endpoints under 50 warm requests; result recorded. |
| AC-19.3 | Data and history survive restart; clean-clone migrate+seed reproduces demo accounts. |
| AC-19.4 | Every negative/boundary case returns a 4xx with a documented code and no stack trace. |
| AC-19.5 | Every AC has an executed test or documented verification; no unexecuted check marked passed. |
| AC-19.6 | Deployed `/api/health` commit matches the final release tag; Docker build/run reproducible. |

## 3. Software Test Specification (planned)

| Test ID | AC | Level | Expected |
| :--- | :--- | :--- | :--- |
| TEST-20.1 | AC-19.1 | tool/code | secret scan zero findings |
| TEST-20.2 | AC-19.2 | performance | recorded p95 under target |
| TEST-20.3 | AC-19.3 | integration | restart + clean DB reproducible |
| TEST-20.4 | AC-19.4 | API | negative matrix 4xx with codes |
| TEST-20.5 | AC-19.5 | traceability | registry has no orphan AC/test |
| TEST-20.6 | AC-19.6 | deploy | health commit == release tag |

## 4. Definition of Done (future)
All six NFR rows measured with recorded evidence; failed/skipped tests disclosed; final release + tag + deployed URL recorded; remaining-work table closed or explicitly carried forward.

## 5. Version history
| Version | Date | Change | Reason |
| :--- | :--- | :--- | :--- |
| v1.0 | 28 Nov 2026 | Initial planned hardening/deployment contract. | Deliverable 2 Part C requires contracts for remaining features. |
