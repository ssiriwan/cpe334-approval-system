# Requirements Traceability Matrix

> **CPE 334 Deliverable 1 — Part B (Traceability)**  
> **Project:** Corporate Expense & Purchase Request Approval System  
> **Theme:** Theme 5 — Workflow and Approval System  
> **Authors:** Oum (67070501075) & T (67070501021)  
> **Status:** Baseline Released (Sprint 1)

---

## 1. Requirements-to-Feature-to-Sprint Traceability Matrix

ตารางแสดงความเชื่อมโยงแบบครบถ้วนระหว่าง **ความต้องการ (Requirements: FR, BR, NFR)** $\rightarrow$ **ฟีเจอร์ (Features: F-01..11)** $\rightarrow$ **Sprint ที่รับผิดชอบ** $\rightarrow$ **เกณฑ์การยอมรับ (AC) และรหัสการทดสอบ (Test IDs)**:

### 1.1 Functional Requirements (FR) Traceability
| Req ID | Requirement Description | Linked Feature | Sprint | Acceptance Criteria (AC) | Verification Method & Test IDs | Baseline Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
| **FR-01** | User Authentication & Cookie Session | F-01 | **Sprint 1** | AC-AUTH-01, AC-AUTH-02, AC-AUTH-03, AC-AUTH-04, AC-AUTH-05 | Integration Tests: `TEST-AUTH-01` ถึง `TEST-AUTH-05` | **Verified (Sprint 1)** |
| **FR-02** | Request Creation & Field Validation | F-02 | **Sprint 1** | AC-01, AC-02 | API & DB Tests: `TEST-01`, `TEST-02`, E2E: `E2E-01` | **Verified (Sprint 1)** |
| **FR-03** | My Requests & Detail Tracking | F-03 | **Sprint 1** | AC-03, AC-04 | API Isolation Tests: `TEST-03`, `TEST-04`, E2E: `E2E-01` | **Verified (Sprint 1)** |
| **FR-04** | Review Queue & Decision Workflow | F-04 | **Sprint 1** | AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-12 | Integration Tests: `TEST-05` ถึง `TEST-12`, E2E: `E2E-02`, `E2E-03` | **Verified (Sprint 1)** |
| **FR-05** | Approval History & Audit Trail | F-05 | **S1 (Write) / S2 (View)** | AC-06, AC-11 | Transaction Test: `TEST-06`, Persistence: `TEST-13` | **Verified (S1 Write)** / Planned (S2 View) |
| **FR-06** | Reviewer Assignment | F-04, F-10 | **S1 (Assign) / S3 (Admin)** | AC-01, AC-05, AC-09 | Assignment Tests: `TEST-01`, `TEST-05`, `TEST-11` | **Verified (S1 Assign)** / Planned (S3 Admin) |
| **FR-07** | Return for Revision & Resubmission | F-06 | **Sprint 2** | Planned in Sprint 2 Contract | Unit & Integration Tests (Sprint 2) | *Planned (Sprint 2)* |
| **FR-08** | Multi-Stage Approval Workflow | F-07 | **Sprint 2** | Planned in Sprint 2 Contract | Multi-stage Transition Tests (Sprint 2) | *Planned (Sprint 2)* |
| **FR-09** | Document Attachments | F-08 | **Sprint 2** | Planned in Sprint 2 Contract | Multipart Upload & Auth Tests (Sprint 2) | *Planned (Sprint 2)* |
| **FR-10** | Search, Filter & Expense Reporting | F-09 | **Sprint 3** | Planned in Sprint 3 Contract | Reporting & Aggregate Query Tests (Sprint 3) | *Planned (Sprint 3)* |
| **FR-11** | Admin User & Role Management | F-10 | **Sprint 3** | Planned in Sprint 3 Contract | Admin Access & Role Management Tests (Sprint 3) | *Planned (Sprint 3)* |

---

### 1.2 Business Rules (BR) Traceability
| Rule ID | Business Rule / Domain Guard | Linked Feature | Sprint | Acceptance Criteria (AC) | Verification Method & Test IDs | Baseline Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
| **BR-01** | **No Self-Approval:** ห้ามอนุมัติคำขอตนเองเด็ดขาด | F-04 | **Sprint 1** | AC-07 | Backend Guard Test: `TEST-08`, E2E: `E2E-03` | **Verified (Sprint 1)** |
| **BR-02** | **Valid State Lifecycle:** `PENDING` $\rightarrow$ `APPROVED` / `REJECTED` | F-04, F-06, F-07 | **Sprint 1 / S2** | AC-08 (S1) | State Transition Test: `TEST-09` | **Verified (Sprint 1)** |
| **BR-03** | **Data Isolation:** เข้าถึงได้เฉพาะคำขอที่ตนมีสิทธิ์ | F-03, F-04, F-08 | **Sprint 1 / S2** | AC-04, AC-09 | Forbidden Access Tests: `TEST-04`, `TEST-11` | **Verified (Sprint 1)** |
| **BR-04** | **Payload Validation:** Title, Amount > 0, Whitelist Category | F-02 | **Sprint 1** | AC-02 | Boundary & Negative Tests: `TEST-02` | **Verified (Sprint 1)** |
| **BR-05** | **Reviewer Assignment:** บังคับสิทธิ์ตามผู้อนุมัติที่ได้รับมอบหมาย | F-02, F-04, F-10 | **Sprint 1 / S3** | AC-01, AC-05, AC-09 | Assignment & Unrelated Reviewer Tests: `TEST-05`, `TEST-11` | **Verified (Sprint 1)** |
| **BR-06** | **Append-Only History:** บันทึกประวัติใน Transaction ห้ามแก้ไข/ลบ | F-04, F-05 | **Sprint 1** | AC-06, AC-11 | Immutability & Persistence Test: `TEST-06`, `TEST-13` | **Verified (Sprint 1)** |
| **BR-07** | **Decision Validation:** Approve/Reject format + Reason on Reject | F-04 | **Sprint 1** | AC-12 | Decision Payload Validation Test: `TEST-12` | **Verified (Sprint 1)** |

