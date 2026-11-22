# Lab 6 - Independent Execution Results (Partner Product: Pangtao)

> **Testers:** Oum (`67070501075`) and T (`67070501021`), team Oum & T - UAT Team
> **Product Team / partner:** `yakginmomo/pangtao`
> **Date/time of this session:** 2026-11-22 06:07 UTC
> **Handout:** Lab 6 §3.2 (Part B, 25 points)
> **Cases source:** [`uat-cases-for-partner.md`](./uat-cases-for-partner.md)

## 1. Tested version

| Item | Value |
| :--- | :--- |
| Public URL | <https://pangtao-vowtduxdha-as.a.run.app> |
| Release baseline | tag `v0.1.0` → `bec5575c3ce434b4b1eac0899e734e513e672d9f` |
| Deployed commit on `main` (partner-confirmed) | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` |
| `main` HEAD at our source review | `64c98f4fcd293fb67f0d32b1db75943dfbf2c749` |
| Health | `GET /api/v1/health` → `{"status":"ok"}` (body has no commit) |
| UI root | `GET /` → HTTP 200 |

The deployed version is identified by the partner-confirmed `main` commit plus the public URL. A
deploy run digest / startup-log commit would be stronger evidence and remains a handoff request; it
does not change which version is recorded here.

## 2. Preflight checks (executed)

| Evidence ID | Action | Expected | Actual | Result | Time (UTC) / version |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `E-PRE-01` | `GET /api/v1/health` | `{"status":"ok"}` | `{"status":"ok"}` | PASS | 06:07 / `64c98f4` |
| `E-PRE-02` | `GET /` | SPA served | HTTP 200 | PASS | 06:07 / `64c98f4` |

## 3. Case results

| Case ID | Tester | Date/time (UTC) | Version | Inputs | ACTUAL result | Result | Evidence IDs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UAT-PT-01` | Oum | 2026-11-22 06:07 | `v0.1.0` / `64c98f4` | opening 10,000.00; payment 250.00 | Not executed - partner has not supplied the private demo password | **BLOCKED** | - |
| `UAT-PT-02` | T | 2026-11-22 06:07 | `v0.1.0` / `64c98f4` | total 1,000 / line 600; future date; invalid amounts | Not executed - same credential dependency | **BLOCKED** | - |
| `UAT-PT-03` steps 1-5 | Oum | 2026-11-22 06:07 | `v0.1.0` / `64c98f4` | Bob / Admin credentials | Not executed - same credential dependency | **BLOCKED** | - |
| `UAT-PT-03` step 6 (unauthenticated) | T | 2026-11-22 06:07 | `v0.1.0` / `64c98f4` | no session cookie | `/api/v1/accounts` → **401**; `/api/v1/transactions` → **401**; `/api/v1/auth/me` → **401**; `/api/v1/summary/income-expense` → **401**; `/api/v1/admin/users` → **401**. No private data returned. | **PASS** | `E-PT-03u` |
| `UAT-PT-04` | T | 2026-11-22 06:07 | `v0.1.0` / `64c98f4` | transaction from PT-01 | Not executed - needs credentials **and** the agreed end-of-session redeploy | **BLOCKED** | - |
| `UAT-PT-05` | Oum | 2026-11-22 06:07 | `v0.1.0` / `64c98f4` | synthetic admin user | Not executed - same credential dependency | **BLOCKED** | - |

## 4. Honest notes

- A `GET /api/v1/summary` probe returned **404** because the documented Sprint 1 route is
  `/api/v1/summary/income-expense` (confirmed from `server/src/routes/summary.routes.ts`). This was a
  **route-discovery probe by us**, not a product defect and not a UAT case result; the correct route
  returned 401 as expected.
- `BLOCKED` is not a pass. The credential-dependent cases must be executed or remain explicitly
  BLOCKED in the final PDF, and the TA must be notified if the partner does not supply them
  (handout §2: if the other team is unavailable, notify promptly and retain the evidence).
- No finding, defect report or acceptance decision is claimed from this session. The only confirmed
  behaviour is the health/UI availability and the unauthenticated 401 responses.
- The partner's own run of these cases is their handoff self-check; the rows above are **our**
  independent UAT record and the only ones that may support Part B marks.
