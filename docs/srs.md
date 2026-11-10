# Software Requirements Specification (SRS)

> **CPE 334 Deliverable 1 — Part A**  
> **Project:** Corporate Expense & Purchase Request Approval System  
> **Theme:** Theme 5 — Workflow and Approval System  
> **Authors:** Oum (67070501075) & T (67070501021)  
> **Status:** Baseline Released (Sprint 1)

---

## 1. Stakeholder Problem & Chosen Context

องค์กรประสบปัญหาความล่าช้าและความผิดพลาดในการขออนุมัติค่าใช้จ่ายและสั่งซื้ออุปกรณ์ (Expense & Purchase Request) เนื่องจากเดิมใช้กระดาษและแชตข้อความ ทำให้:
1. ติดตามสถานะของคำขอไม่ได้ (No Request Visibility)
2. ตรวจสอบย้อนหลังไม่ได้ว่าใครเป็นผู้อนุมัติ และอนุมัติเมื่อใด (No Audit Trail)
3. **ไม่มีการป้องกันผลประโยชน์ทับซ้อน (Conflict of Interest):** ผู้บริหารหรือพนักงานที่ยื่นคำขอสามารถกดอนุมัติคำขอของตนเองได้ (Self-Approval)

ผลิตภัณฑ์นี้เป็น **Workflow and Approval System** สำหรับคำขอเบิกงบและจัดซื้อภายในองค์กร โดยมีบทบาทหลักคือ Requester, Reviewer และ Admin (ในอนาคต)

---

## 2. Actors & Responsibilities

| Actor | Responsibility | Sprint 1 Scope |
| :--- | :--- | :---: |
| **Requester** | ล็อกอินเข้าสู่ระบบ, สร้างคำขอเบิกงบ/จัดซื้อ, ตรวจสอบรายการคำขอของตนเอง, ดูสถานะและประวัติการตัดสิน; ห้ามใช้ฟังก์ชันของ Reviewer | Yes |
| **Reviewer** | ดูรายการคำขอรอพิจารณา (`PENDING`) เฉพาะที่ถูก assign ให้ตน, กด `APPROVE` หรือ `REJECT` พร้อมระบุเหตุผล; สามารถสร้างคำขอของตนเองได้ แต่ **ห้ามอนุมัติคำขอของตนเองเด็ดขาด** | Yes |
| **Admin** | จัดการผู้ใช้, กำหนดบทบาท, และจัดการ Reviewer Assignment (มีใน enum เพื่อรองรับ Sprint 3; ไม่มี endpoint ใน Sprint 1) | No (Sprint 3) |
| **System** | ออกรหัส `requestNo`, มอบหมาย reviewer ตามหมวดหมู่, บังคับใช้ Business Rules, บันทึกประวัติ history แบบ append-only, จัดการ validation/errors | Yes |

---

## 3. Product Scope & Explicit Exclusions

### 3.1 In Scope (Whole Product Baseline)
- การสร้างและติดตามคำขอ (Request creation & tracking)
- คิวงานและการตัดสินใจของผู้อนุมัติ (Review queue & decision workflow)
- การมอบหมายผู้อนุมัติ (Reviewer assignment)
- การบันทึกประวัติการอนุมัติแบบ Append-only (Approval history & audit trail)
- การส่งกลับเพื่อแก้ไขและการยื่นใหม่ (Return for revision & resubmission - Sprint 2)
- การอนุมัติหลายระดับขั้น (Multi-stage approval - Sprint 2)
- การแนบไฟล์หลักฐาน (Attachments - Sprint 2)
- การค้นหา คัดกรอง และรายงานสรุป (Search, filter & reporting - Sprint 3)
- การจัดการผู้ใช้และการมอบหมายงานโดย Admin (Admin user & assignment management - Sprint 3)
- การทดสอบและการเตรียมพร้อมสำหรับการ deploy (Hardening, regression & Docker/GCP deployment)

### 3.2 Sprint 1 Slice (Delivered in this Release)
- **F-01:** Authentication & Session (Login/Logout/Current User with HTTP-only cookie)
- **F-02:** Request Creation (Validation, requestNo generation, reviewer assignment)
- **F-03:** My Requests & Data Isolation (ดูรายการเฉพาะของตนเอง)
- **F-04:** Review Queue & Decision (Approve/Reject with comment, Self-Approval Guard, State Guard)
- **F-05:** Approval History write (บันทึก transaction พร้อมสถานะ)

