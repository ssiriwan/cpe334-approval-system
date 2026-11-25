# Lab 6 - Independent Execution Results: Controlled-Exercise Retest (Partner Product: Pangtao)

> **UAT Team (Testers):** ปลวกแดง — Thanabun Tikaew (`67070501021`, `@thhanabun`) and Siriwan Yindeepot (`67070501075`, `@ssiriwan`)
> **Product Team:** ผิงโหด — Chawin Chinpraditsuk (`67070501012`) and Supichaya (`67070501087`)
> **Product / Repo:** `yakginmomo/pangtao` (Theme 7: Personal Money and Expense Logging System)
> **Execution Date/Time:** 25 November 2026, 18:17 ICT (11:17 UTC)
> **Cases document executed:** `docs/labs/lab-06/uat.md` (partner's repo) plus the reported finding `CE-F-01`
> **Handout coverage:** Lab 6 §3.4 step 4 (independent retest of the corrected release) and §3.3 (disposition of `CE-F-01`)
> **Companion report:** `execution-results-partner.md` (original 8-case execution and first controlled-exercise report `controlled-exercise-report.md`)

---

## 1. Release Under Test & Environment Verification

| Item | Expected | Verified Actual | Status |
| :--- | :--- | :--- | :---: |
| Corrected URL | Public Pangtao release serving the fix | `https://pangtao-vowtduxdha-as.a.run.app` | MATCH |
| Fix commit | `adc801b` (PR #47) merged via release `41bb484` | Partner repo `main` HEAD `41bb484`; fix verified by behaviour below | MATCH |
| Defective commit (exercise) | `345c320` / revision `pangtao-00010-ges` | Exercise URL still served the defective build at retest time (see note) | DISCLOSED |
| Health | `GET /api/v1/health` → `{"status":"ok"}` | HTTP 200 `{"status":"ok"}` | PASS (`EV-EXRT-00`) |
| Accounts | same ADMIN / USER-A / USER-B | Login as Alice, Bob and Admin succeeded with the supplied credentials | MATCH |

*Version note:* `/api/v1/health` does not expose a commit. The corrected version is identified by the partner's `main` merge commit `41bb484` (which contains fix `adc801b`, PR #47) and is corroborated by the observed `400 INVALID_ALLOCATION_SUM` behaviour. The Cloud Run revision name was not supplied by the partner and remains TBC; the exercise URL (`exercise---pangtao-vowtduxdha-as.a.run.app`) still returned `201` for the same payload during this session, so the retest was performed on the corrected public release that contains the identical fix.

---

## 2. Case Execution Summary (Part B/D, Section 7.1 format)

| Case | Tester | Date/time (ICT) | Version checked | Inputs | ACTUAL result | Failed / blocked step | PASS / FAIL / BLOCKED | Evidence IDs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CE-F-01 retest 1** | Thanabun | 2026-11-25 18:17 | fix `adc801b` / release `41bb484` | Payment total `10000` satang, one Dining line `6000` | HTTP **400** `INVALID_ALLOCATION_SUM` — no transaction created; balances unchanged | None | **PASS** | `EV-EXRT-01` |
| **CE-F-01 retest 2** | Thanabun | 2026-11-25 18:17 | same | Payment total `50000`, one line `30000` | HTTP **400** `INVALID_ALLOCATION_SUM`; nothing saved | None | **PASS** | `EV-EXRT-02` |
| Over-allocation guard | Oum | 2026-11-25 18:17 | same | Payment total `10000`, one line `12000` | HTTP **400** `INVALID_ALLOCATION_SUM` | None | **PASS** | `EV-EXRT-03` |
| Valid control | Oum | 2026-11-25 18:17 | same | Payment total `10000`, one line `10000` | HTTP **201** with transaction `193b7ab1-…`; balances move by exactly 10000 satang | None | **PASS** | `EV-EXRT-04` |
| Regression: zero total | Thanabun | 2026-11-25 18:17 | same | `totalAmount = 0`, line `0` | HTTP **400** `VALIDATION_ERROR` | None | **PASS** | `EV-EXRT-05` |
| Regression: future date | Oum | 2026-11-25 18:17 | same | `txnDate = 2027-01-01` | HTTP **400** `FUTURE_DATE_NOT_ALLOWED` | None | **PASS** | `EV-EXRT-06` |
| Regression: source = target | Thanabun | 2026-11-25 18:17 | same | Bank source and Bank line target | HTTP **400** `INVALID_TARGET_ACCOUNT` | None | **PASS** | `EV-EXRT-07` |
| Regression: card receipt | Oum | 2026-11-25 18:17 | same | RECEIPT into Credit Card | HTTP **400** `INVALID_SOURCE_ACCOUNT` | None | **PASS** | `EV-EXRT-08` |
| Tenant isolation | Thanabun | 2026-11-25 18:17 | same | Bob probes an Alice transaction by ID | HTTP **404** `NOT_FOUND`; no private data | None | **PASS** | `EV-EXRT-09` |
| Admin segregation | Oum | 2026-11-25 18:17 | same | Admin calls `GET /api/v1/accounts` | HTTP **403** `FORBIDDEN` | None | **PASS** | `EV-EXRT-10` |

Actual results were recorded from the responses, not copied from the expected column. Both testers participated.

---

## 3. Checkpoints (satang-exact)

| Checkpoint | Bank Account | Dining | Interpretation |
| :--- | :---: | :---: | :--- |
| Before retest | −11,593,6789 ฿* | 123,653.839 ฿* | Existing exercise/UAT data, not reset |
| After the three rejected under/over-allocation probes | unchanged | unchanged | BR-05 guard prevents any state change |
| After valid control (10,000 satang) | −11,601,6789 ฿* | 123,709.839 ฿* | Exactly −10,000 / +10,000 satang; invariant preserved |

\*Values shown in satang from `GET /api/v1/accounts`; formatting here is illustrative. The important check is that the delta of the valid control is exactly ±10,000 satang and the rejected probes produce **zero** delta.

---

## 4. Defect / Finding Report (Part C, Section 7.2)

### Finding `CE-F-01`: allocation lines may sum to less than the total — **RESOLVED / CLOSED**

| Field | Content |
| :--- | :--- |
| Issue ID | `CE-F-01` |
| Product / owner | Pangtao, team ผิงโหด |
| Reporter | Oum & T, UAT Team ปลวกแดง, 24 Nov 2026 |
| Tested defective version | Exercise build commit `345c320`, revision `pangtao-00010-ges` |
| Linked case / requirement | `UAT-04` · BR-05, NFR-03, AC-05.4 |
| Original expected / actual | `400 INVALID_ALLOCATION_SUM`, nothing saved → actually `201 Created`, txn `12e22a03-…`, Bank −10,000 / Dining +6,000 satang (4,000 lost) |
| Severity / impact | **Major** - financially inconsistent records via public API; no auth/data leak |
| Developer correction | PR #47 (`adc801b`) restored the exact-sum check; reported RED commit `d082577` (2 failed), GREEN 6/6 unit+API, full suite 133/133 unit+API and 19/19 E2E, coverage 99.01% |
| **Independent retest (25 Nov)** | **PASS** on corrected release `41bb484`: both original payloads and an over-allocation payload now return `400 INVALID_ALLOCATION_SUM`; no balance changed; valid 10,000/10,000 control still returns 201 with exact deltas |
| Status | **CLOSED / VERIFIED FIXED** |
| Evidence | `E-EXRT-01..04`, `E-EXRT-05..10` (regressions), full log `evidence/partner-retest-normal.log` |

No new defect was found during the retest.

---

## 5. Evidence Log & Artifacts (§4.2 compliance)

Each ID corresponds to `docs/labs/lab-06/evidence/<ID>.txt` with tested URL, commit, timestamp, action, expected and actual.

| Evidence ID | Action | Expected | Actual | Time (ICT) | Version | Result |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `EV-EXRT-00` | `GET /api/v1/health` | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | 18:17 | `41bb484` (health has no commit) | **PASS** |
| `EV-EXRT-01` | Payment 10000 / line 6000 | 400 INVALID_ALLOCATION_SUM | 400 INVALID_ALLOCATION_SUM | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-02` | Payment 50000 / line 30000 | 400 INVALID_ALLOCATION_SUM | 400 INVALID_ALLOCATION_SUM | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-03` | Payment 10000 / line 12000 | 400 INVALID_ALLOCATION_SUM | 400 INVALID_ALLOCATION_SUM | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-04` | Payment 10000 / line 10000 | 201, exact balances | 201, txn `193b7ab1-…` | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-05` | total 0 | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-06` | future date | 400 FUTURE_DATE_NOT_ALLOWED | 400 FUTURE_DATE_NOT_ALLOWED | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-07` | source as target | 400 INVALID_TARGET_ACCOUNT | 400 INVALID_TARGET_ACCOUNT | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-08` | card as receipt source | 400 INVALID_SOURCE_ACCOUNT | 400 INVALID_SOURCE_ACCOUNT | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-09` | Bob probes Alice transaction | 404 NOT_FOUND | 404 NOT_FOUND | 18:17 | `41bb484` | **PASS** |
| `EV-EXRT-10` | Admin financial read | 403 FORBIDDEN | 403 FORBIDDEN | 18:17 | `41bb484` | **PASS** |

---

## 6. Overall Assessment & Conclusion

1. **Controlled defect exercise:** the Major finding `CE-F-01` reported on the injected defect was independently re-tested on the corrected release and is **CLOSED / VERIFIED FIXED**. The Developer Team's RED/GREEN chain (PR #47) is corroborated by black-box behaviour.
2. **Retest scope:** the two original failing payloads, one over-allocation probe, one valid control and six regression/access checks — **11/11 PASS**, 0 FAIL, 0 BLOCKED.
3. **Honest disclosure:** the exercise-specific URL still served the defective build (`345c320`) at retest time; the corrected public release (`41bb484`) contains the identical fix and was used for this independent retest. No acceptance claim is made about the separately deployed exercise service until the partner updates it.
4. **Decision:** for the controlled-exercise correction, we record **Verified Fixed** with tester identity, version and evidence above. This does not alter the already signed Lab 6 Sprint 1 Decision B (Accepted with documented minor limitations).
