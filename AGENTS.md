# CPE 334 Project Deliverable 1 — Ultra-Detailed Master Plan & Engineering Guide

> **Authoritative Handoff Document & Engineering Standard**  
> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Milestone:** Project Deliverable 1 (Baseline Planning & Working Sprint 1)  
> **Theme:** Theme 5 — Workflow and Approval System (Corporate Expense & Purchase Request System)  
> **Submission Deadline:** 8 November 2026 at 23:59 (LEB2 Submission | 80 Points | 8% of Course Grade)  
> **Target Audience:** Development Team (**Oum & T**) and AI Coding Agents (Antigravity, Cursor, Gemini, Claude)  
> **Team Roster:**
> - **Oum:** Student ID `67070501075` (Owner of Requester Slice, Author of Parts A & B)
> - **T:** Student ID `67070501021` (Owner of Reviewer Slice, Author of Parts C & D)

---

## 0. Gap Closure Summary (เปรียบเทียบกับ PDF ทั้ง 2 ฉบับ)

> ตารางนี้สรุปสิ่งที่แผนเดิมยังขาดเมื่อเทียบกับ `group_work_specs_v1.pdf` และ `project_deliverable_1_v1.pdf` และระบุว่าถูกเติมไว้ที่หัวข้อใดในเอกสารนี้แล้ว

| # | สิ่งที่ PDF กำหนดแต่แผนเดิมยังขาด | สถานะ | เติมไว้ที่ |
| :---: | :--- | :---: | :--- |
| 1 | SRS ต้องมี NFR ที่วัดผลได้ + วิธีตรวจ + allocation, assumptions, decisions, scope/exclusions ครบ | เติมแล้ว | §7 |
| 2 | Feature Inventory + Traceability ต้องมี Feature ID, dependency, planned sprint, coverage gaps | เติมแล้ว | §8 |
| 3 | System SDS ต้องมี UI structure/conventions, API approach, role matrix, token lifecycle, config/deployment plan | เติมแล้ว | §9 |
| 4 | Three-sprint plan ต้องมี goal, feature IDs, dependencies, completion outcome และ Sprint 1 scope | เติมแล้ว | §10 |
| 5 | Sprint 1 contracts ต้องมี Feature SDS, UI/API/data spec, AC, STS, DoD, version history | เติมแล้ว | §11 |
| 6 | ต้องมี reviewer assignment และทดสอบ unrelated reviewer access | เติมแล้ว | §1.3 BR-05, §3 schema, §11.3 |
| 7 | Role matrix เดิมขัดกับ BR-01 เพราะอนุญาตให้เฉพาะ REQUESTER สร้างคำขอ ทำให้ REVIEWER ทดสอบ self-approval ไม่ได้ | แก้แล้ว | §2, §6, §9.3 |
| 8 | ขาด tests: logout, requester forbidden review, cross-user access, persistence, UI/e2e | เติมแล้ว | §11.4, §11.5, §12.2 |
| 9 | ขาด GitHub Issues + Project board + Issue→branch→PR→staging→main evidence | เติมแล้ว | §4, §6, §12.3 |
| 10 | ขาด README requirements: dependencies, env examples, migration/seed, build/test commands | เติมแล้ว | §9.7, §12.4 |
| 11 | ขาด known limitations, failed/skipped tests disclosure, contribution table, AI-use declaration | เติมแล้ว | §12.3, §12.6 |
| 12 | PDF ต้อง self-contained Parts A–F + TOC/navigation table with page refs | เติมแล้ว | §12.5 |
| 13 | BR-04 ต้องมี category whitelist และ boundary tests | เติมแล้ว | §1.3, §7.5, §11.2 |
| 14 | Schema ขาด assignment relation, indexes, constraints, transaction rules | เติมแล้ว | §3 |
| 15 | ขาด Docker/GCP deployment design (to be implemented in Lab 5) | เติมแล้ว | §9.7 |
| 16 | ขาดแผนปิดงานช่วงสอบ 1–11 ธ.ค. และ remaining-work list | เติมแล้ว | §10.4 |

**สรุปสั้น:** แผนเดิมมีโครงหลัก (theme, stack, schema, PR workflow, timeline) ครบแต่ยังเป็น "แผนก่อสร้าง" มากกว่าหลักฐานครบตาม rubric A–F; สิ่งที่เติมคือรายละเอียดที่ TA ใช้ตรวจโดยตรง ได้แก่ requirements ที่วัดผลได้, feature/traceability, SDS conventions, contract/STS/DoD, access-control tests, Git/Issue evidence และ PDF evidence index.

---

## 1. Project Context & Problem Domain

### 1.1 Stakeholder Problem & Context
องค์กรประสบปัญหาความล่าช้าและความผิดพลาดในการขออนุมัติค่าใช้จ่ายและสั่งซื้ออุปกรณ์ (Expense & Purchase Request) เนื่องจากเดิมใช้กระดาษและแชตข้อความ ทำให้:
1. ติดตามสถานะของคำขอไม่ได้ (No Request Visibility)
2. ตรวจสอบย้อนหลังไม่ได้ว่าใครเป็นผู้อนุมัติ และอนุมัติเมื่อใด (No Audit Trail)
3. **ไม่มีการป้องกันผลประโยชน์ทับซ้อน (Conflict of Interest):** ผู้บริหารหรือพนักงานที่ยื่นคำขอสามารถกดอนุมัติคำขอของตนเองได้ (Self-Approval)

### 1.2 User Roles (Sprint 1 Scope)
* **`REQUESTER` (พนักงานผู้ยื่นคำขอ):** ล็อกอินเข้าสู่ระบบ, สร้างคำขอเบิกงบ/จัดซื้อ, ตรวจสอบรายการคำขอของตนเอง, ดูสถานะและเหตุผลที่ได้รับการอนุมัติหรือปฏิเสธ. **ต้องไม่สามารถใช้ operation ของ reviewer ได้**
* **`REVIEWER` (ผู้จัดการ/ผู้อนุมัติ):** ล็อกอินเข้าสู่ระบบ, ตรวจสอบรายการคำขอที่รอการพิจารณา (`PENDING`) **เฉพาะที่ถูก assign ให้ตน**, ทำการกด `APPROVE` หรือ `REJECT` พร้อมระบุเหตุผลประกอบ. **REVIEWER สามารถสร้างคำขอของตนเองได้** เพื่อให้กฎ BR-01 (No Self-Approval) มีสถานการณ์ทดสอบจริง
* **`ADMIN` (บทบาทอนาคต):** ปรากฏใน enum เพื่อรองรับ Sprint 3 (จัดการผู้ใช้/assignment) แต่ **ไม่ถูก seed และไม่มี endpoint/สิทธิ์ใดใน Sprint 1**; ห้ามใช้ ADMIN เป็นข้ออ้างในการข้าม BR-01
* **ข้อตัดสินใจเรื่อง Theme:** Oum (ID ลงท้าย 5) ตรง Theme 5; T (ID ลงท้าย 1) ตรง Theme 1; ทีมตกลงเลือก **Theme 5 — Workflow and Approval System** และบันทึกเป็น decision D-01 ใน SRS

### 1.3 Baseline Business Rules (กฎเหล็กบังคับตรวจ)
* **`BR-01 (No Self-Approval):`** ผู้ยื่นคำขอ **ห้ามอนุมัติ/ปฏิเสธคำขอที่ตนเองเป็นผู้สร้างขึ้นเด็ดขาด** แม้ผู้ใช้นั้นจะมี Role เป็น `REVIEWER` หรือ `ADMIN` ก็ตาม ต้องบล็อกที่ Backend API และส่งคืน HTTP `403 FORBIDDEN` (`SELF_APPROVAL_NOT_ALLOWED`) **ก่อนการตรวจ assignment**
* **`BR-02 (Valid State Lifecycle):`** คำขอเริ่มต้นที่สถานะ `PENDING` เท่านั้น และสามารถเปลี่ยนสถานะได้เพียงทางเดียวไปยัง `APPROVED` หรือ `REJECTED` คำขอที่ผ่านการตัดสินแล้วจะถูกปิดและไม่สามารถเปลี่ยนสถานะซ้ำได้ หากพยายามส่งคำสั่งซ้ำต้องส่งคืน HTTP `400 BAD_REQUEST` (`INVALID_STATE_TRANSITION`)
* **`BR-03 (Data Isolation & Access Control):`** Requester สามารถดูและเข้าถึงได้เฉพาะคำขอที่เป็นของตนเองเท่านั้น การพยายามเข้าถึงคำขอของผู้อื่นผ่าน API ต้องส่งคืน HTTP `403 FORBIDDEN` (`ACCESS_DENIED`) ส่วน Reviewer เห็นได้เฉพาะคำขอที่ถูก assign ให้ตน (หรือคำขอของตนเองในฐานะ requester)
* **`BR-04 (Payload Validation):`** หัวข้อคำขอ (`title`) ต้องมีความยาว 3–150 ตัวอักษร (นับหลัง trim), ยอดเงิน (`amount`) ต้องเป็นจำนวนบวกที่มากกว่า 0 และไม่เกิน `9,999,999,999.99` (Decimal(12,2)), `category` ต้องอยู่ใน whitelist `EQUIPMENT | TRAVEL | SOFTWARE | SUPPLIES`, และ `description` ต้องไม่ว่างและยาวไม่เกิน 1,000 ตัวอักษร
* **`BR-05 (Reviewer Assignment):`** คำขอแต่ละใบต้องมี `assignedReviewerId`; เฉพาะ REVIEWER ที่ถูก assign เท่านั้นที่ตัดสินได้ หาก reviewer ไม่ใช่ผู้รับผิดชอบต้องได้ HTTP `403 FORBIDDEN` (`ACCESS_DENIED`). Sprint 1 ใช้กฎ assign ตาม category: `EQUIPMENT/TRAVEL → t.reviewer`, `SOFTWARE/SUPPLIES → manager.hybrid`; ถ้า requester คือ reviewer ที่ map ไว้ให้สลับไปอีกคน
* **`BR-06 (Append-only History):`** ทุกการ submit/approve/reject ต้องเพิ่ม `ApprovalHistory` ใหม่เท่านั้น ห้าม update/delete history ใน Sprint 1; การเปลี่ยนสถานะและ insert history ต้องอยู่ใน transaction เดียวกัน
* **`BR-07 (Decision Validation):`** `decision` ต้องเป็น `APPROVE` หรือ `REJECT` เท่านั้น; `REJECT` ต้องมี comment ยาว 3–500 ตัวอักษร; `APPROVE` มี comment ได้ไม่เกิน 500 ตัวอักษร หากผิดเงื่อนไขต้องได้ `400 VALIDATION_ERROR`

---

## 2. Technical Stack & Conventions

* **Monorepo Layout:**
  * `client/`: React 19 + Vite + TypeScript + TailwindCSS
  * `server/`: Node.js + Express + TypeScript + Prisma ORM
  * `docs/`: Markdown Specifications (Parts A, B, C, D, E)
  * `tests/`: Vitest + Supertest (API/DB integration), React Testing Library (component), Playwright (selected E2E)
* **Database:** PostgreSQL 17 (Host port `5434`, container `approval-db` หรือ local instance)
* **Authentication:** HTTP-only Cookie (`token`), JWT (HS256, อายุ 8 ชั่วโมง), bcryptjs (Salt cost: 12)
  * Cookie flags: `httpOnly: true`, `sameSite: "lax"`, `secure: true` เมื่อ `NODE_ENV=production`, `path: "/"`, `maxAge: 8h`
  * Logout = clear cookie ฝั่ง client; Sprint 1 ใช้ stateless JWT (ยังไม่มี server-side revocation) — บันทึกเป็น known limitation
* **Standard API Response Shape:**
  * **Success:** `{ "data": <payload> }`
  * **Failure:** `{ "error": { "code": "<STRING_CODE>", "message": "<DESCRIPTION>", "details": <OPTIONAL> } }`
* **Standard Error Codes:**
  * `UNAUTHORIZED` (401)
  * `FORBIDDEN` (403)
  * `SELF_APPROVAL_NOT_ALLOWED` (403)
  * `ACCESS_DENIED` (403)
  * `INVALID_STATE_TRANSITION` (400)
  * `VALIDATION_ERROR` (400)
  * `NOT_FOUND` (404)

---

## 3. Database Schema (Prisma) & Seed Specification

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  REQUESTER
  REVIEWER
  ADMIN
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