### 3.3 Explicit Exclusions (สิ่งที่ยังไม่ทำใน Sprint 1)
- ไม่มีระบบตัดเงินหรือ Payment Gateway จริง
- ไม่มีการส่งแจ้งเตือนผ่านภายนอกจริง (No external SMS, Email, or Slack/Teams)
- ไม่มีการเชื่อมต่อบัญชีธนาคารจริง (Bank integration)
- ไม่รองรับหลายสกุลเงิน (รองรับเฉพาะเงินบาท THB)
- ไม่มีการลงทะเบียนผู้ใช้ด้วยตนเอง (Self-registration) หรือการกู้คืนรหัสผ่าน (Password recovery) — ใช้ Seed demo accounts
- ไม่มีการแนบไฟล์ (Attachments) ใน Sprint 1 (เลื่อนไป Sprint 2)
- ไม่มีการส่งกลับเพื่อแก้ไข (Return for revision) ใน Sprint 1 (เลื่อนไป Sprint 2)
- ไม่มีการอนุมัติหลายขั้น (Multi-stage approval) ใน Sprint 1 (เลื่อนไป Sprint 2)
- ไม่มีแดชบอร์ดสรุปสถิติสำหรับผู้บริหาร (Executive dashboard) ใน Sprint 1 (เลื่อนไป Sprint 3)
- ไม่มีการใช้ข้อมูลส่วนบุคคลจริงหรือ Secret จริงบน Production (ใช้ synthetic data)

---

## 4. Functional Requirements (FR)

| ID | Requirement (Observable Behavior) | Sprint | Planned Verification |
| :--- | :--- | :---: | :--- |
| **FR-01** | ผู้ใช้สามารถ login, logout และดูข้อมูล current user ผ่าน cookie session ได้; หากไม่ authenticate จะถูกปฏิเสธเมื่อเข้าถึง protected endpoint | S1 | AC-AUTH-01..05 / TEST-AUTH-01..05 |
| **FR-02** | ผู้ใช้ที่ยืนยันตัวตนแล้วสามารถสร้างคำขอใหม่โดยระบุ title, amount, category, description; ระบบตรวจสอบความถูกต้อง, สร้าง requestNo, ตั้งสถานะ PENDING และ assign reviewer | S1 | AC-01, AC-02 / TEST-01, TEST-02 |
| **FR-03** | Requester สามารถดูรายการคำขอของตนเองและดูรายละเอียดสถานะพร้อมประวัติการพิจารณาได้ | S1 | AC-03, AC-04 / TEST-03, TEST-04 |
| **FR-04** | Assigned Reviewer สามารถดูคิวคำขอรอพิจารณา (PENDING) และทำการ APPROVE หรือ REJECT พร้อมบันทึก comment ได้; ระบบเปลี่ยนสถานะและบันทึกประวัติ | S1 | AC-05..AC-12 / TEST-05..TEST-13 |
| **FR-05** | ระบบบันทึกประวัติการตัดสินใจแบบ Append-only (ผู้ทำรายการ, การกระทำ, comment, วันเวลา) และมี audit view | S1 (write) / S2 (view) | AC-06, AC-11 / TEST-06, TEST-13 |
| **FR-06** | ระบบมอบหมาย reviewer ให้คำขอแต่ละใบ; เฉพาะ reviewer ที่ได้รับมอบหมายเท่านั้นที่ตัดสินได้; Admin สามารถแก้ไข assignment ได้ในอนาคต | S1 (assign) / S3 (admin) | AC-05, AC-09 / TEST-05, TEST-11 |
| **FR-07** | Reviewer สามารถส่งคำขอกลับให้แก้ไข (RETURNED); Requester สามารถแก้ไขและ resubmit ได้ | S2 | Planned S2 Contract |
| **FR-08** | รองรับการอนุมัติหลายระดับขั้น (Multi-stage Approval) พร้อมบันทึกประวัติแยกแต่ละ stage | S2 | Planned S2 Contract |
| **FR-09** | รองรับการแนบไฟล์เอกสารประกอบคำขอ พร้อมระบบควบคุมสิทธิ์การเข้าถึงไฟล์ | S2 | Planned S2 Contract |
| **FR-10** | ค้นหา คัดกรองคำขอ และออกรายงานสรุปยอดงบประมาณตามสถานะและหมวดหมู่ | S3 | Planned S3 Contract |
| **FR-11** | Admin สามารถจัดการบัญชีผู้ใช้, บทบาท, และ reviewer assignment ได้ | S3 | Planned S3 Contract |

---

## 5. Business Rules (BR)

