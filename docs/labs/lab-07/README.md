# Lab 7 - Plan and Evidence Index

> **Team:** Oum (`67070501075`, `@ssiriwan`) and T (`67070501021`, `@thhanabun`)
> **Repository:** `cpe334-approval-system` (public) - Theme 5 Workflow and Approval System
> **Lab 7 due:** 29 Nov 2026 23:59 ICT
> **Branch strategy:** `main` → **`lab7-staging`** (integration) → `feature/##-slug` (each Issue) → PR into `lab7-staging` → release PR `lab7-staging → main`

## Selected change (option 1, adapted to this codebase)

The supplied option 1 text referenced `Priority` / `requestedPriority` in `toktickit`. Those fields do **not** exist in this group repository; checking `prisma/schema.prisma` on `main` shows only `Role`, `RequestStatus` and `HistoryAction`. The genuine Sprint 1 behavior that matches the intent of "dynamic priority / SLA escalation" here is **BR-05 reviewer assignment**, implemented in `server/src/services/request.service.ts` (`CATEGORY_PRIMARY_REVIEWER`, `CATEGORY_FALLBACK_REVIEWER`, `resolveAssignedReviewerId`). We will change that rule, not add a new subsystem.

| | Old (accepted Sprint 1) | New (approved change) |
| :--- | :--- | :--- |
| Normal requests | EQUIPMENT/TRAVEL → `t.reviewer`; SOFTWARE/SUPPLIES → `manager.hybrid` | **Unchanged** |
| Large amount | no effect on assignment | `amount > 5000.00 THB` → escalate to `manager.hybrid` |
| SLA boundary | no time rule | submitted `< 08:00` or `>= 18:00` Asia/Bangkok → escalate to `manager.hybrid` |
| Self-approval | requester mapped as primary uses alternate | **Unchanged** - escalated reviewer who is the requester falls back to `t.reviewer`; BR-01 still checked before assignment |
| Client-supplied assignment field | `.strict()` schema rejects unknown fields | explicit `400 VALIDATION_ERROR` test for `assignedReviewerId` / `requestedPriority` |
| Schema / migration | - | **No change** - reuse `assignedReviewerId` and append-only history |

## Issues (label `lab7`)

| Issue | Workstream | Handout part |
| :---: | :--- | :--- |
| #57 | Approve change request and revise contract before code | A |
| #58 | RED/GREEN implementation, regression and reviewed release | B |
| #59 | Five metrics and release readiness / retrospective | C/D |
| #60 | Assemble and submit `lab7_sec1_ปลวกแดง.pdf` | All |

## Documents

| File | Content | Status |
| :--- | :--- | :--- |
| `change-request.md` | CR-04 old/new rule, reason, scope, boundaries, invalid cases, roles, versions, approval record | Draft - approval pending |
| `impact-analysis.md` | Requirement → feature → SRS/SDS/AC/STS → code module table, unchanged behavior, N/A reasons | Draft |
| `contract-revision.md` | Versioned SRS/BR-05, Feature SDS E1/E2, STS additions, teammate review before implementation | Draft - review pending |
| `test-plan.md` | RED/GREEN cases, regression suite, commands, evidence IDs | Draft |
| `metrics.md` | Five dated metrics with sources and <=100-word interpretation | Pending (#59) |
| `readiness-retro.md` | Checklist, debt, three retrospective answers, contributions, AI-use | Pending (#59) |
| `evidence/` | RED/GREEN output, diffs, CI/deploy, metric sources | Pending |

## Version chain

| Item | Version |
| :--- | :--- |
| Accepted Sprint 1 baseline (old behavior exists) | `v0.1.0-sprint1` / `f35ad24` |
| Actual pre-change implementation (our repo `main` at Lab 7 start) | `e695264` |
| `lab7-staging` initial head | `e695264` |
| Test-change commit / RED | pending (#58) |
| Corrected release / GREEN | pending (#58) |
| Deployed revision | pending (#58) |

## Honest status

Implementation now exists in PR #63 (RED `2b56a7b`, GREEN `fede788`). Honest disclosure: the updated Lab 7 instruction supplies no instructor/TA approval (`change-request.md` = **NOT AVAILABLE**), and no separate teammate contract review was recorded before the implementation commit. PR #63's peer review by @thhanabun checked the code against the revised contract, but that review occurred after the code; this sequence deviation must be stated in Part D limitations. No approver or date is invented.