---

### 1.3 Non-Functional Requirements (NFR) Traceability
| NFR ID | Quality Category | Target & Measure | Linked Feature | Sprint | Verification Method & Evidence |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **NFR-01** | Security | bcrypt cost 12, JWT 8h, httpOnly Lax Cookie, no plaintext passwords | F-01, F-04, F-11 | **Sprint 1** | Code audit, `TEST-AUTH-01..05`, Secret scan inspection |
| **NFR-02** | Performance | API latency p95 < 300 ms ภายใต้ 50 concurrent requests, no N+1 query | F-01..F-04, F-09, F-11 | **S1 / S3** | Local execution timing benchmark scripts |
| **NFR-03** | Persistence & Durability | ข้อมูลและประวัติคงอยู่หลัง restart, migration & seed รันซ้ำได้ | F-02..F-05, F-11 | **Sprint 1 / Lab 5** | Database restart verification, clean DB seed execution |
| **NFR-04** | Error Safety & Validation | 100% ของ invalid inputs คืน 4xx พร้อมรหัส error code ชัดเจน | F-01..F-04, F-11 | **Sprint 1** | Negative integration test suites (`TEST-02`, `TEST-12`, `TEST-AUTH-02`) |
| **NFR-05** | Testability & Traceability | 100% ของ Sprint 1 AC มี automated tests รองรับครบถ้วน | F-01..F-04 | **Sprint 1** | Vitest test execution suite (100% Pass) + Playwright E2E |
| **NFR-06** | Deployability & Config | Containerized deployment, zero hardcoded secrets, health probe | F-11 | **S1 (Design) / Lab 5** | Dockerfile inspection, `/api/health` probe test |

---

## 2. Coverage Gaps & Honest Disclosure

ตามข้อกำหนดของวิชา CPE 334 ข้อกำหนดที่ไม่สามารถส่งมอบได้ใน Sprint 1 จะต้องระบุสถานะอย่างเปิดเผยและโปร่งใส:

1. **Baseline Requirement Coverage:**
   * ทุก Requirement (`FR-01..FR-11`, `BR-01..BR-07`, `NFR-01..NFR-06`) ถูกจัดสรรเข้าสู่ฟีเจอร์และ Sprint อย่างครบถ้วน 100% ไม่มี Requirement ใดที่ถูกทิ้งหรือไม่ได้รับการจัดสรร
2. **Sprint 1 Working Scope:**
   * `FR-01` ถึง `FR-04`, `FR-05 (Write)`, `FR-06 (Assignment)` และ `BR-01` ถึง `BR-07` ทั้งหมดได้รับการพัฒนา มี Automated Tests รองรับครบถ้วน และพร้อมส่งมอบใน Release Sprint 1
3. **Later Sprints Scope (Honest Planned Disclosure):**
   * `FR-07` (Return for revision), `FR-08` (Multi-stage), `FR-09` (Attachments) ถูกระบุสถานะเป็น **Planned for Sprint 2**
   * `FR-10` (Reporting) และ `FR-11` (Admin) ถูกระบุสถานะเป็น **Planned for Sprint 3**
   * ยังไม่มี Acceptance Criteria เชิงลึกและ executable tests ในเอกสารรอบนี้ โดยจะมีการทำ Feature Engineering Contracts ฉบับเต็มใน Sprint 2 และ Sprint 3 ตามลำดับ

---

## 3. Approved Change Log

บันทึกการเปลี่ยนแปลงข้อกำหนดและขอบเขตที่ผ่านการเห็นชอบร่วมกันระหว่างทีมงาน (Approved Changes):

| Change ID | Date | Requirement / Feature | Change Description | Justification & Impact | Approved By | Status |
| :---: | :---: | :---: | :--- | :--- | :---: | :---: |
| **CR-01** | 2026-11-04 | Scope / Theme | กำหนดเลือก Theme 5: Workflow and Approval System | อิงตามรหัสนักศึกษา (Oum ท้าย 5, T ท้าย 1); ตกลงเลือก Theme 5 ร่วมกัน | Oum & T | Approved |
| **CR-02** | 2026-11-04 | FR-02 / Role Matrix | อนุญาตให้ผู้ใช้ Role `REVIEWER` สามารถยื่นคำขอได้ | จำเป็นอย่างยิ่งสำหรับการทดสอบกฎ `BR-01 No Self-Approval` ในสถานการณ์จริง | Oum & T | Approved |
| **CR-03** | 2026-11-04 | BR-05 / F-02 | กำหนด Reviewer Assignment อิงตามหมวดหมู่คำขอใน Sprint 1 | เพื่อให้ผลลัพธ์การทดสอบมอบหมายงานมีความ deterministic และทดสอบสิทธิ์ Unrelated Reviewer ได้แม่นยำ | Oum & T | Approved |
| **CR-04** | 2026-11-04 | FR-05 / Scope | แบ่ง F-05 เป็น 2 ส่วน: Write ใน Sprint 1 และ View ใน Sprint 2 | ลดขอบเขต UI ที่ซ้ำซ้อนใน Sprint 1 โดยคงความสมบูรณ์ของการบันทึก Transaction ใน Database | Oum & T | Approved |