| ID | Rule & Domain Constraint | Failure Behavior | Sprint |
| :--- | :--- | :--- | :---: |
| **BR-01** | **No Self-Approval:** ผู้ยื่นคำขอห้ามอนุมัติหรือปฏิเสธคำขอที่ตนเองสร้างขึ้นเด็ดขาด แม้ผู้ใช้นั้นจะมีบทบาทเป็น REVIEWER หรือ ADMIN | 403 `SELF_APPROVAL_NOT_ALLOWED` (ตรวจสอบก่อน assignment check) | S1 |
| **BR-02** | **Valid State Lifecycle:** คำขอเริ่มต้นที่สถานะ `PENDING`; สามารถเปลี่ยนสถานะได้เพียงทางเดียวไปยัง `APPROVED` หรือ `REJECTED`; ห้ามเปลี่ยนสถานะคำขอที่ตัดสินไปแล้ว | 400 `INVALID_STATE_TRANSITION` | S1 |
| **BR-03** | **Data Isolation:** Requester สามารถดูได้เฉพาะคำขอของตนเองเท่านั้น; Reviewer ดูได้เฉพาะคำขอที่ได้รับมอบหมาย (หรือคำขอของตนเอง) | 403 `ACCESS_DENIED` | S1 |
| **BR-04** | **Payload Validation:** `title` ต้องมีความยาว 3–150 ตัวอักษร (หลัง trim); `amount` ต้องเป็นจำนวนบวก > 0 และไม่เกิน 9,999,999,999.99 (Decimal(12,2)); `category` ต้องอยู่ใน whitelist; `description` ต้องมีความยาว 1–1,000 ตัวอักษร | 400 `VALIDATION_ERROR` | S1 |
| **BR-05** | **Reviewer Assignment:** คำขอทุกใบต้องมี assigned reviewer; เฉพาะ reviewer ที่ได้รับมอบหมายเท่านั้นที่มีสิทธิ์ตัดสินคำขอ | 403 `ACCESS_DENIED` | S1 |
| **BR-06** | **Append-Only History:** ทุกการกระทำ (submit/approve/reject) ต้องเพิ่ม record ใหม่ลง `ApprovalHistory` เท่านั้น ห้ามแก้ไขหรือลบ; การอัปเดตสถานะและเพิ่ม history ต้องทำใน transaction เดียวกัน | ห้ามมี API แก้ไข/ลบ; Rollback ทั้งหมดหากผิดพลาด | S1 |
| **BR-07** | **Decision Validation:** การตัดสินต้องเป็น `APPROVE` หรือ `REJECT` เท่านั้น; กรณี `REJECT` บังคับต้องระบุ comment ความยาว 3–500 ตัวอักษร; กรณี `APPROVE` ระบุ comment ได้ไม่เกิน 500 ตัวอักษร | 400 `VALIDATION_ERROR` | S1 |

---

## 6. Non-Functional Requirements (NFR)

| ID | Category | Measurable Target | Verification Method | Sprint Allocation |
| :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | Security | รหัสผ่าน hash ด้วย bcrypt cost 12; JWT เซ็นด้วย HS256 อายุ 8 ชม.; จัดเก็บใน HTTP-only Lax Cookie; ไม่มี plaintext password หรือ secret หลุดใน Git/Response | Code Inspection + TEST-AUTH-01..05 + Secret scan | S1 (Recheck Lab 5) |
| **NFR-02** | Performance | เวลาตอบสนอง p95 < 300 ms สำหรับ API ทั้งหมดใน Sprint 1 ภายใต้ local load 50 concurrent requests (warm DB); การดึงรายการไม่เกิดปัญหา N+1 queries | Supertest execution timer / autocannon script | S1 Baseline; S3 Recheck |
| **NFR-03** | Persistence & Durability | ข้อมูลคำขอและประวัติทั้งหมดต้องคงอยู่หลัง restart เซิร์ฟเวอร์; รัน database migration และ idempotent seed ได้ซ้ำจากฐานข้อมูลเปล่า | Restart verification test + `prisma migrate reset` + seed script | S1; Lab 5 Deployment |
| **NFR-04** | Validation & Error Safety | 100% ของ invalid payload ส่งคืน status 4xx พร้อมรหัส error code มาตรฐาน; ห้ามส่งคืน stack trace หรือ 500 สำหรับข้อผิดพลาดที่คาดหมายได้ | Negative & boundary unit/integration tests | S1 |
| **NFR-05** | Testability & Traceability | 100% ของ Sprint 1 Acceptance Criteria (AC) ต้องมี automated test รองรับอย่างน้อย 1 ตัว; Critical journeys มี Playwright E2E | Traceability matrix cross-check + Vitest coverage | S1 |
| **NFR-06** | Deployability & Config | สามารถรันผ่าน Docker container โดยอ่านค่าผ่าน environment variables ทั้งหมด, ไม่มี hardcoded secret, มี endpoint `/api/health` สำหรับ probe | Docker build/run test + env inspection | Design in S1; Verify Lab 5 |