enum HistoryAction {
  SUBMITTED
  APPROVED
  REJECTED
}

model User {
  id              String            @id @default(uuid())
  email           String            @unique
  passwordHash    String
  name            String
  role            Role              @default(REQUESTER)
  createdAt       DateTime          @default(now())
  requests        ApprovalRequest[] @relation("UserRequests")
  assignedReviews ApprovalRequest[] @relation("AssignedReviews")
  historyActions  ApprovalHistory[] @relation("UserActions")
}

model ApprovalRequest {
  id                 String            @id @default(uuid())
  requestNo          String            @unique // e.g., REQ-20261104-0001
  title              String
  amount             Decimal           @db.Decimal(12, 2)
  category           String            // EQUIPMENT, TRAVEL, SOFTWARE, SUPPLIES
  description        String
  status             RequestStatus     @default(PENDING)
  requesterId        String
  requester          User              @relation("UserRequests", fields: [requesterId], references: [id])
  assignedReviewerId String?
  assignedReviewer   User?             @relation("AssignedReviews", fields: [assignedReviewerId], references: [id])
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  histories          ApprovalHistory[]

  @@index([requesterId, createdAt])
  @@index([assignedReviewerId, status])
  @@index([status, createdAt])
}

model ApprovalHistory {
  id        String          @id @default(uuid())
  requestId String
  request   ApprovalRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  actorId   String
  actor     User            @relation("UserActions", fields: [actorId], references: [id])
  action    HistoryAction
  comment   String?
  createdAt DateTime        @default(now())

  @@index([requestId, createdAt])
}
```

> **Schema notes:** `assignedReviewerId` เป็น nullable ในระดับ database เพื่อความปลอดภัยของ migration แต่ **service ต้องบังคับให้มีค่าเมื่อสร้างคำขอ** (BR-05). `requestNo` สร้างฝั่ง server รูปแบบ `REQ-YYYYMMDD-NNNN` โดยใช้ unique constraint + retry เมื่อชนกัน. `amount` ถูก validate ใน service ก่อนบันทึก และใช้ `Decimal(12,2)` เพื่อกัน floating-point error. การ approve/reject + insert history ต้องอยู่ใน `prisma.$transaction`.

### Seed Accounts (รหัสผ่านทุกบัญชีคือ `Password123!` — ใช้เฉพาะ local/demo)
1. `oum.requester@cpe334.local` — Role: `REQUESTER` (ใช้เทสสร้างคำขอ)
2. `t.reviewer@cpe334.local` — Role: `REVIEWER` (ใช้เทสอนุมัติคำขอของผู้อื่น; เป็น reviewer หลักของ `EQUIPMENT/TRAVEL`)
3. `manager.hybrid@cpe334.local` — Role: `REVIEWER` (ใช้เทส **BR-01 Self-Approval Violation** และ **BR-05 Unrelated Reviewer**; เป็น reviewer หลักของ `SOFTWARE/SUPPLIES`)
4. Seed script ต้องเป็น idempotent (`upsert` ตาม email) และห้าม seed ข้อมูลการเงินจริง
5. ไม่ seed `ADMIN` ใน Sprint 1; หากต้องการทดสอบ role ในอนาคตให้เพิ่มใน Sprint 3 พร้อม endpoint/AC ของจริง

---

## 4. Git Workflow & Peer Review Protocol (กฎเหล็กห้ามละเมิด)

```
main ─────────────────────────────────────────────────────────────► [Release v0.1.0-sprint1]
 ▲                                                                     ▲
 │                                                                     │ (Release PR)
