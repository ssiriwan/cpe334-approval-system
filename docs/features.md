# Feature Inventory

> **CPE 334 Deliverable 1 — Part B (Feature Inventory)**
> **Project:** Corporate Expense & Purchase Request Approval System
> **Theme:** Theme 5 — Workflow and Approval System
> **Authors:** Oum (67070501075) & T (67070501021)
> **Status:** Baseline Released (Sprint 1)

---

## 1. Feature Inventory Table

รายการฟีเจอร์ทั้งหมดของระบบตั้งแต่ต้นจนจบผลิตภัณฑ์ พร้อมระบุความเชื่อมโยงกับ Requirements, Dependencies, และแผนการพัฒนาในแต่ละ Sprint:

| Feature ID | Feature Name | Description | Related Requirements | Dependencies | Planned Sprint | Planned Verification |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **F-01** | **Authentication & Session Management** | ระบบล็อกอิน ล็อกเอาต์ และตรวจสอบตัวตนผู้ใช้ผ่าน HTTP-only JWT Cookie ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต | FR-01, NFR-01, NFR-04 | None | **Sprint 1** | Automated API Integration Tests (TEST-AUTH-01..05) |
| **F-02** | **Request Creation & Validation** | ผู้ใช้สร้างคำขอเบิกงบ/จัดซื้อ ระบุหัวข้อ ยอดเงิน หมวดหมู่ พร้อมระบบตรวจสอบความถูกต้องและออกเลขคำขออัตโนมัติ | FR-02, BR-04, BR-05, NFR-04 | F-01 | **Sprint 1** | API Validation & Persistence Tests (TEST-01, TEST-02), E2E-01 |
| **F-03** | **My Requests & Data Isolation** | ผู้ยื่นคำขอดูรายการและรายละเอียดคำขอของตนเอง พร้อมการบล็อกไม่ให้ผู้ใช้อื่นเข้าถึงข้อมูลส่วนตัว | FR-03, BR-03, NFR-03 | F-01, F-02 | **Sprint 1** | API Data Isolation Tests (TEST-03, TEST-04), E2E-01 |
| **F-04** | **Review Queue & Decision Workflow** | ผู้อนุมัติดูคิวงานที่ได้รับมอบหมาย กดอนุมัติหรือปฏิเสธพร้อมบันทึกเหตุผล พร้อมบังคับใช้กฎห้ามอนุมัติตัวเอง | FR-04, FR-06, BR-01, BR-02, BR-05, BR-06, BR-07 | F-01, F-02 | **Sprint 1** | Domain Rule Tests (TEST-05..TEST-13), E2E-02, E2E-03 |
| **F-05** | **Approval History & Audit Trail** | บันทึกประวัติการยื่น อนุมัติ และปฏิเสธแบบ Append-only ภายใน Transaction เดียวกัน และแสดง Audit log | FR-05, BR-06, NFR-03 | F-04 | **S1 (Write) / S2 (View)** | Database Transaction & Immutability Test (TEST-06, TEST-13) |
| **F-06** | **Return for Revision & Resubmission** | ผู้อนุมัติสามารถส่งคำขอกลับเพื่อให้ผู้ยื่นแก้ไขข้อมูล และผู้ยื่นสามารถส่งคำขอที่แก้ไขแล้วกลับมาพิจารณาใหม่ | FR-07, BR-02, BR-06 | F-04 | **Sprint 2** | Sprint 2 Contract & Integration Tests |
| **F-07** | **Multi-Stage Approval Workflow** | กระบวนการอนุมัติหลายระดับขั้น (เช่น ผู้จัดการแผนก → ฝ่ายการเงิน) สำหรับคำขอที่มีวงเงินสูง | FR-08, BR-02, BR-05, BR-06 | F-04, F-06 | **Sprint 2** | Sprint 2 Multi-stage Decision Tests |
| **F-08** | **Document & Receipt Attachments** | ผู้ยื่นสามารถอัปโหลดไฟล์หลักฐานใบเสร็จหรือใบเสนอราคาประกอบคำขอ พร้อมระบบควบคุมสิทธิ์ดาวน์โหลด | FR-09, BR-03, NFR-04 | F-02 | **Sprint 2** | Sprint 2 File Upload & Storage Tests |
| **F-09** | **Search, Filter & Expense Reporting** | ค้นหา คัดกรองคำขอตามสถานะ/วันที่/หมวดหมู่ และสรุปภาพรวมงบประมาณที่อนุมัติ/ปฏิเสธ | FR-10, NFR-02 | F-03, F-04, F-05 | **Sprint 3** | Sprint 3 Reporting & Aggregation Tests |
| **F-10** | **Admin User & Assignment Management** | ผู้ดูแลระบบจัดการผู้ใช้งาน ปรับเปลี่ยนบทบาท และแก้ไขการมอบหมายผู้อนุมัติประจำหมวดหมู่ | FR-11, BR-05 | F-01, F-04 | **Sprint 3** | Sprint 3 Admin RBAC Tests |
| **F-11** | **System Hardening, Regression & Deployment** | การปรับปรุงประสิทธิภาพ ความปลอดภัย การรัน Regression ครบวงจร และการ Deploy สู่ GCP Cloud Run | NFR-01..NFR-06 | F-01..F-10 | **Sprint 3 / Lab 5** | Containerization, CI/CD Gate, Performance Verification |

---

## 2. Feature Dependency Graph

โครงสร้างลำดับการพึ่งพากันระหว่างฟีเจอร์ (Dependency Hierarchy):

```text
F-01 (Auth & Session)
  │
  ├──► F-02 (Request Creation)
  │      │
  │      ├──► F-03 (My Requests & Isolation)
  │      │
  │      ├──► F-04 (Review Queue & Decisions)
  │      │      │
  │      │      ├──► F-05 (Approval History & Audit)
  │      │      │      │
  │      │      │      └──► F-09 (Search, Filter & Reporting) [Sprint 3]
  │      │      │
  │      │      └──► F-06 (Return for Revision) [Sprint 2]
  │      │             │
  │      │             └──► F-07 (Multi-Stage Approval) [Sprint 2]
  │      │
  │      └──► F-08 (Document Attachments) [Sprint 2]
  │
  └──► F-10 (Admin User & Assignment Management) [Sprint 3]
         │
[All Features F-01..F-10] ──► F-11 (Hardening, Regression & Deployment) [Sprint 3 / Lab 5]
```

---

## 3. Sprint Allocation Summary

* **Sprint 1 (Deliverable 1 — Released):**
  * `F-01` Authentication & Session
  * `F-02` Request Creation & Validation
  * `F-03` My Requests & Data Isolation
  * `F-04` Review Queue & Decision Workflow
  * `F-05` (Write part) Transactional Append-Only History
* **Sprint 2 (Deliverable 2 — Planned):**
  * `F-05` (View part) Audit Trail UI View
  * `F-06` Return for Revision & Resubmission
  * `F-07` Multi-Stage Approval Workflow
  * `F-08` Document & Receipt Attachments
* **Sprint 3 (Final Delivery — Planned):**
  * `F-09` Search, Filter & Expense Reporting
  * `F-10` Admin User & Assignment Management
  * `F-11` System Hardening, Regression Suite & GCP Deployment