---

## 7. Assumptions, Decisions & Open Questions

| ID | Type | Title | Description & Rationale |
| :--- | :---: | :--- | :--- |
| **D-01** | Decision | Theme Selection | เลือก Theme 5: Workflow and Approval System (Oum รหัสลงท้าย 5, T รหัสลงท้าย 1) |
| **D-02** | Decision | Reviewer Can Create Requests | ให้ผู้ใช้ Role `REVIEWER` สามารถยื่นคำขอได้ เพื่อให้สามารถจำลองและทดสอบกฎ BR-01 (No Self-Approval) ได้อย่างสมจริง |
| **D-03** | Decision | Category-Based Reviewer Assignment | Sprint 1 มอบหมายผู้อนุมัติตามหมวดหมู่: `EQUIPMENT/TRAVEL` → T Reviewer, `SOFTWARE/SUPPLIES` → Manager Hybrid เพื่อให้ผลการทดสอบ deterministic |
| **D-04** | Decision | ADMIN Role Deferred | Role `ADMIN` มีใน schema enum แต่ยังไม่มี endpoint หรือ seed ใน Sprint 1 เพื่อคุมขอบเขตงาน |
| **D-05** | Assumption | Currency & Precision | ใช้สกุลเงินบาท (THB) สกุลเดียว; ยอดเงินใช้ประเภท `Decimal(12,2)` เพื่อป้องกัน floating-point precision error |
| **D-06** | Decision | Category Whitelist | กำหนดหมวดหมู่ 4 ประเภท: `EQUIPMENT`, `TRAVEL`, `SOFTWARE`, `SUPPLIES` เพื่อความชัดเจนในการ validate และ route งาน |
| **D-07** | Decision | No File Upload in Sprint 1 | เลื่อนระบบไฟล์แนบไปทำใน Sprint 2 ตามข้อตกลง baseline |
| **D-08** | Assumption | Synthetic Demo Data Only | ไม่เชื่อมต่อ payment, SMS, email จริง ใช้ข้อมูลจำลองทั้งหมดตามเกณฑ์วิชา |
| **D-09** | Decision | Stateless JWT in Cookie | Logout กระทำโดยการสั่งล้าง cookie ฝั่ง client; ยังไม่มี server-side token blacklist ใน Sprint 1 (บันทึกเป็น Known Limitation) |
| **D-10** | Decision | Request Number Format | รหัสคำขอใช้รูปแบบ `REQ-YYYYMMDD-NNNN` พร้อม Unique constraint และ retry loop เพื่อป้องกันเลขซ้ำ |
| **D-11** | Decision | Comment Requirement on Rejection | บังคับต้องมี comment เมื่อ Reject เพื่อรักษามาตรฐาน audit trail; ขณะที่ Approve ให้ comment เป็น optional |
| **D-12** | Decision | Assigned Queue Only | Reviewer จะมองเห็นเฉพาะคิวที่ได้รับมอบหมายเท่านั้น ไม่เห็นคำขอทั้งหมดขององค์กร เพื่อความปลอดภัยของข้อมูล |
| **D-13** | Assumption | Demo Credentials | บัญชีทดสอบทุกบัญชีใช้รหัสผ่าน `Password123!` สำหรับ local development เท่านั้น |
| **D-14** | Decision | Atomic Status & History Update | การเปลี่ยนสถานะคำขอและการบันทึกประวัติต้องทำภายใน `prisma.$transaction` เดียวกันเพื่อป้องกัน partial failure |
| **Q-01** | Open (S3) | Global Admin Visibility | ใน Sprint 3 ผู้ดูแลระบบควรมีสิทธิ์ดูคำขอของทุกแผนกหรือไม่ (ต้องตกลงตอนทำ F-10) |
| **Q-02** | Open (S2) | Return for Revision Rules | คำขอที่ถูกส่งกลับให้แก้ไข เมื่อยื่นใหม่จะส่งไปยัง Reviewer คนเดิมหรือเริ่มกระบวนการใหม่ |
| **Q-03** | Open (S2) | Attachment Storage Strategy | กำหนดขนาดไฟล์สูงสุดและประเภทไฟล์ที่อนุญาตสำหรับการแนบหลักฐานใน Sprint 2 |