sprint-1-staging ─────────────────────────●────────────────────────────●
                           ▲              │              ▲
            (PR #1 เข้า)   │              ▼  (git pull)  │ (PR #2 เข้า)
                           │                             │
feature/1-request-submission              feature/2-review-decision
   [Author: Oum | Reviewer: T]               [Author: T | Reviewer: Oum]
```

0. **ต้องมี GitHub Issue ก่อนเริ่มงานทุกครั้ง** โดยผูก Issue กับ FR/BR/Feature ID และ Contract (เช่น `F-04`, `BR-01`, `AC-07`, `TEST-08`) แล้ววางบน Project board (Backlog → Ready → In Progress → In Review → Done)
1. **ห้าม Commit ตรงเข้า `main` หรือ `sprint-1-staging` เด็ดขาด**
2. **แตก branch จาก `sprint-1-staging` ล่าสุดเสมอ: `feature/<issue-no>-<slug>`**
3. **Peer Review Rule (TA ตรวจหลักฐานอย่างเคร่งครัด):**
   - **ห้ามผู้เขียน (Author) กด Approve หรือ Merge PR ของตัวเอง**
   - เพื่อนร่วมทีม (Reviewer) ต้องเข้ามาตรวจสอบ Code Diff, เขียนข้อคิดเห็นหรือผลการรันเทส (Substantive Review Comment) เช่น:
     > *"Checked request validation schema and status transition guards. Ran the full test suite locally (all passing). Verified error code `SELF_APPROVAL_NOT_ALLOWED`. Approved."*
   - Reviewer เป็นผู้กดปุ่ม **Approve** และ **Merge pull request** เข้าสู่ `sprint-1-staging`
   - PR description ต้องระบุ Issue link, Feature/Contract ID, AC/TEST ที่เกี่ยวข้อง และหลักฐานการรันเทส; หลัง merge ให้ย้าย Issue เป็น Done และอัปเดต board status

---

## 5. แผนการแบ่งงานอย่างละเอียด (RACI Matrix & Task Division)

| ส่วนงาน / Artifact | รายละเอียดเนื้อหา | ผู้รับผิดชอบหลัก (Author) | ผู้ตรวจรับ (Reviewer) | Output Artifact |
| :--- | :--- | :---: | :---: | :--- |
| **Part A: SRS** | Stakeholder Problem, Scope, Actors, FR-01..11, BR-01..07, NFR-01..06, Assumptions/Decisions | **Oum** | **T** | `docs/srs.md` |
| **Part B: Feature Inventory & Traceability** | Feature Inventory F-01..F-11 + Traceability Matrix (Requirements $\rightarrow$ Features $\rightarrow$ Sprints & Tests) + coverage gaps | **Oum** | **T** | `docs/features.md`, `docs/traceability.md` |
| **Part C: System SDS** | System Architecture, Tech Stack, Prisma Schema, Role/Permission Matrix, Deploy Plan | **T** | **Oum** | `docs/system-sds.md` |
| **Part D: 3-Sprint Plan** | Goals, Scope, Dependencies ของ Sprint 1, 2, 3 | **T** | **Oum** | `docs/sprints/plan.md` |
| **GitHub Issues & Board** | Issue ต่อ FR/BR/Feature/Contract + board status (Backlog/Ready/In Progress/In Review/Done) | **Oum** | **T** | GitHub Issues + Project |
| **Feature Inventory** | F-01..F-11, dependencies, planned sprint, coverage gaps | **Oum** | **T** | `docs/features.md` |
| **Test Suite & STS** | TEST-01..13, TEST-AUTH-01..05, E2E-01..03, AC→test mapping | **T** | **Oum** | `tests/`, `docs/sprints/sprint-1/sts.md` |
| **README & Setup** | Dependencies, `.env.example`, migration/seed, build/test commands, demo accounts | **T** | **Oum** | `README.md`, `.env.example` |
| **PR #0: Foundation** | Contract E0, Prisma Migration, Seed Data (3 accounts), Express Auth APIs (Login/Logout/JWT Cookie) | **T** | **Oum** | `feature/0-auth-scaffold` |
| **PR #1: Feature 1** | **Requester Slice:** Contract E1, TDD Tests, API `POST /requests`, UI สร้างคำขอและตาราง My Requests | **Oum** | **T** | `feature/1-request-submission` |
| **PR #2: Feature 2** | **Reviewer Slice:** Contract E2, TDD Tests (Red-to-Green), API `POST /requests/:id/review`, UI Approve/Reject + Guard BR-01, BR-02 | **T** | **Oum** | `feature/2-review-decision` |
| **Part F: UI Evidence** | แคปภาพหน้าจอ UI 3 Scenarios พร้อมเขียน Captions กำกับชัดเจน | **Oum** | **T** | Section 4.2 ใน PDF |
| **Part F: Test Evidence** | รัน `npm test`, สรุปตารางผลเทส, คัดเลือก Test Snippets 2 ตัว, บันทึก PR Review Screenshots | **T** | **Oum** | Section 4.2 ใน PDF |
| **Release & PDF** | สร้าง Release PR สู่ `main`, Tag `v0.1.0-sprint1`, ตรวจสอบ Navigation Table และประกอบเล่ม PDF | **ทั้งคู่ร่วมกัน** | **ทั้งคู่ร่วมกัน** | `Deliverable1_Group.pdf` |

---

## 6. ลำดับขั้นตอนการปฏิบัติการแบบเจาะลึก (Step-by-Step Chronology)

### 📌 PHASE 0: Initial Repository & Scaffold (วันพุธที่ 4 พ.ย.)
* **Owner:** Oum | **Reviewer:** T
1. **Oum สร้าง GitHub Repository ใหม่:**
   * Repository Name: `cpe334-workflow-approval` (หรือชื่อที่ตกลงกัน)
   * เพิ่ม T เป็น Collaborator บน GitHub (Settings $\rightarrow$ Collaborators)
2. **สร้าง Base Branches บน Local และ Push ขึ้น GitHub:**
   ```bash
   git init
   git checkout -b main
   git commit --allow-empty -m "chore: initial commit"
   git push origin main

   git checkout -b sprint-1-staging
   git push origin sprint-1-staging
   ```
3. **วางโครงสร้างโปรเจกต์ (Scaffold Monorepo):**
   * ยกโครงสร้างจากแล็บ TokTickIT: มีโฟลเดอร์ `client/`, `server/`, `docs/`, `tests/`
   * Commit โครงร่างเข้า `sprint-1-staging`
4. **สร้าง GitHub Issues + Project board ก่อนเริ่มเขียนโค้ด:**
   * Issue #1: `feat: auth foundation` — F-01, FR-01, NFR-01, Contract E0
   * Issue #2: `feat: requester request creation and my requests` — F-02/F-03, FR-02/FR-03, BR-03/BR-04, Contract E1
   * Issue #3: `feat: reviewer decision workflow` — F-04/F-05, FR-04/FR-05/FR-06, BR-01/BR-02/BR-05/BR-06/BR-07, Contract E2
   * Board columns: `Backlog → Ready → In Progress → In Review → Done`; ทุก PR ต้องมี `Closes #<issue>` หรือ link Issue

---

### 📌 PHASE 1: Baseline Planning & Specifications (วันพุธที่ 4 พ.ย. – วันพฤหัสบดีที่ 5 พ.ย.)
*โหมดการทำงาน: แบ่งกันทำคู่ขนาน (Parallel)*

#### [Oum Task] เขียน Part A (SRS) & Part B (Traceability)
1. สร้างไฟล์ `docs/srs.md`:
   * ระบุ Actors: `REQUESTER`, `REVIEWER`, `ADMIN`
   * บันทึก Scope และ Explicit Exclusions: ไม่ทำระบบจ่ายเงินจริง, ไม่ทำแจ้งเตือน SMS/Email ภายนอก, ไม่มีการอนุมัติตัวเอง
   * รหัส Requirements (baseline ทั้งผลิตภัณฑ์; Sprint 1 เน้น FR-01..FR-06):
     * `FR-01`: Authentication & Session (Login/Logout/Current User)
     * `FR-02`: Request Creation (ยื่นคำขอเบิกงบ พร้อม validate ฟิลด์)
     * `FR-03`: Request Tracking (ดูรายการคำขอของตนเองและประวัติสถานะ)
     * `FR-04`: Review Decision (Reviewer กด Approve/Reject พร้อมบันทึกเหตุผล)
     * `FR-05`: Approval History & Audit (append-only history + audit view)
     * `FR-06`: Reviewer Assignment (assign reviewer และจำกัดสิทธิ์ตาม assignment)
     * `FR-07`: Return for Revision & Resubmission (Sprint 2)
     * `FR-08`: Multi-stage Approval (Sprint 2)
     * `FR-09`: Attachments (Sprint 2)
     * `FR-10`: Search, Filter & Reporting (Sprint 3)
     * `FR-11`: Admin User & Assignment Management (Sprint 3)
     * `BR-01`..`BR-07` ตาม §1.3
     * `NFR-01` Security, `NFR-02` Performance, `NFR-03` Persistence/Durability, `NFR-04` Validation/Error Handling, `NFR-05` Testability/Traceability, `NFR-06` Deployability
   * เพิ่มตาราง NFR ที่มี target + วิธีวัด + sprint ที่ตรวจ (ดู §7.6)
   * เพิ่ม Assumptions/Decisions/Open Questions (D-01..D-14) ตาม §7.7
2. สร้างไฟล์ `docs/features.md` และ `docs/traceability.md`:
   * Feature Inventory F-01..F-11 พร้อม dependency และ planned sprint
   * Traceability Matrix: Requirement ID $\rightarrow$ Feature ID $\rightarrow$ Planned Sprint $\rightarrow$ AC/Test/Measurement
   * ระบุ coverage gaps และ approved changes อย่างชัดเจน (ห้ามซ่อน requirement ที่ยังไม่ครอบคลุม)

#### [T Task] เขียน Part C (System SDS) & Part D (3-Sprint Plan)
1. สร้างไฟล์ `docs/system-sds.md`:
   * วาด Architecture Diagram: Client (React) $\leftrightarrow$ Express API $\leftrightarrow$ Prisma $\leftrightarrow$ PostgreSQL
   * กำหนด Prisma Schema Specification (ตรงกับข้อ 3)
   * กำหนดตาราง **Role / Permission Matrix**:
     | Endpoint | Method | Allowed Roles | Access Rule | Unauth / Forbidden |
     | :--- | :---: | :--- | :--- | :--- |
     | `/api/auth/login` | POST | Public | ตรวจ email/password, ออก JWT cookie | 400 Validation / 401 Unauthorized |
     | `/api/auth/logout` | POST | All Authenticated | ล้าง cookie | 401 Unauthorized |
     | `/api/auth/me` | GET | All Authenticated | คืน current user จาก JWT | 401 Unauthorized |
     | `/api/requests` | POST | All Authenticated (`REQUESTER`, `REVIEWER`) | สร้างคำขอ; REVIEWER สร้างได้เพื่อทดสอบ BR-01; ระบบ assign reviewer ตาม BR-05 | 401 / 400 VALIDATION_ERROR |
     | `/api/requests/my` | GET | All Authenticated | เห็นเฉพาะ `requesterId = currentUser.id` | 401 / 403 ACCESS_DENIED |
     | `/api/requests/:id` | GET | Owner หรือ assigned reviewer | owner เห็นของตน; reviewer เห็นเฉพาะที่ assign | 401 / 403 ACCESS_DENIED |
     | `/api/requests/pending` | GET | `REVIEWER` | เห็นเฉพาะ `assignedReviewerId = currentUser.id` และ `status = PENDING` | 401 / 403 FORBIDDEN |
     | `/api/requests/:id/review` | POST | `REVIEWER` | ต้องไม่ใช่ owner (BR-01) และต้องเป็น assigned reviewer (BR-05); ต้อง `PENDING` (BR-02) | 401 / 403 SELF_APPROVAL_NOT_ALLOWED / 403 ACCESS_DENIED / 403 FORBIDDEN / 400 INVALID_STATE_TRANSITION |

     > **ลำดับการตรวจใน review endpoint (ต้องเป๊ะ):** (1) authentication 401 → (2) role `REVIEWER` 403 `FORBIDDEN` → (3) self-approval 403 `SELF_APPROVAL_NOT_ALLOWED` → (4) assignment 403 `ACCESS_DENIED` → (5) state 400 `INVALID_STATE_TRANSITION` → (6) decision payload 400 `VALIDATION_ERROR`. การตรวจ self-approval ก่อน assignment ทำให้ BR-01 ถูกทดสอบได้จริงแม้คำขอจะถูก assign ให้คนอื่น
2. สร้างไฟล์ `docs/sprints/plan.md`:
   * **Sprint 1 (Deliverable 1 - 8 พ.ย.):** F-01 Auth & Session, F-02 Request Creation, F-03 My Requests & Data Isolation, F-04 Review Queue & Decision, F-05 History write. Dependencies: F-01 → F-02/F-03 → F-04. Completion: AC-01..12 + AC-AUTH-01..05 ผ่าน, E2E-01/02 ผ่าน, release tag `v0.1.0-sprint1`
   * **Sprint 2 (Deliverable 2 - 29 พ.ย.):** F-05 audit view, F-06 Return for Revision & Resubmission, F-07 Multi-stage Approval, F-08 Attachments. Dependencies: F-04 → F-06 → F-07; F-02 → F-08. Completion: Sprint 2 contracts/AC/STS ครบ + deployed candidate
   * **Sprint 3 (Final - 13 ธ.ค.):** F-09 Search/Filter/Reporting, F-10 Admin User & Assignment Management, F-11 Hardening/Regression/Deployment. Dependencies: F-05 → F-09; F-01/F-04 → F-10. Completion: final release + UAT/re-test + regression + demo video
   * ทุก sprint ต้องระบุ goal, feature IDs, dependencies, completion outcome และ remaining work ตาม template §10

> **🤝 [HANDOFF POINT 1]:** Oum และ T ประชุมตรวจทานเอกสารร่วมกัน ยืนยันว่าชื่อ Fields ใน Database, รหัส Error Code, และ API Path สอดคล้องกัน 100% แล้ว Commit รวมเข้า `docs/` บน `sprint-1-staging`

---

### 📌 PHASE 2: Foundation Scaffold & Auth (วันพฤหัสบดีที่ 5 พ.ย.)
* **Owner:** T | **Reviewer:** Oum

0. **T เขียน Contract E0 ก่อน implement:** `docs/sprints/sprint-1/feature-00-auth.md` ระบุ FR-01/NFR-01/NFR-04, workflow login/logout/me, API spec, AC-AUTH-01..05, TEST-AUTH-01..05, DoD และ version history (ห้ามเขียนโค้ดก่อน contract commit)
1. **T สร้าง Branch:**
   ```bash
   git checkout sprint-1-staging
   git pull origin sprint-1-staging
   git checkout -b feature/0-auth-scaffold
   ```
2. **T พัฒนาส่วนฐานระบบ:**
   * เขียน `prisma/schema.prisma` และรัน `npx prisma migrate dev --name init_schema`
   * เขียน `prisma/seed.ts` สร้างบัญชีทดสอบ 3 บัญชี
   * สร้าง Auth Middleware ตรวจสอบ JWT Cookie (`req.user`)
   * สร้าง Controller: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
   * เขียน Unit/Integration Test สำหรับ Auth (`tests/auth.test.ts`):
     * `TEST-AUTH-01`: ล็อกอินสำเร็จด้วยอีเมลและรหัสผ่านที่ถูกต้อง → 200 + Set-Cookie httpOnly + คืน user โดยไม่มี `passwordHash`
     * `TEST-AUTH-02`: ปฏิเสธ 401 `UNAUTHORIZED` หากรหัสผ่านผิดหรือไม่พบผู้ใช้ และต้องไม่ตั้ง cookie
     * `TEST-AUTH-03`: ปฏิเสธ 401 หากเข้าถึง Protected Endpoint โดยไม่มี Cookie; `GET /api/auth/me` คืน current user; หลัง `POST /api/auth/logout` แล้ว `/me` ต้อง 401
     * `TEST-AUTH-04`: REQUESTER เรียก `/api/requests/pending` หรือ review endpoint ต้องได้ 403 `FORBIDDEN`
     * `TEST-AUTH-05`: ตรวจว่า `passwordHash` ขึ้นต้นด้วย `$2` และไม่มี plaintext ใน DB/response; ตรวจ JWT `exp - iat = 8h`
     * ต้องมี negative/boundary tests และห้าม mock-only persistence
3. **T เปิด PR #0 เข้า `sprint-1-staging`:**
   * Title: `feat: auth foundation, prisma schema, and seed data`
4. **Oum ทำการ Review PR #0:**
   * Oum ดึง branch ไปทดสอบรันบนเครื่อง: `npm run prisma:migrate && npm test`
   * Oum เขียนคอมเมนต์ตรวจรับบน GitHub: *"Verified database migration and seed accounts. Auth middleware correctly sets httpOnly cookie. Tests passing."*
   * Oum กด **Approve** และ **Merge pull request** เข้า `sprint-1-staging`

> **🤝 [HANDOFF POINT 2]:** ทั้ง Oum และ T สั่ง `git checkout sprint-1-staging && git pull origin sprint-1-staging` ตอนนี้ทั้งคู่มี Database และระบบ Auth ใช้งานพร้อมกัน

---

### 📌 PHASE 3: Feature 1 — Requester Slice (วันศุกร์ที่ 6 พ.ย.)
* **Owner:** Oum | **Reviewer:** T
* *(หมายเหตุ: ระหว่างที่ Oum ทำ Feature 1 ให้ T เริ่มเขียน Contract Part E2 สำหรับ Feature 2 เตรียมไว้)*

1. **Oum เขียน Contract Part E1:**
   * สร้างไฟล์ `docs/sprints/sprint-1/feature-01.md`:
      * ระบุ Acceptance Criteria:
        * `AC-01`: ผู้ใช้ที่ authenticated สร้างคำขอด้วยข้อมูลถูกต้อง → 201, `status = PENDING`, `requestNo` ไม่ซ้ำ, `assignedReviewerId` ถูกตั้งตาม BR-05, มี history `SUBMITTED`
        * `AC-02`: ระบบปฏิเสธ `400 VALIDATION_ERROR` เมื่อ `amount <= 0` หรือเกิน `9,999,999,999.99`, `title` สั้นกว่า 3 หรือยาวเกิน 150 ตัวอักษร (หลัง trim), `category` ไม่อยู่ whitelist, หรือ `description` ว่าง/เกิน 1,000 ตัวอักษร และต้องไม่สร้าง record
        * `AC-03`: Requester ดูรายการคำขอของตนเองผ่าน `GET /api/requests/my` ได้เฉพาะของตน เรียง `createdAt` ลงมา
        * `AC-04`: Requester ไม่สามารถเข้าถึงคำขอของผู้อื่นผ่าน `GET /api/requests/:id` ได้ → 403 `ACCESS_DENIED`; unauthenticated → 401 และต้องไม่คืนข้อมูลส่วนตัว
        * `AC-04b`: ข้อมูลคำขอและ history ยังอยู่หลัง process restart (persistence)
      * ระบุ Software Test Specification (STS): `TEST-01` ถึง `TEST-04` + `E2E-01` (create → my requests → retrieve persisted result)
      * ระบุ UI spec: `NewRequestPage`, `MyRequestsPage`, `RequestDetailPage` พร้อม validation/loading/empty/error states
2. **Oum เริ่มพัฒนาด้วย TDD:**
   * สร้าง branch:
     ```bash
     git checkout sprint-1-staging
     git pull origin sprint-1-staging
     git checkout -b feature/1-request-submission
     ```
   * **เขียน Test ก่อน (Red):** เขียน `tests/requests.test.ts` เทสการสร้างคำขอ $\rightarrow$ สั่งรัน `npm test` จะพบว่า **Fail (สีแดง)** $\rightarrow$ **แคปภาพบันทึกไว้**
   * **เขียนโค้ด:**
     * Endpoint `POST /api/requests` และ `GET /api/requests/my`
     * หน้า UI `client/src/pages/NewRequestPage.tsx` และ `client/src/pages/MyRequestsPage.tsx`
   * **รันเทสให้ผ่าน (Green):** สั่งรัน `npm test` จนกระทั่ง **Pass (สีเขียว)** $\rightarrow$ **แคปภาพบันทึกไว้**
3. **Oum เปิด PR #1 เข้า `sprint-1-staging`:**
   * Title: `feat: requester request creation and my requests view`
4. **T ทำการ Review PR #1:**
   * T ตรวจดูโค้ดและรันเทสบนเครื่อง
   * T คอมเมนต์บน GitHub: *"Checked request validation logic and requester data isolation. Tests passed cleanly. LGTM."*
   * T กด **Approve** และ **Merge pull request** เข้า `sprint-1-staging`

> **🤝 [HANDOFF POINT 3]:** ฟีเจอร์สร้างคำขอถูกรวมเข้า `sprint-1-staging` แล้ว ข้อมูลคำขอพร้อมให้ฝั่ง Reviewer นำไปใช้ต่อยอดทันที

---

### 📌 PHASE 4: Feature 2 — Reviewer Slice & Business Rules (วันเสาร์ที่ 7 พ.ย.)
* **Owner:** T | **Reviewer:** Oum

1. **T ดึงโค้ดล่าสุดจาก staging และแตก Branch:**
   ```bash
   git checkout sprint-1-staging
   git pull origin sprint-1-staging
   git checkout -b feature/2-review-decision
   ```
2. **T เขียน Contract Part E2:**
   * สร้างไฟล์ `docs/sprints/sprint-1/feature-02.md`:
      * ระบุ Acceptance Criteria:
        * `AC-05 (BR-05):` Reviewer ดึงรายการรออนุมัติ (`PENDING`) ได้เฉพาะที่ `assignedReviewerId = currentUser.id`
        * `AC-06`: Reviewer ที่ถูก assign กด `APPROVE` หรือ `REJECT` พร้อม comment → 200, status เปลี่ยน, `updatedAt` เปลี่ยน, มี `ApprovalHistory` entry ใหม่ (actor/action/comment)
        * `AC-07 (BR-01):` **No Self-Approval** — ผู้ใช้ที่เป็นเจ้าของคำขอ ไม่สามารถอนุมัติ/ปฏิเสธคำขอของตนเองได้ แม้มี role `REVIEWER` → `403 FORBIDDEN` (`SELF_APPROVAL_NOT_ALLOWED`) และต้องตรวจก่อน assignment
        * `AC-08 (BR-02):` **State Guard** — การพยายามอนุมัติ/ปฏิเสธคำขอที่ผ่านการตัดสินไปแล้ว → `400 BAD_REQUEST` (`INVALID_STATE_TRANSITION`) และต้องไม่เพิ่ม history
        * `AC-09 (BR-05):` Reviewer ที่ไม่ใช่ `assignedReviewerId` พยายามตัดสินคำขอของผู้อื่น → `403 FORBIDDEN` (`ACCESS_DENIED`)
        * `AC-10`: `REQUESTER` (ไม่มี role REVIEWER) เรียก review endpoint → `403 FORBIDDEN` (`FORBIDDEN`) — backend enforcement ไม่ใช่แค่ซ่อนปุ่ม
        * `AC-11 (BR-06):` History เป็น append-only; ไม่มี endpoint update/delete; history เดิมต้องไม่ถูกแก้และยังอยู่หลัง restart
        * `AC-12 (BR-07):` `decision` ไม่อยู่ใน `APPROVE|REJECT` หรือ `REJECT` ไม่มี comment (3–500 ตัวอักษร) → `400 VALIDATION_ERROR`; `APPROVE` comment เกิน 500 → `400 VALIDATION_ERROR`
      * ระบุ Software Test Specification (STS): `TEST-05` ถึง `TEST-13` + `E2E-02` (approve) + `E2E-03` (self-approval blocked)
      * ระบุ UI spec: `PendingReviewsPage`, `ReviewDetailPage` พร้อมปุ่ม Approve/Reject, comment box, loading/empty/error states
3. **T พัฒนาโค้ดด้วย TDD (หลักฐานสำคัญสำหรับรายงาน):**
   * **เขียน Test ดัก Business Rules ก่อน (Red):**
     * `TEST-08` ใน `tests/review.test.ts`: `manager.hybrid` (REVIEWER) สร้างคำขอเอง → พยายามยิง `POST /api/requests/:id/review` อนุมัติตัวเอง → ต้องได้ 403 `SELF_APPROVAL_NOT_ALLOWED`
     * `TEST-11`: `manager.hybrid` พยายาม review คำขอของ `oum.requester` ที่ assign ให้ `t.reviewer` → ต้องได้ 403 `ACCESS_DENIED`
     * `TEST-10`: `oum.requester` พยายามเรียก review endpoint → ต้องได้ 403 `FORBIDDEN`
     * `TEST-09`: review คำขอที่ `APPROVED`/`REJECTED` แล้ว → 400 `INVALID_STATE_TRANSITION`
     * `TEST-12`: reject ไม่มี comment / decision ผิด → 400 `VALIDATION_ERROR`
     * `TEST-13`: ตรวจ history append-only และ persistence หลัง restart
     * รันเทส $\rightarrow$ **Fail (สีแดง)** $\rightarrow$ **แคปภาพหน้าจอ Terminal เก็บไว้** (ระบุ commit/วันที่ของ Red state)
   * **เขียนโค้ด Enforce Business Rule ใน Backend:**
     ```typescript
      // Rule Check ใน Controller/Service — ลำดับต้องเป๊ะตาม §6
      if (currentUser.role !== "REVIEWER") {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Reviewer role required." } });
      }
      if (request.requesterId === currentUser.id) {
        return res.status(403).json({
          error: {
            code: "SELF_APPROVAL_NOT_ALLOWED",
            message: "You cannot approve or reject your own request."
          }
        });
      }
      if (request.assignedReviewerId !== currentUser.id) {
        return res.status(403).json({
          error: { code: "ACCESS_DENIED", message: "This request is not assigned to you." }
        });
      }
      if (request.status !== "PENDING") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATE_TRANSITION",
            message: `Request is already ${request.status}.`
          }
        });
      }
     ```
   * ทำหน้าจอ UI ฝั่ง Reviewer (`PendingReviewsPage.tsx`) มีปุ่ม Approve / Reject พร้อมกล่องกรอก Comment
   * **รันเทสให้ผ่าน (Green):** สั่งรันเทสอีกครั้งจนกระทั่ง **Pass (สีเขียว)** $\rightarrow$ **แคปภาพหน้าจอ Terminal เก็บไว้**
4. **T เปิด PR #2 เข้า `sprint-1-staging`:**
   * Title: `feat: reviewer decision workflow and self-approval enforcement`
5. **Oum ทำการ Review PR #2:**
   * Oum เข้าไปตรวจเช็คเงื่อนไข `SELF_APPROVAL_NOT_ALLOWED` และรันเทส
   * Oum คอมเมนต์บน GitHub: *"Verified backend enforcement of BR-01 (No Self-Approval), BR-02 (State transitions), and BR-05 (Assignment). All Sprint 1 tests passed. Approved."*
   * Oum กด **Approve** และ **Merge pull request** เข้า `sprint-1-staging`

> **🤝 [HANDOFF POINT 4]:** โค้ดทั้งหมดของ Sprint 1 สมบูรณ์ ครบทั้ง 2 ฟีเจอร์และกฎ Business Rules บน `sprint-1-staging`

---

### 📌 PHASE 5: Integration, Evidence & Final PDF Assembly (วันอาทิตย์ที่ 8 พ.ย.)
*โหมดการทำงาน: แบ่งหน้าที่เก็บหลักฐานและประกอบเล่ม PDF ส่งก่อน 23:59*

#### 1. การ Release สู่ `main`
* Oum และ T ร่วมกันเปิด **Release PR:** จาก `sprint-1-staging` $\rightarrow$ `main`
* รันเทสรอบสุดท้ายบน staging ให้มั่นใจว่าเขียว 100%
* ทำการ Merge เข้า `main`
* ดึง `main` ลงเครื่องและติด Release Tag:
  ```bash
  git checkout main
  git pull origin main
  git tag v0.1.0-sprint1
  git push origin v0.1.0-sprint1
  ```
* จดบันทึก **Commit Hash** และ **Tag** ไว้สำหรับใส่ในหน้าแรกของเล่มรายงาน

#### 2. การเก็บหลักฐาน Part F (แบ่งหน้าที่กัน):
* **[Oum] เก็บภาพ Program Demonstrations (3 Scenarios) พร้อมพิมพ์คำบรรยาย:**
  * **Scenario 1 (Normal Domain Journey — UI → API → DB → Retrieval):**
    * รูป 1.1: Oum ล็อกอินเป็น Requester กรอกฟอร์มขอซื้ออุปกรณ์ 1,500 THB แล้ว submit สำเร็จ
    * รูป 1.2: ตาราง My Requests แสดงสถานะ `PENDING` และ `requestNo` ที่ persisted
    * รูป 1.3: เปิดรายละเอียดคำขอ; แสดง `assignedReviewerId`/ชื่อ reviewer ที่ระบบ assign
    * รูป 1.4: T ล็อกอินเป็น Reviewer เปิดหน้าคำขอแล้วกด `APPROVE` พร้อมหมายเหตุ "Approved for project use"
    * รูป 1.5: กลับไปฝั่ง Requester → สถานะเปลี่ยนเป็น `APPROVED`, เห็น history entry; แสดงหลักฐาน DB query หรือ API response ที่ยืนยันว่าข้อมูลถูกบันทึกจริง
  * **Scenario 2 (Business Rule / Boundary Rejection):**
    * รูป 2.1: สร้างคำขอด้วย `amount = 0` หรือ `title = "AB"` → แสดง `400 VALIDATION_ERROR` และไม่มี record ใหม่
    * รูป 2.2: พยายาม Approve/ส่ง API ซ้ำไปยังคำขอที่ `APPROVED` แล้ว → `400 INVALID_STATE_TRANSITION`
    * รูป 2.3: Reject โดยไม่ใส่ comment → `400 VALIDATION_ERROR`
  * **Scenario 3 (Forbidden Access / No Self-Approval / Unrelated Reviewer):**
    * รูป 3.1: ล็อกอินด้วย `manager.hybrid@cpe334.local` (REVIEWER) แล้วยื่นคำขอเอง (EQ/TRAVEL จะ assign ให้ `t.reviewer`)
    * รูป 3.2: `manager.hybrid` พยายามอนุมัติคำขอของตนเอง → `403 SELF_APPROVAL_NOT_ALLOWED`
    * รูป 3.3: `manager.hybrid` พยายามอนุมัติคำขอของ `oum.requester` ที่ assign ให้ `t.reviewer` → `403 ACCESS_DENIED` (unrelated reviewer)
    * รูป 3.4: `oum.requester` พยายามเรียก review endpoint → `403 FORBIDDEN`; ต้องแนบ API test output/หลักฐาน backend ไม่ใช่แค่ปุ่มที่ซ่อน
    * รูป 3.5: เปิด protected endpoint โดยไม่มี cookie → `401 UNAUTHORIZED`; login/logout แล้ว `/me` ต้อง 401
* **[T] สรุปผล Automated Tests & หลักฐาน Git:**
  * รันคำสั่ง build/test ที่ระบุใน README (เช่น `npm run build && npm test`) บน commit ที่ส่ง; แคปภาพผลที่แสดง **passing / failing / skipped counts**
  * สร้างตาราง `AC ID → Test ID → Test File/Test Name → Level (unit/integration/E2E) → Result → Tested Commit`
  * คัดลอก Snippet โค้ดเทสจริง 2 ตัว: (1) domain rule `BR-01 No Self-Approval` (2) access restriction `BR-05/BR-03` — แสดง setup + assertion + ผลรัน
  * แนบหลักฐาน TDD Red→Green: commit/วันที่ของ Red state และ Green state (ต้องเห็น test ที่ fail ก่อน implement)
  * แคปภาพ GitHub Issues #1–#3, Project board (Done), PR #0/#1/#2 review ที่มี substantive comment และ integration เข้า `sprint-1-staging` → `main`
  * สร้าง release/history table: Issue → branch → PR → reviewer → merge commit/date → release tag
  * เขียน **Contribution Table** (Oum/T), **AI-Use Declaration**, และ **Known Limitations / Failed or Skipped Tests**
  * เขียน **Setup Summary** สำหรับ Part F: dependencies, `.env.example`, migration/seed, build/test commands, demo accounts

#### 3. รวมเป็นเล่ม PDF ฉบับสมบูรณ์ (Single Self-Contained PDF)
เรียงเนื้อหาตามหัวข้อที่อาจารย์กำหนดเป๊ะๆ:
* **หน้า 1: Header & Navigation Table:**
  * ชื่อและรหัสนักศึกษา: Oum (`67070501075`) & T (`67070501021`)
  * Theme: Theme 5 — Workflow and Approval System
  * Repository URL: ลิงก์ GitHub
  * Submitted Commit Hash & Release Tag: `v0.1.0-sprint1`
  * **Navigation Table (สารบัญชี้เลขหน้าพร้อม ID สำคัญ):**
    | Part | หัวข้อเนื้อหา | หน้าใน PDF | Key IDs / Highlights |
    | :---: | :--- | :---: | :--- |
    | **Part A** | SRS and Product Scope | น. 2–5 | FR-01..11, BR-01..07, NFR-01..06, D-01..D-14 |
    | **Part B** | Feature Inventory & Traceability | น. 6–8 | F-01..F-11, Traceability Matrix, Coverage Gaps |
    | **Part C** | System-Level SDS | น. 9–13 | Architecture, Prisma Schema, UI/API Conventions, Role Matrix, Token Lifecycle, Deploy Plan |
    | **Part D** | Three-Sprint Plan | น. 14–15 | Sprint 1/2/3 Goals, Feature IDs, Dependencies, Exam Plan |
    | **Part E** | Sprint 1 Engineering Contracts | น. 16–23 | E0/E1/E2, AC-01..12 + AC-AUTH-01..05, TEST-01..13 + TEST-AUTH-01..05 + E2E-01..03, DoD |
    | **Part F** | Working Sprint 1 & Verification | น. 24–32 | Demo Screenshots, Build/Test Results, AC→Test Table, Git/Issue/PR Evidence, Setup, Limitations |
* ตรวจทานไฟล์ PDF ให้คมชัด อ่านง่าย ไม่แตก แล้วอัปโหลดส่งในระบบ **LEB2** ภายในเวลา 23:59 น. ของวันที่ 8 พ.ย. 2026

---

## 7. Part A — SRS & Product Scope (copy-ready content)

> ใช้เนื้อหาส่วนนี้เป็นโครง `docs/srs.md` โดยตรง; ต้องมี ID ที่ stable และอธิบาย observable behavior ไม่ใช่คำกว้าง ๆ เช่น "manage records"

### 7.1 Stakeholder problem & chosen context
องค์กรต้องขออนุมัติค่าใช้จ่าย/จัดซื้อผ่านกระดาษและแชต ทำให้ติดตามสถานะไม่ได้ ตรวจสอบย้อนหลังไม่ได้ และไม่มีการป้องกัน self-approval/ผลประโยชน์ทับซ้อน. ผลิตภัณฑ์นี้เป็น **Workflow and Approval System** สำหรับคำขอเบิกงบและจัดซื้อภายในองค์กร โดยมี requester, reviewer และ (ภายหลัง) admin.

### 7.2 Actors & responsibilities
| Actor | Responsibility | Sprint 1? |
| :--- | :--- | :---: |
| Requester | สร้างคำขอ, ดูรายการ/รายละเอียด/สถานะ/history ของตนเอง; ห้าม review | Yes |
| Reviewer | ดู queue ที่ assigned, approve/reject พร้อม comment; สร้างคำขอของตนเองได้; ห้าม review คำขอตนเอง | Yes |
| Admin | จัดการ user/role/reviewer assignment (Sprint 3); ไม่มี endpoint ใน Sprint 1 | No (S3) |
| System | ออก `requestNo`, assign reviewer, enforce BR, บันทึก history, จัดการ error/validation | Yes |

### 7.3 Scope & explicit exclusions
**In scope (whole product):** request creation/tracking, review queue/decision, reviewer assignment, append-only approval history, return for revision/resubmission, multi-stage approval, attachments, search/filter/reporting, admin management, security/performance hardening.
**Sprint 1 only:** F-01 Auth & Session, F-02 Request Creation, F-03 My Requests & Data Isolation, F-04 Review Queue & Decision, F-05 History write.
**Explicit exclusions (Sprint 1):** real payment gateway, external email/SMS/chat integration, bank integration, multi-currency, self-registration, password recovery, email verification, advanced admin UI, file attachments, multi-stage approval, return-for-revision, analytics dashboard, mobile app, real production secrets/data.
**Later sprints:** F-05 audit view, F-06 return/resubmission, F-07 multi-stage, F-08 attachments (S2); F-09 search/reporting, F-10 admin, F-11 hardening/deployment (S3).

### 7.4 Functional Requirements
| ID | Requirement (observable behavior) | Sprint | Planned verification |
| :--- | :--- | :---: | :--- |
| FR-01 | ผู้ใช้ login/logout/ดู current user ผ่าน cookie session; protected endpoint ต้อง reject unauthenticated | S1 | AC-AUTH-01..05 / TEST-AUTH-01..05 |
| FR-02 | ผู้ใช้ authenticated สร้างคำขอด้วย title/amount/category/description; server validate, ออก requestNo, ตั้ง status PENDING และ assigned reviewer | S1 | AC-01, AC-02 / TEST-01, TEST-02 |
| FR-03 | Requester ดูรายการคำขอของตนเองและรายละเอียด/สถานะ/history ได้ | S1 | AC-03, AC-04 / TEST-03, TEST-04 |
| FR-04 | Assigned reviewer ดู queue PENDING และ approve/reject พร้อม comment; เปลี่ยน status และบันทึก history | S1 | AC-05..AC-12 / TEST-05..TEST-13 |
| FR-05 | ระบบเก็บ approval history แบบ append-only (actor/action/comment/time) และมี audit view | S1 write; S2 view | AC-06, AC-11 / TEST-06, TEST-13 |
| FR-06 | ระบบ assign reviewer; เฉพาะ assigned reviewer ตัดสินได้; admin reassign ได้ใน S3 | S1 assign; S3 admin | AC-05, AC-09 / TEST-05, TEST-11 |
| FR-07 | Reviewer ส่งคำขอกลับให้แก้ไข; requester แก้และ resubmit ตาม state ที่กำหนด | S2 | Planned AC/TEST |
| FR-08 | รองรับ multi-stage approval พร้อม decision/history ต่อ stage | S2 | Planned AC/TEST |
| FR-09 | แนบไฟล์ประกอบคำขอและควบคุมสิทธิ์การเข้าถึงไฟล์ | S2 | Planned AC/TEST |
| FR-10 | ค้นหา/filter คำขอ และรายงานสรุปตาม status/category/amount | S3 | Planned AC/TEST |
| FR-11 | Admin จัดการ user/role/reviewer assignment | S3 | Planned AC/TEST |

### 7.5 Business Rules
| ID | Rule | Failure behavior | Sprint |
| :--- | :--- | :--- | :---: |
| BR-01 | ห้าม self-approval แม้ user มี role REVIEWER/ADMIN | 403 `SELF_APPROVAL_NOT_ALLOWED` (ตรวจก่อน assignment) | S1 |
| BR-02 | state เริ่ม PENDING; เปลี่ยนได้เพียง PENDING → APPROVED หรือ PENDING → REJECTED; ห้ามเปลี่ยนซ้ำ | 400 `INVALID_STATE_TRANSITION` | S1 |
| BR-03 | Requester เห็นเฉพาะคำขอของตน; Reviewer เห็นเฉพาะที่ assigned (หรือของตน) | 403 `ACCESS_DENIED` | S1 |
| BR-04 | title 3–150 หลัง trim; amount > 0 และ ≤ 9,999,999,999.99; category อยู่ใน whitelist; description 1–1,000 ตัวอักษร | 400 `VALIDATION_ERROR` | S1 |
| BR-05 | คำขอต้องมี assigned reviewer; เฉพาะ assigned reviewer ตัดสินได้ | 403 `ACCESS_DENIED` | S1 |
| BR-06 | history เป็น append-only; status update + history insert อยู่ใน transaction | ปฏิเสธ update/delete; rollback ทั้ง transaction | S1 |
| BR-07 | decision ต้องเป็น APPROVE/REJECT; REJECT ต้องมี comment 3–500 ตัวอักษร; APPROVE comment ≤ 500 | 400 `VALIDATION_ERROR` | S1 |

### 7.6 Non-Functional Requirements (measurable)
| ID | Requirement / target | Verification method | Sprint |
| :--- | :--- | :--- | :---: |
| NFR-01 | Security: bcrypt cost 12; JWT HS256 อายุ 8h; cookie httpOnly/SameSite; ไม่มี plaintext password/secret ใน repo หรือ response | Code inspection + TEST-AUTH-01..05 + secret scan | S1 (recheck Lab 5) |
| NFR-02 | Performance: p95 < 300 ms สำหรับ Sprint 1 API ภายใต้ local load 50 requests (warm DB); list ≤ 100 rows ไม่มี N+1 | Supertest timing หรือ autocannon script; บันทึกผล | S1 baseline; S3 recheck |
| NFR-03 | Persistence/durability: ข้อมูลและ history อยู่หลัง process restart; migrate+seed จาก empty DB ได้ซ้ำ | Restart test + `prisma migrate reset` + seed | S1; Lab 5 redeploy |
| NFR-04 | Validation/error handling: 100% invalid inputs ที่คาดหมายได้คืน 4xx พร้อม error code; ไม่มี 500/stack trace/secret ใน response | Negative/boundary tests + error middleware review | S1 |
| NFR-05 | Testability/traceability: 100% Sprint 1 AC map กับ automated test อย่างน้อย 1 ตัว; critical journey มี E2E | Traceability matrix + test run | S1 |
| NFR-06 | Deployability/config: รันผ่าน Docker ด้วย env vars, ไม่มี hard-coded secret, DB config externalized, มี `/api/health` | Docker build/run + env check | Design S1; verify Lab 5 |

### 7.7 Assumptions, decisions & open questions
| ID | Type | Decision / assumption | Rationale |
| :--- | :--- | :--- | :--- |
| D-01 | Decision | เลือก Theme 5 — Workflow and Approval System | Oum ID ลงท้าย 5; ทีมตกลงใช้ theme นี้ |
| D-02 | Decision | REVIEWER สร้างคำขอได้ | จำเป็นเพื่อทดสอบ BR-01 อย่างสมจริง; role ยัง meaningful เพราะ reviewer เท่านั้นที่ review ได้ |
| D-03 | Decision | Sprint 1 assign reviewer ตาม category mapping | ทำให้ deterministic และทดสอบ assignment/unrelated reviewer ได้ |
| D-04 | Decision | ADMIN ยังไม่ใช้งานใน Sprint 1 | ลด scope; admin management อยู่ใน S3 |
| D-05 | Assumption | ใช้ THB เดียว; amount เป็น Decimal(12,2) | หลีกเลี่ยง floating-point และ multi-currency ที่อยู่นอก scope |
| D-06 | Decision | category whitelist: EQUIPMENT, TRAVEL, SOFTWARE, SUPPLIES | ควบคุม validation และ reporting |
| D-07 | Decision | ไม่มี attachments ใน Sprint 1 | อยู่ใน S2 |
| D-08 | Assumption | ไม่ใช้ payment/email/SMS/external API จริง; ใช้ synthetic data | ตามข้อกำหนดรายวิชา |
| D-09 | Decision | JWT stateless; logout เคลียร์ cookie; ไม่มี server-side revocation ใน S1 | เพียงพอต่อ Sprint 1; บันทึกเป็น limitation |
| D-10 | Decision | requestNo = `REQ-YYYYMMDD-NNNN` + unique constraint + retry | อ่านง่ายและกัน duplicate |
| D-11 | Decision | REJECT ต้องมี comment; APPROVE optional | รองรับ audit trail ที่มีความหมาย |
| D-12 | Decision | Reviewer เห็นเฉพาะ assigned queue; ไม่มี global queue ใน S1 | สอดคล้อง BR-03/BR-05 |
| D-13 | Assumption | Seed accounts เป็น synthetic; `Password123!` ใช้เฉพาะ local/demo | ห้ามใช้ production secret |
| D-14 | Decision | status update + history insert ทำใน transaction เดียว | ป้องกัน partial state (BR-06) |
| Q-01 | Open (S3) | Admin ควรเห็นคำขอทั้งหมดหรือไม่ | ต้องตัดสินตอนออกแบบ F-10; S1 ไม่มี admin endpoint |
| Q-02 | Open (S2) | กฎ multi-stage/return-for-revision ที่แน่นอน | ต้อง elaborate ใน Sprint 2 contract |
| Q-03 | Open (S2) | นโยบายเก็บไฟล์แนบ (ขนาด/ชนิด/ที่เก็บ) | ต้อง elaborate ใน Sprint 2 contract |

---

## 8. Part B — Feature Inventory & Traceability

### 8.1 Feature inventory
| Feature ID | Feature | Related requirements | Dependencies | Planned sprint | Verification |
| :--- | :--- | :--- | :--- | :---: | :--- |
| F-01 | Auth & Session | FR-01, NFR-01, NFR-04 | — | S1 | AC-AUTH-01..05 / TEST-AUTH-01..05 |
| F-02 | Request Creation | FR-02, BR-04, BR-05 | F-01 | S1 | AC-01, AC-02 / TEST-01, TEST-02 |
| F-03 | My Requests & Data Isolation | FR-03, BR-03 | F-01, F-02 | S1 | AC-03, AC-04 / TEST-03, TEST-04 |
| F-04 | Review Queue & Decision | FR-04, FR-06, BR-01, BR-02, BR-05, BR-06, BR-07 | F-01, F-02 | S1 | AC-05..AC-12 / TEST-05..TEST-13, E2E-02/03 |
| F-05 | Approval History & Audit View | FR-05, BR-06 | F-04 | S1 write; S2 view | AC-06, AC-11 / TEST-06, TEST-13 |
| F-06 | Return for Revision & Resubmission | FR-07, BR-02, BR-06 | F-04 | S2 | Planned AC/TEST |
| F-07 | Multi-stage Approval | FR-08, BR-02, BR-05, BR-06 | F-04, F-06 | S2 | Planned AC/TEST |
| F-08 | Attachments | FR-09, BR-03 | F-02 | S2 | Planned AC/TEST |
| F-09 | Search, Filter & Reporting | FR-10, NFR-02 | F-03, F-04, F-05 | S3 | Planned AC/TEST |
| F-10 | Admin User & Assignment Management | FR-11, BR-05 | F-01, F-04 | S3 | Planned AC/TEST |
| F-11 | Hardening, Regression & Deployment | NFR-01..NFR-06 | F-01..F-10 | S3 / Lab 5 | NFR matrix |

### 8.2 Traceability matrix
| Requirement | Feature(s) | Sprint | AC / verification |
| :--- | :--- | :---: | :--- |
| FR-01 | F-01 | S1 | AC-AUTH-01..05 / TEST-AUTH-01..05 |
| FR-02 | F-02 | S1 | AC-01, AC-02 / TEST-01, TEST-02 |
| FR-03 | F-03 | S1 | AC-03, AC-04 / TEST-03, TEST-04 |
| FR-04 | F-04 | S1 | AC-05..AC-12 / TEST-05..TEST-13 |
| FR-05 | F-05 | S1 write; S2 view | AC-06, AC-11 / TEST-06, TEST-13 |
| FR-06 | F-04, F-10 | S1 assign; S3 admin | AC-05, AC-09 / TEST-05, TEST-11 |
| FR-07 | F-06 | S2 | Planned AC/TEST (elaborate in S2 contract) |
| FR-08 | F-07 | S2 | Planned AC/TEST |
| FR-09 | F-08 | S2 | Planned AC/TEST |
| FR-10 | F-09 | S3 | Planned AC/TEST |
| FR-11 | F-10 | S3 | Planned AC/TEST |
| BR-01 | F-04 | S1 | AC-07 / TEST-08 |
| BR-02 | F-04, F-06, F-07 | S1 / S2 | AC-08 / TEST-09 (S1); planned S2 |
| BR-03 | F-03, F-04, F-08 | S1 / S2 | AC-04, AC-09 / TEST-04, TEST-11 |
| BR-04 | F-02 | S1 | AC-02 / TEST-02 |
| BR-05 | F-02, F-04, F-10 | S1 / S3 | AC-01, AC-05, AC-09 / TEST-01, TEST-05, TEST-11 |
| BR-06 | F-04, F-05 | S1 | AC-06, AC-11 / TEST-06, TEST-13 |
| BR-07 | F-04 | S1 | AC-12 / TEST-12 |
| NFR-01 | F-01, F-04, F-11 | S1 / Lab 5 | TEST-AUTH + security review |
| NFR-02 | F-01..F-04, F-09, F-11 | S1 baseline / S3 | Performance script + results |
| NFR-03 | F-02..F-05, F-11 | S1 / Lab 5 | Restart + migrate/seed test |
| NFR-04 | F-01..F-04, F-11 | S1 | Negative/boundary tests |
| NFR-05 | F-01..F-04 | S1 | Traceability matrix + test run |
| NFR-06 | F-11 | S3 / Lab 5 | Docker build/run + env check |

### 8.3 Coverage gaps, exclusions & approved changes
* **Baseline coverage:** FR-01..FR-11, BR-01..BR-07, NFR-01..NFR-06 ถูก map ครบ; ไม่มี uncovered baseline requirement.
* **Later-sprint items:** FR-07..FR-11 ยังไม่มี AC/TEST ที่ elaborate — ระบุเป็น "planned" อย่างซื่อสัตย์ ไม่ถือว่าผ่าน.
* **Explicit exclusions:** real payment, external email/SMS, bank integration, multi-currency, mobile app, self-registration/password recovery (Sprint 1).
* **Approved change log template:** `CR-ID | Date | Requirement/Feature | Change | Reason | Approved by | Affected AC/TEST/SDS | Status`.
* **Rule:** ห้าม silently delete requirement หรือย้าย feature ไป Sprint 3 โดยไม่มี approved change record.

### 8.4 Dependency graph (text)
`F-01 → F-02 → F-03`; `F-01/F-02 → F-04 → F-05`; `F-04 → F-06 → F-07`; `F-02 → F-08`; `F-03/F-04/F-05 → F-09`; `F-01/F-04 → F-10`; `F-01..F-10 → F-11`.

---

## 9. Part C — System-Level SDS

### 9.1 Architecture & stack
```
React 19 + Vite + TypeScript + Tailwind (client)
        │  HTTPS/JSON, httpOnly JWT cookie
        ▼
Node.js + Express + TypeScript (API/application layer)
        │  Prisma ORM
        ▼
PostgreSQL 17 (persistent database)
```
* Modular monolith; business rules อยู่ใน server service/controller ไม่ใช่ client.
* Client และ server แยก dev servers; production build client เป็น static assets (Nginx/Express static) และ server เป็น container เดียวหรือสอง container ที่คุยกันผ่าน HTTP.
* ไม่ใช้ microservices; ไม่มี external queue/cache ใน Sprint 1.

### 9.2 Data model, constraints & persistence
* Entities: `User`, `ApprovalRequest`, `ApprovalHistory` (ตาม §3).
* Ownership: `ApprovalRequest.requesterId → User`; `ApprovalRequest.assignedReviewerId → User`; `ApprovalHistory.actorId → User`.
* Constraints: unique `User.email`, unique `ApprovalRequest.requestNo`, enum `Role/RequestStatus/HistoryAction`, `amount Decimal(12,2)` และ service-level `amount > 0`, `title` length, category whitelist, `assignedReviewerId` required at creation (service), history append-only.
* Indexes: `(requesterId, createdAt)`, `(assignedReviewerId, status)`, `(status, createdAt)`, `(requestId, createdAt)`.
* Migrations: local `npx prisma migrate dev`; released/production `npx prisma migrate deploy`.
* Seed: idempotent `prisma/seed.ts` (upsert 3 accounts); สร้าง demo request ผ่าน UI/API ไม่ hard-code financial data.
* Durability: PostgreSQL volume/Cloud SQL; ข้อมูลต้องอยู่หลัง restart/redeploy (NFR-03).

### 9.3 Roles & permission matrix
ใช้ตารางใน §6 (Phase 1) เป็น authoritative matrix. หลักการ:
* Backend ตรวจ role + ownership/assignment ทุก protected endpoint; การซ่อน UI ไม่ใช่ authorization.
* `POST /api/requests` เปิดให้ authenticated ทุก role ใน Sprint 1 (REQUESTER/REVIEWER) เพื่อให้ BR-01 ทดสอบได้; `ADMIN` ไม่มี endpoint.
* `GET /api/requests/pending` และ review endpoint ต้องเป็น REVIEWER และต้องเป็น assigned reviewer (ยกเว้น self-approval ที่ถูกบล็อกก่อน).
* `GET /api/requests/:id` อนุญาต owner หรือ assigned reviewer เท่านั้น.

### 9.4 UI structure & conventions
Routes/screens:
| Route | Screen | Role | Key states |
| :--- | :--- | :--- | :--- |
| `/login` | LoginPage | Public | default, loading, invalid credentials, server error |
| `/requests/new` | NewRequestPage | Authenticated | form validation, submitting, success redirect, API error |
| `/requests/my` | MyRequestsPage | Authenticated | loading, empty, list, error |
| `/requests/:id` | RequestDetailPage | Owner/assigned reviewer | loading, not found, forbidden, history |
| `/reviewer/pending` | PendingReviewsPage | Reviewer | loading, empty, assigned list, error |
| `/reviewer/requests/:id` | ReviewDetailPage | Assigned reviewer | approve/reject form, validation, forbidden, conflict |
| `/403`, `/404` | Error pages | All | static |

Shared UI behavior: client-side validation mirrors server but server is source of truth; disable submit while pending; show error banner with error code/message; success toast; empty state; loading skeleton; no optimistic status change until API success; role-aware navigation but not security.

### 9.5 API approach & conventions
* REST JSON under `/api`; plural nouns; standard success `{data: ...}` and error `{error:{code,message,details?}}`.
* Status codes: 200/201 success, 400 validation/state, 401 unauth, 403 forbidden, 404 not found, 500 unexpected.
* Validation: zod schema at boundary; reject unknown/invalid fields; numeric amount parsed as decimal string/number carefully; return `details` array for field errors.
* Auth: httpOnly cookie; no token in localStorage; no password/secret in response/logs.
* Error handling: central error middleware; no stack traces in production; log request ID + route + status without PII/secrets.
* Pagination/filtering: not required Sprint 1; `GET /requests/my`/`pending` return bounded list (seed data small).

Endpoint summary:
| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/auth/login` | POST | Login, set cookie |
| `/api/auth/logout` | POST | Clear cookie |
| `/api/auth/me` | GET | Current user |
| `/api/requests` | POST | Create request |
| `/api/requests/my` | GET | List own requests |
| `/api/requests/:id` | GET | Request detail + history |
| `/api/requests/pending` | GET | Assigned pending queue |
| `/api/requests/:id/review` | POST | Approve/reject |
| `/api/health` | GET | Health check (no auth) |

### 9.6 Authentication & session lifecycle
1. **Login:** validate body → find user by email → `bcrypt.compare` → sign JWT `{sub:userId, role, iat, exp:+8h}` with `JWT_SECRET` → set `token` cookie (`httpOnly`, `sameSite=lax`, `secure` in production, `maxAge:8h`) → return current user without `passwordHash`.
2. **Authenticated request:** read cookie → verify signature/expiry → load user → attach `req.user`; missing/invalid/expired → 401 `UNAUTHORIZED`.
3. **Authorization:** service checks role, ownership, assignment, state in the order defined in §6; failure → 403/400 with specific code.
4. **Current user:** `GET /api/auth/me` returns `{id,email,name,role}`; no sensitive fields.
5. **Logout:** `POST /api/auth/logout` clears cookie (`maxAge:0`); client redirects to `/login`. Stateless JWT ยัง valid จนหมดอายุถ้าถูก steal — known limitation.
6. **Password handling:** bcrypt cost 12; never log/return hash; seed uses `Password123!` only for local demo.

### 9.7 Configuration, secrets & deployment design
Environment variables (`.env.example`):
```
DATABASE_URL=postgresql://user:password@localhost:5434/approval_db
JWT_SECRET=replace-with-long-random-secret
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
```
* Secrets: `.env` ถูก ignore; ห้าม commit real secret; production ใช้ GCP Secret Manager (Lab 5).
* Database: PostgreSQL 17 local/Docker port 5434; migrations + seed ตาม §9.2; ใช้ volume/Cloud SQL เพื่อ durability.
* Docker (Lab 5): multi-stage build client → static assets; server image; `docker compose` สำหรับ local DB; healthcheck `/api/health`; env injection ไม่ bake secret.
* GCP planned (Lab 5): Cloud Run (container), Cloud SQL PostgreSQL, Artifact Registry, Secret Manager, Cloud Build/GitHub Actions; deploy จาก `main` หลัง CI ผ่าน; run migration job ก่อน/ตอน deploy; ไม่ต้องมี separate staging cloud.
* Reproducibility: README commands ต้องรันจาก clean clone ได้; ระบุ Node version และ package manager.

### 9.8 Error handling, logging & security
* Central error handler แปลง validation/domain error เป็น standard shape; unexpected → 500 generic.
* Prisma parameterized queries ป้องกัน SQL injection; React escapes XSS โดย default; หลีกเลี่ยง `dangerouslySetInnerHTML`.
* Cookie `sameSite=lax` + JSON API ช่วยลด CSRF; หากต้องการ hardening เพิ่ม CSRF token ใน Sprint 3/Lab 5.
* Rate limiting, audit export, admin actions อยู่ใน Sprint 3; ไม่ทำเกิน scope Sprint 1.
* Logs: ไม่มี password, token, secret, ข้อมูลส่วนตัวเกินจำเป็น.

---

## 10. Part D — Three-Sprint Plan

### 10.1 Sprint 1 (Deliverable 1 — 8 Nov 2026)
* **Goal:** working vertical slice ที่มี auth, request creation, my requests, review decision, assignment, self-approval/state guards, history write และ automated/selected E2E tests.
* **Features:** F-01, F-02, F-03, F-04, F-05 (write).
* **Dependencies:** F-01 ก่อน F-02/F-03; F-02 ก่อน F-04; schema/seed จาก PR #0.
* **Completion outcome:** AC-01..AC-12 + AC-AUTH-01..05 ผ่าน; TEST-01..13 + TEST-AUTH-01..05 + E2E-01..03 ผ่าน; release tag `v0.1.0-sprint1` บน `main`; PDF Parts A–F ครบ.
* **Out of scope:** F-06..F-11, attachments, multi-stage, admin, analytics, notifications.

### 10.2 Sprint 2 (Deliverable 2 — 29 Nov 2026)
* **Goal:** core expansion ตาม engineering contracts: audit view, return/resubmission, multi-stage approval, attachments.
* **Features:** F-05 (view), F-06, F-07, F-08.
* **Dependencies:** F-04 → F-06 → F-07; F-02 → F-08; F-05 ต้องมี history จาก S1.
* **Completion outcome:** Sprint 2 contracts/AC/STS ครบ; integrated, tested, reviewed increment; deployed candidate ผ่าน Lab 5 pipeline; updated traceability.

### 10.3 Sprint 3 (Final — 13 Dec 2026; progress at 29 Nov)
* **Goal:** completion/hardening: search/filter/reporting, admin management, security/performance, regression, UAT fixes, final release.
* **Features:** F-09, F-10, F-11.
* **Dependencies:** F-05 → F-09; F-01/F-04 → F-10; F-01..F-10 → F-11.
* **Completion outcome:** final release on `main` + deployed GCP version; complete traceability with actual results; UAT/re-test records; final PDF + demo video.

### 10.4 Exam-period finish plan & remaining-work template
* 29 Nov: product ควร substantially complete; Sprint 2 complete, Sprint 3 มี meaningful implemented progress.
* 1–11 Dec: bounded fixes, integration, regression, UAT re-test, documentation, video — ห้าม reserve main workflows ไว้ช่วงท้าย.
* 13 Dec: final release, PDF, video due.
* Remaining-work table: `Feature/Defect ID | Status (Planned/In Progress/Implemented/Tested/Accepted) | Missing AC/verification | Owner | Dependency | Target date | Evidence`.

### 10.5 Risks & mitigations
| Risk | Mitigation |
| :--- | :--- |
| Scope creep (multi-stage/attachments) | ยึด Sprint allocation; เปลี่ยน scope ต้องมี approved change record |
| Auth/assignment bugs | Contract E0/E2 + negative tests + review by teammate |
| E2E flakiness | ใช้ stable seed/reset DB; จำกัด E2E 3 journeys; retry policy documented |
| PostgreSQL setup ต่างเครื่อง | Docker compose + README + migration/seed commands |
| Exam period | freeze scope 29 Nov; remaining-work list + daily check |
| Secrets leak | `.env` ignore, `.env.example`, secret scan before submission |

---

## 11. Part E — Sprint 1 Engineering Contracts

> ทุก contract ต้อง commit ก่อน implementation และเก็บ version history; การแก้ไขต้องมีเหตุผล ไม่ rewrite history

### 11.1 Contract E0 — F-01 Auth & Session
| Field | Value |
| :--- | :--- |
| Feature ID | F-01 |
| Linked requirements | FR-01, NFR-01, NFR-04 |
| Owner / Reviewer | T / Oum |
| Artifact | `docs/sprints/sprint-1/feature-00-auth.md` |
| Status | v1.0 pre-implementation → v1.1 reviewed |

**Feature SDS:** login/logout/current-user; credential verification; JWT cookie lifecycle; role load; 401/403 behavior; no password leakage.
**UI spec:** `LoginPage` fields email/password, inline validation, loading, invalid-credential error, redirect by role; logout button clears session.
**API spec:**

| Endpoint | Request | Success | Errors |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | `{email,password}` | 200 `{data:{user:{id,email,name,role}}}` + Set-Cookie | 400 `VALIDATION_ERROR`; 401 `UNAUTHORIZED` |
| `POST /api/auth/logout` | — | 200 `{data:{message}}` + clear cookie | 401 `UNAUTHORIZED` |
| `GET /api/auth/me` | cookie | 200 `{data:{user}}` | 401 `UNAUTHORIZED` |
**Data spec:** `User` fields; `passwordHash` bcrypt; seed upsert; no schema change beyond foundation.
**AC:** AC-AUTH-01 valid login; AC-AUTH-02 invalid login; AC-AUTH-03 me/logout/unauth; AC-AUTH-04 forbidden role; AC-AUTH-05 hash/JWT expiry.
**STS:**

| Test ID | AC | Level | Preconditions/input | Action | Expected |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-AUTH-01 | AC-AUTH-01 | API integration | seeded user | POST valid login | 200, cookie httpOnly, no passwordHash |
| TEST-AUTH-02 | AC-AUTH-02 | API integration | wrong password/unknown email | POST login | 401 `UNAUTHORIZED`, no cookie |
| TEST-AUTH-03 | AC-AUTH-03 | API integration | logged-in/no-cookie | GET /me; POST logout; GET /me | 200 then 401 |
| TEST-AUTH-04 | AC-AUTH-04 | API integration | REQUESTER cookie | GET /pending or POST review | 403 `FORBIDDEN` |
| TEST-AUTH-05 | AC-AUTH-05 | Unit/config | DB row; JWT | inspect hash; decode exp | `$2` prefix; exp−iat=8h |
**DoD:** contract committed; tests implemented/pass; no secrets; PR reviewed; docs updated; evidence captured.

### 11.2 Contract E1 — F-02 Request Creation + F-03 My Requests & Data Isolation
| Field | Value |
| :--- | :--- |
| Feature IDs | F-02, F-03 |
| Linked requirements | FR-02, FR-03, BR-03, BR-04, BR-05, NFR-03, NFR-04 |
| Owner / Reviewer | Oum / T |
| Artifact | `docs/sprints/sprint-1/feature-01.md` |
| Status | v1.0 pre-implementation → v1.1 reviewed |

**Feature SDS:** create request → validate → generate requestNo → assign reviewer → persist PENDING + history SUBMITTED → list/detail own requests; reject invalid payload and cross-user access.
**UI spec:** `NewRequestPage` fields title/amount/category/description with validation messages, submit loading/error/success; `MyRequestsPage` table (requestNo/title/amount/category/status/createdAt) with empty/loading/error; `RequestDetailPage` shows fields + history, forbidden state for non-owner.
**API spec:**

| Endpoint | Request | Success | Errors |
| :--- | :--- | :--- | :--- |
| `POST /api/requests` | `{title,amount,category,description}` | 201 `{data:{request}}` | 400 `VALIDATION_ERROR`; 401 `UNAUTHORIZED` |
| `GET /api/requests/my` | cookie | 200 `{data:{requests:[...]}}` | 401 `UNAUTHORIZED` |
| `GET /api/requests/:id` | cookie | 200 `{data:{request,histories}}` | 401; 403 `ACCESS_DENIED`; 404 `NOT_FOUND` |
**Data spec:** `ApprovalRequest` fields/constraints; `requestNo` unique; `assignedReviewerId` required at creation; `ApprovalHistory` SUBMITTED entry; no new migration beyond foundation.
**AC:** AC-01 create success; AC-02 validation/boundaries; AC-03 my list; AC-04 cross-user/unauth; AC-04b persistence.
**STS:**

| Test ID | AC | Level | Preconditions/input | Action | Expected |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-01 | AC-01 | API/DB integration | authenticated user, valid payload | POST /requests | 201, PENDING, requestNo unique, assigned reviewer, history SUBMITTED |
| TEST-02 | AC-02 | API integration | amount 0/-1/too large; title 2/151; bad category; empty description | POST /requests | 400 `VALIDATION_ERROR`, no new row |
| TEST-03 | AC-03 | API integration | user A has 2 requests, user B has 1 | GET /requests/my as A | only A's requests, sorted desc |
| TEST-04 | AC-04 | API integration | user A cookie; request owned by B | GET /requests/:id | 403 `ACCESS_DENIED`; no private data |
| E2E-01 | AC-01/03 | E2E | seeded requester | create via UI → my requests → open detail | persisted result visible |
**DoD:** contract committed; tests pass; review; docs; no secrets; known limitations recorded.

### 11.3 Contract E2 — F-04 Review Queue & Decision + F-05 History write
| Field | Value |
| :--- | :--- |
| Feature IDs | F-04, F-05 |
| Linked requirements | FR-04, FR-05, FR-06, BR-01, BR-02, BR-05, BR-06, BR-07, NFR-01, NFR-04 |
| Owner / Reviewer | T / Oum |
| Artifact | `docs/sprints/sprint-1/feature-02.md` |
| Status | v1.0 pre-implementation → v1.1 reviewed |

**Feature SDS:** assigned reviewer views pending queue → opens detail → approve/reject with comment → check role/self/assignment/state/decision → transactional update + history append → UI reflects status/history; reject invalid transitions/forbidden access.
**UI spec:** `PendingReviewsPage` assigned queue with empty/loading/error; `ReviewDetailPage` request details, approve/reject radio, comment box (required for reject), submit loading, error banner with code, success state; no optimistic status.
**API spec:**

| Endpoint | Request | Success | Errors |
| :--- | :--- | :--- | :--- |
| `GET /api/requests/pending` | cookie | 200 `{data:{requests:[...]}}` | 401; 403 `FORBIDDEN` |
| `POST /api/requests/:id/review` | `{decision:"APPROVE"|"REJECT",comment?}` | 200 `{data:{request,history}}` | 400 `INVALID_STATE_TRANSITION`; 400 `VALIDATION_ERROR`; 401; 403 `SELF_APPROVAL_NOT_ALLOWED`; 403 `ACCESS_DENIED`; 403 `FORBIDDEN` |
**Data spec:** update `ApprovalRequest.status/updatedAt`; insert `ApprovalHistory` actor/action/comment; transaction; no new migration beyond foundation; history append-only.
**AC:** AC-05 assigned pending; AC-06 approve/reject+history; AC-07 self-approval; AC-08 invalid state; AC-09 unrelated reviewer; AC-10 requester forbidden; AC-11 history append-only/persistence; AC-12 decision validation.
**STS:**

| Test ID | AC | Level | Preconditions/input | Action | Expected |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-05 | AC-05 | API integration | requests assigned to R1/R2 | GET /pending as R1 | only R1 PENDING |
| TEST-06 | AC-06 | API/DB integration | assigned PENDING request | POST review APPROVE | 200, APPROVED, history APPROVED |
| TEST-07 | AC-06 | API/DB integration | assigned PENDING request | POST review REJECT + comment | 200, REJECTED, history with comment |
| TEST-08 | AC-07 | API/DB integration | REVIEWER owns request | POST review own request | 403 `SELF_APPROVAL_NOT_ALLOWED`, no status change |
| TEST-09 | AC-08 | API integration | request already APPROVED/REJECTED | POST review again | 400 `INVALID_STATE_TRANSITION`, no history |
| TEST-10 | AC-10 | API integration | REQUESTER cookie | POST review | 403 `FORBIDDEN` |
| TEST-11 | AC-09 | API integration | REVIEWER not assigned | POST review | 403 `ACCESS_DENIED` |
| TEST-12 | AC-12 | API integration | bad decision; REJECT no comment | POST review | 400 `VALIDATION_ERROR` |
| TEST-13 | AC-11 | API/DB integration | existing history; restart | attempt update/delete (no endpoint) + restart | history unchanged, persisted |
| E2E-02 | AC-06 | E2E | assigned reviewer | approve via UI → status/history | APPROVED visible |
| E2E-03 | AC-07 | E2E | hybrid reviewer owns request | try approve via UI | error `SELF_APPROVAL_NOT_ALLOWED` |
**DoD:** contract committed; tests pass; review; docs; no secrets; limitations recorded; release tag.

### 11.4 AC → Test coverage matrix (Sprint 1)
| AC | Test(s) | Level |
| :--- | :--- | :--- |
| AC-AUTH-01..05 | TEST-AUTH-01..05 | Unit/API integration |
| AC-01 | TEST-01, E2E-01 | API/DB integration, E2E |
| AC-02 | TEST-02 | API integration (negative/boundary) |
| AC-03 | TEST-03, E2E-01 | API integration, E2E |
| AC-04, AC-04b | TEST-04, restart check | API integration, DB |
| AC-05 | TEST-05 | API integration |
| AC-06 | TEST-06, TEST-07, E2E-02 | API/DB integration, E2E |
| AC-07 | TEST-08, E2E-03 | API/DB integration, E2E |
| AC-08 | TEST-09 | API integration |
| AC-09 | TEST-11 | API integration |
| AC-10 | TEST-10 | API integration |
| AC-11 | TEST-13 | API/DB integration |
| AC-12 | TEST-12 | API integration |

### 11.5 Product Definition of Done (Sprint 1)
- [ ] Required behavior implemented ตาม contract และไม่มี scope ที่ประกาศแล้วขาดหาย
- [ ] ทุก AC มี automated test อย่างน้อย 1 ตัว; selected critical journey มี E2E
- [ ] Build/test ผ่านบน commit ที่ส่ง; required tests ไม่ถูก skip/disable; failed/skipped ถูก disclose
- [ ] Teammate review ครบ; PR เข้า staging และ release PR เข้า main; authors ไม่ approve ตัวเอง
- [ ] SRS/features/traceability/SDS/sprint plan/contracts/README อัปเดตตรงกับโค้ด
- [ ] Migration/seed รันจาก clean DB ได้; demo accounts ใช้ได้
- [ ] ไม่มี real secret/password/token ใน Git หรือ PDF
- [ ] Known limitations, incomplete work และ technical debt ถูกบันทึก
- [ ] Release tag/commit ถูกบันทึกและอ้างอิงใน PDF

### 11.6 Contract version history & TDD sequence (ต้องมีหลักฐาน)
| Contract | Version | Date | Change | Reason | Commit/PR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| E0 | v1.0 | 5 Nov | initial auth contract | baseline | `<commit>` |
| E1 | v1.0 | 6 Nov | initial requester contract | baseline | `<commit>` |
| E2 | v1.0 | 7 Nov | initial reviewer contract | baseline | `<commit>` |
| E2 | v1.1 | 7 Nov | add BR-05 assignment/unrelated reviewer | review finding | `<commit>` |

**TDD evidence:** commit test ที่ fail (Red) ก่อน implementation; commit implementation; test pass (Green); ระบุ commit/date และแนบ screenshot/output. ห้ามแก้ test ให้ผ่านทั้งที่ behavior ผิด.

---

## 12. Part F — Working Sprint 1 & Verification Evidence

### 12.1 Program demonstrations (must be in PDF with captions)
| Scenario | Feature/AC | Role | Steps | Expected | Actual / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Normal journey | F-02/F-03/F-04, AC-01/03/06 | Requester → Reviewer | login → create request → view my requests → reviewer approve → requester retrieves status/history | persisted PENDING → APPROVED with history | screenshots + API/DB retrieval |
| Business-rule/boundary rejection | AC-02/AC-08/AC-12 | Requester/Reviewer | invalid amount/title; review decided request; reject without comment | 400 `VALIDATION_ERROR` / `INVALID_STATE_TRANSITION` | screenshots + response body |
| Forbidden access | AC-04/AC-07/AC-09/AC-10/AC-AUTH-03/04 | Requester/Reviewer | no cookie; requester calls review; unrelated reviewer; self-approval; logout then /me | 401 / 403 specific code | API test output + screenshots |

### 12.2 Build & automated test results
* Commands: `npm run build && npm test` (และ `npx playwright test` สำหรับ E2E); tested commit `<hash>`.
* Include passing/failing/skipped counts and test file names.
* AC→test results table: `AC | Test ID | Test File/Name | Level | Result | Commit`.
* Embed 2 actual test excerpts: (1) domain rule BR-01; (2) access restriction BR-03/BR-05.
* TDD red/green: show failing test before implementation and passing after, with commit/date.
* Report every failed/skipped test; do not disable/weaken required tests.

### 12.3 Git, Issue, PR & release evidence
| Evidence | Required content |
| :--- | :--- |
| Issues | #1 auth, #2 requester, #3 reviewer; link FR/BR/Feature/Contract; board status |
| PRs | #0 auth, #1 requester, #2 reviewer; author/reviewer; substantive review comment; merge to staging |
| Release PR | staging → main; final test run; reviewed; release tag `v0.1.0-sprint1` |
| History table | Issue → branch → PR → reviewer → merge commit/date → release tag |
| Board | final status screenshot/export |
| Contribution | Oum/T tasks; pair work identified; not necessarily equal commits |
| AI-use | tools used + tasks assisted (short declaration) |
| Limitations | known incomplete work, failed/skipped tests, technical debt |

### 12.4 Setup summary & README requirements
README must include: Node/package manager versions; install; `.env.example`; PostgreSQL setup (port 5434/container); migration (`npx prisma migrate dev` / `deploy`); seed (`npx prisma db seed`); run client/server; build; test (unit/API/E2E); demo accounts; troubleshooting. Part F PDF must include a concise setup summary so TA can understand without opening README. Use synthetic data; no real secrets.

### 12.5 PDF assembly & navigation
* One self-contained PDF per team, Parts A–F in order, with table of contents/page numbers.
* Beginning: both names/IDs, theme/context, repo URL, submitted release tag/commit.
* Each Part includes the actual document content (not just links); screenshots/tables readable.
* Navigation table maps Part → page range → key IDs (FR/BR/NFR/F/AC/TEST).
* Selected execution evidence in Part F per §12.1–12.4; label each scenario with IDs, role, preconditions, steps, expected/actual, version.
* No real passwords/tokens/secrets in PDF or Git.

### 12.6 Known limitations & disclosure
* ADMIN role/endpoints deferred to Sprint 3.
* No attachments/multi-stage/return-for-revision in Sprint 1.
* Stateless JWT: logout clears cookie but token remains valid until expiry if stolen; server-side revocation deferred.
* No email/SMS/payment/bank integration; synthetic data only.
* Any failed/skipped tests or incomplete AC must be listed honestly; do not label planned work as passing.

---

## 13. Definition of Done & Verification Matrix

### 13.1 Product-level DoD checklist
- [ ] Required behavior implemented and integrated across UI/API/DB.
- [ ] All baseline FR/BR/NFR mapped to feature/sprint and verified or explicitly planned.
- [ ] Automated tests meaningful, enabled, passing on submitted commit; E2E selected journeys pass.
- [ ] Backend authorization/ownership/assignment enforced and tested.
- [ ] Persistence/durability verified (restart/redeploy).
- [ ] Reviewed PRs, staging integration, release PR, tag/commit recorded.
- [ ] Documents/README/config current; no secrets.
- [ ] Known limitations, failed/skipped tests and debt disclosed.

### 13.2 NFR verification matrix
| NFR | Target | Actual / method | Result | Sprint |
| :--- | :--- | :--- | :--- | :---: |
| NFR-01 | bcrypt 12; JWT 8h; cookie flags; no plaintext | code review + TEST-AUTH-01..05 + secret scan | Pending/Pass | S1 |
| NFR-02 | p95 < 300 ms / 50 requests | timing script + recorded output | Pending/Pass | S1/S3 |
| NFR-03 | data survives restart; migrate+seed reproducible | restart test + clean DB run | Pending/Pass | S1/Lab5 |
| NFR-04 | invalid inputs → 4xx with code | negative/boundary tests | Pending/Pass | S1 |
| NFR-05 | 100% AC mapped/tested | traceability matrix + test run | Pending/Pass | S1 |
| NFR-06 | Docker/env/health | Docker build/run + env check | Pending/Pass | Lab5 |

### 13.3 Coverage gaps & approved changes
* Later-sprint FR-07..FR-11: planned, not yet implemented; do not mark as done.
* Any scope change must be recorded in the approved change log (§8.3) with impacted AC/TEST/SDS.
* If a Sprint 1 AC cannot be completed, record it as incomplete with reason and next action; do not silently remove it.

### 13.4 Final consistency checks before submission
- [ ] Role matrix ตรงกับ BR-01/BR-05 และ test จริง (reviewer สร้างคำขอได้; requester review ไม่ได้)
- [ ] Schema/API/AC/STS ใช้ชื่อ field, error code และ path ตรงกัน 100%
- [ ] ทุก AC มี test ID และทุก test ID อ้าง AC; ไม่มี orphan test/AC
- [ ] Build/test commands ใน README ตรงกับที่ใช้เก็บผล
- [ ] PDF มี Parts A–F ครบ, navigation table ถูกหน้า, และ evidence ระบุ commit/tag
- [ ] ไม่มี secret จริงใน repo/PDF; seed accounts เป็น synthetic

---

## 14. Submission Readiness Checklist (ตรวจก่อนกดส่ง)

- [ ] Repository เข้าถึงได้ และมี Release Tag `v0.1.0-sprint1` บน branch `main`
- [ ] มี GitHub Issues #1–#3 + Project board ที่ link FR/BR/Feature/Contract และ final status ชัดเจน
- [ ] มีหลักฐาน PR #0/#1/#2 บน GitHub ที่ตรวจโดยเพื่อนร่วมทีม (ห้าม Self-Approve) + release PR staging → main
- [ ] โค้ดรัน Local Setup ผ่านได้จริงตามคำสั่งใน README (dependency, env, migration, seed, build, test)
- [ ] ระบบมี Authentication จริง (login/logout/me) และมี 2 Roles (`REQUESTER`, `REVIEWER`)
- [ ] REVIEWER สร้างคำขอเองได้ และถูกบล็อกเมื่อพยายาม self-approve (HTTP 403 `SELF_APPROVAL_NOT_ALLOWED`)
- [ ] มี reviewer assignment + ทดสอบ unrelated reviewer (HTTP 403 `ACCESS_DENIED`)
- [ ] มีการบังคับกฎ data isolation/cross-user access และ requester forbidden review ที่ Backend จริง
- [ ] มี Automated Tests ครบทุก AC (unit/API/DB integration + selected E2E) และรันผ่าน 100% บน commit ที่ส่ง
- [ ] มีตาราง AC → Test ID → Test File/Name → Result → Commit และแนบ test snippets 2 ตัว
- [ ] มีหลักฐาน TDD Red→Green (test fail ก่อน implement, pass หลัง implement) พร้อม commit/date
- [ ] Contracts E0/E1/E2 มี Feature SDS, UI/API/data spec, AC, STS, DoD และ version history ครบ
- [ ] SRS มี FR-01..FR-11, BR-01..BR-07, NFR-01..NFR-06 พร้อม target/วิธีวัด/assumptions/decisions
- [ ] Feature Inventory F-01..F-11 + Traceability Matrix + coverage gaps/approved changes ครบ
- [ ] System SDS มี architecture, data model, UI/API conventions, role matrix, token lifecycle, deploy design
- [ ] Three-sprint plan มี goal, feature IDs, dependencies, completion outcome และ exam-period plan
- [ ] Part F มี screenshots ครบ normal journey (UI/API/DB retrieval), rule rejection, forbidden access + captions/IDs
- [ ] มี Contribution Table, AI-Use Declaration, Known Limitations/Failed/Skipped Tests
- [ ] เล่ม PDF เป็น self-contained Parts A–F ตามลำดับ + TOC/Navigation Table ที่มีเลขหน้าจริง
- [ ] หน้าแรกมีชื่อ/รหัสนักศึกษา, theme, repo URL, release tag/commit
- [ ] ไม่มีรหัสผ่านจริง, Token จริง หรือ Secret หลุดเข้าไปใน Git หรือ PDF; seed accounts เป็น synthetic
