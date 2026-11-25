import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { HistoryAction, PrismaClient, RequestStatus, Role } from '@prisma/client';
import { app } from '../src/app.js';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const USER_A_EMAIL = 'req.user.a@cpe334.local';
const USER_B_EMAIL = 'req.user.b@cpe334.local';
const REVIEWER_T_EMAIL = 't.reviewer@cpe334.local';
const REVIEWER_M_EMAIL = 'manager.hybrid@cpe334.local';

let userAId: string;
let userBId: string;
let reviewerTId: string;
let reviewerMId: string;
const createdRequestIds: string[] = [];

async function loginCookie(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = setCookie?.[0]?.split(';')[0];
  expect(cookie).toBeDefined();
  return cookie ?? '';
}

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const userA = await prisma.user.upsert({
    where: { email: USER_A_EMAIL },
    update: { name: 'Req User A', role: Role.REQUESTER, passwordHash },
    create: {
      email: USER_A_EMAIL,
      name: 'Req User A',
      role: Role.REQUESTER,
      passwordHash,
    },
  });
  userAId = userA.id;

  const userB = await prisma.user.upsert({
    where: { email: USER_B_EMAIL },
    update: { name: 'Req User B', role: Role.REQUESTER, passwordHash },
    create: {
      email: USER_B_EMAIL,
      name: 'Req User B',
      role: Role.REQUESTER,
      passwordHash,
    },
  });
  userBId = userB.id;

  const reviewerT = await prisma.user.upsert({
    where: { email: REVIEWER_T_EMAIL },
    update: { name: 'T Reviewer', role: Role.REVIEWER, passwordHash },
    create: {
      email: REVIEWER_T_EMAIL,
      name: 'T Reviewer',
      role: Role.REVIEWER,
      passwordHash,
    },
  });
  reviewerTId = reviewerT.id;

  const reviewerM = await prisma.user.upsert({
    where: { email: REVIEWER_M_EMAIL },
    update: { name: 'Manager Hybrid', role: Role.REVIEWER, passwordHash },
    create: {
      email: REVIEWER_M_EMAIL,
      name: 'Manager Hybrid',
      role: Role.REVIEWER,
      passwordHash,
    },
  });
  reviewerMId = reviewerM.id;
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    await prisma.approvalRequest.deleteMany({
      where: { id: { in: createdRequestIds } },
    });
  }
  await prisma.user.deleteMany({
    where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } },
  });
  await prisma.$disconnect();
});

describe('POST /api/requests', () => {
  it('TEST-01: creates a PENDING request with requestNo, assigned reviewer, and SUBMITTED history', async () => {
    const cookieA = await loginCookie(USER_A_EMAIL);

    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieA)
      .send({
        title: '  MacBook Pro M4 for Dev  ',
        amount: 45000.5,
        category: 'EQUIPMENT',
        description: 'Laptop upgrade for Sprint 1 development',
      });

    expect(res.status).toBe(201);
    const created = res.body.data.request;
    createdRequestIds.push(created.id);

    expect(created.title).toBe('MacBook Pro M4 for Dev');
    expect(created.amount).toBe('45000.50');
    expect(created.category).toBe('EQUIPMENT');
    expect(created.status).toBe(RequestStatus.PENDING);
    expect(created.requesterId).toBe(userAId);
    expect(created.assignedReviewerId).toBe(reviewerTId);
    expect(created.requestNo).toMatch(/^REQ-\d{8}-\d{4}$/);

    // Verify persistence and SUBMITTED history in PostgreSQL
    const dbReq = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: true },
    });
    expect(dbReq).not.toBeNull();
    expect(dbReq?.status).toBe(RequestStatus.PENDING);
    expect(dbReq?.histories).toHaveLength(1);
    expect(dbReq?.histories[0].action).toBe(HistoryAction.SUBMITTED);
    expect(dbReq?.histories[0].actorId).toBe(userAId);
  });

  it('assigns alternate reviewer when a REVIEWER submits in their primary category (BR-05)', async () => {
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);

    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieT)
      .send({
        title: 'Conference Travel Budget',
        amount: 8500,
        category: 'TRAVEL',
        description: 'Travel expenses for team workshop',
      });

    expect(res.status).toBe(201);
    const created = res.body.data.request;
    createdRequestIds.push(created.id);

    expect(created.requesterId).toBe(reviewerTId);
    // Primary reviewer for TRAVEL is t.reviewer, so it must fall back to manager.hybrid
    expect(created.assignedReviewerId).toBe(reviewerMId);
  });

  it('TEST-02: rejects invalid payloads and boundary violations without persisting records', async () => {
    const cookieA = await loginCookie(USER_A_EMAIL);
    const beforeCount = await prisma.approvalRequest.count();

    const invalidCases = [
      { title: 'ab', amount: 100, category: 'EQUIPMENT', description: 'Too short title' },
      {
        title: 'x'.repeat(151),
        amount: 100,
        category: 'EQUIPMENT',
        description: 'Too long title',
      },
      { title: 'Zero amount', amount: 0, category: 'EQUIPMENT', description: 'Invalid zero' },
      {
        title: 'Negative amount',
        amount: -50,
        category: 'EQUIPMENT',
        description: 'Invalid negative',
      },
      {
        title: 'Over max amount',
        amount: 10000000000,
        category: 'EQUIPMENT',
        description: 'Exceeds Decimal(12,2)',
      },
      { title: 'Bad category', amount: 500, category: 'LUXURY', description: 'Not in whitelist' },
      { title: 'Empty description', amount: 500, category: 'SUPPLIES', description: '   ' },
      {
        title: 'Unknown field',
        amount: 500,
        category: 'SOFTWARE',
        description: 'Valid desc',
        status: 'APPROVED',
      },
    ];

    for (const payload of invalidCases) {
      const res = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }

    const afterCount = await prisma.approvalRequest.count();
    expect(afterCount).toBe(beforeCount);
  });

  it('rejects unauthenticated creation with 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/requests').send({
      title: 'Anonymous Request',
      amount: 100,
      category: 'SUPPLIES',
      description: 'Should fail',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/requests/my and GET /api/requests/:id', () => {
  it('TEST-03: returns only the authenticated user requests ordered newest first', async () => {
    const cookieA = await loginCookie(USER_A_EMAIL);
    const cookieB = await loginCookie(USER_B_EMAIL);

    const resA1 = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieA)
      .send({
        title: 'User A Request 1',
        amount: 200,
        category: 'SUPPLIES',
        description: 'First request by A',
      });
    expect(resA1.status).toBe(201);
    createdRequestIds.push(resA1.body.data.request.id);

    const resB1 = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieB)
      .send({
        title: 'User B Private Request',
        amount: 999,
        category: 'SOFTWARE',
        description: 'Private request by B',
      });
    expect(resB1.status).toBe(201);
    createdRequestIds.push(resB1.body.data.request.id);

    const resA2 = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieA)
      .send({
        title: 'User A Request 2',
        amount: 350,
        category: 'SOFTWARE',
        description: 'Second request by A',
      });
    expect(resA2.status).toBe(201);
    createdRequestIds.push(resA2.body.data.request.id);

    const myRes = await request(app).get('/api/requests/my').set('Cookie', cookieA);
    expect(myRes.status).toBe(200);
    const list = myRes.body.data.requests as Array<{ id: string; requesterId: string }>;

    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.every((r) => r.requesterId === userAId)).toBe(true);
    expect(list.some((r) => r.id === resB1.body.data.request.id)).toBe(false);
    // Newest first
    expect(list[0].id).toBe(resA2.body.data.request.id);
  });

  it('TEST-04: enforces data isolation on GET /api/requests/:id (401 unauth, 403 cross-user/unrelated reviewer, 200 owner/assigned)', async () => {
    const cookieA = await loginCookie(USER_A_EMAIL);
    const cookieB = await loginCookie(USER_B_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const cookieM = await loginCookie(REVIEWER_M_EMAIL);

    // EQUIPMENT -> assigned to t.reviewer
    const createRes = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieA)
      .send({
        title: 'Monitor Stand for A',
        amount: 1200,
        category: 'EQUIPMENT',
        description: 'Ergonomic stand',
      });
    expect(createRes.status).toBe(201);
    const reqId = createRes.body.data.request.id as string;
    createdRequestIds.push(reqId);

    // Unauthenticated
    const unauth = await request(app).get(`/api/requests/${reqId}`);
    expect(unauth.status).toBe(401);
    expect(unauth.body.error.code).toBe('UNAUTHORIZED');

    // Cross-user requester (User B)
    const crossUser = await request(app)
      .get(`/api/requests/${reqId}`)
      .set('Cookie', cookieB);
    expect(crossUser.status).toBe(403);
    expect(crossUser.body.error.code).toBe('ACCESS_DENIED');
    expect(crossUser.body.data).toBeUndefined();

    // Unrelated reviewer (manager.hybrid)
    const unrelatedReviewer = await request(app)
      .get(`/api/requests/${reqId}`)
      .set('Cookie', cookieM);
    expect(unrelatedReviewer.status).toBe(403);
    expect(unrelatedReviewer.body.error.code).toBe('ACCESS_DENIED');

    // Owner (User A) allowed
    const ownerRes = await request(app)
      .get(`/api/requests/${reqId}`)
      .set('Cookie', cookieA);
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data.request.id).toBe(reqId);
    expect(ownerRes.body.data.histories).toHaveLength(1);
    expect(ownerRes.body.data.request.requester).not.toHaveProperty('passwordHash');

    // Assigned reviewer (t.reviewer) allowed
    const assignedRes = await request(app)
      .get(`/api/requests/${reqId}`)
      .set('Cookie', cookieT);
    expect(assignedRes.status).toBe(200);
    expect(assignedRes.body.data.request.id).toBe(reqId);

    // Non-existent request
    const missing = await request(app)
      .get('/api/requests/00000000-0000-0000-0000-000000000000')
      .set('Cookie', cookieA);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// Lab 6 independent UAT regressions (findings F-PB-01 and F-PB-02).
// These tests are written first against the defective implementation (RED).
// ---------------------------------------------------------------------------
describe('Lab 6 UAT defect regression', () => {
  it('F-PB-01 (AC-01, BR-04): a valid 2-decimal amount 1234567.89 is accepted', async () => {
    const cookie = await loginCookie(USER_A_EMAIL);
    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', cookie)
      .send({
        title: 'UAT-Fin-01',
        amount: 1234567.89,
        category: 'EQUIPMENT',
        description: 'Test Amount value.',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.request.status).toBe('PENDING');
    expect(res.body.data.request.amount).toBe('1234567.89');
    createdRequestIds.push(res.body.data.request.id);
  });

  it('F-PB-02 (AC-02, NFR-04): an oversized body returns a 4xx error, never 500', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Content-Type', 'application/json')
      .send({
        title: 'UAT big body',
        amount: 10,
        category: 'EQUIPMENT',
        description: 'x'.repeat(200000),
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body.error.code).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// Lab 7 - CR-04 Dynamic Reviewer Assignment (BR-05 v1.1)
// Automated tests for new amount/time boundary and validation behaviors.
// Written against pre-change implementation (RED).
// ---------------------------------------------------------------------------
describe('Lab 7 CR-04 Dynamic Reviewer Assignment (BR-05 v1.1)', () => {
  it('TEST-01a: amount = 5000.00 at 10:00 ICT (EQUIPMENT) stays category-mapped to t.reviewer', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T10:00:00+07:00'));
    try {
      const cookieA = await loginCookie(USER_A_EMAIL);
      const res = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send({
          title: 'Equipment at amount threshold 5000',
          amount: 5000.00,
          category: 'EQUIPMENT',
          description: 'Amount exactly at 5000.00 boundary in-hours',
        });
      expect(res.status).toBe(201);
      const created = res.body.data.request;
      createdRequestIds.push(created.id);
      expect(created.assignedReviewerId).toBe(reviewerTId);
    } finally {
      vi.useRealTimers();
    }
  });

  it('TEST-01b: amount = 5000.01 at 10:00 ICT (EQUIPMENT) escalates to manager.hybrid', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T10:00:00+07:00'));
    try {
      const cookieA = await loginCookie(USER_A_EMAIL);
      const res = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send({
          title: 'Equipment above threshold 5000.01',
          amount: 5000.01,
          category: 'EQUIPMENT',
          description: 'Amount exactly at 5000.01 boundary in-hours',
        });
      expect(res.status).toBe(201);
      const created = res.body.data.request;
      createdRequestIds.push(created.id);
      expect(created.assignedReviewerId).toBe(reviewerMId);
    } finally {
      vi.useRealTimers();
    }
  });

  it('TEST-01c: morning time boundary (07:59 ICT out-of-hours -> manager.hybrid; 08:00 ICT in-hours -> t.reviewer)', async () => {
    // 07:59 ICT: out-of-hours -> escalates to manager.hybrid
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T07:59:00+07:00'));
    try {
      const cookieA = await loginCookie(USER_A_EMAIL);
      const res1 = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send({
          title: 'Morning out-of-hours 07:59',
          amount: 100.00,
          category: 'EQUIPMENT',
          description: 'Submitted at 07:59 ICT',
        });
      expect(res1.status).toBe(201);
      createdRequestIds.push(res1.body.data.request.id);
      expect(res1.body.data.request.assignedReviewerId).toBe(reviewerMId);
    } finally {
      vi.useRealTimers();
    }

    // 08:00 ICT: in-hours -> t.reviewer
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T08:00:00+07:00'));
    try {
      const cookieA = await loginCookie(USER_A_EMAIL);
      const res2 = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send({
          title: 'Morning in-hours 08:00',
          amount: 100.00,
          category: 'EQUIPMENT',
          description: 'Submitted at 08:00 ICT',
        });
      expect(res2.status).toBe(201);
      createdRequestIds.push(res2.body.data.request.id);
      expect(res2.body.data.request.assignedReviewerId).toBe(reviewerTId);
    } finally {
      vi.useRealTimers();
    }
  });

  it('TEST-01d: evening time boundary (17:59 ICT in-hours -> t.reviewer; 18:00 ICT out-of-hours -> manager.hybrid)', async () => {
    // 17:59 ICT: in-hours -> t.reviewer
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T17:59:00+07:00'));
    try {
      const cookieA = await loginCookie(USER_A_EMAIL);
      const res1 = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send({
          title: 'Evening in-hours 17:59',
          amount: 100.00,
          category: 'EQUIPMENT',
          description: 'Submitted at 17:59 ICT',
        });
      expect(res1.status).toBe(201);
      createdRequestIds.push(res1.body.data.request.id);
      expect(res1.body.data.request.assignedReviewerId).toBe(reviewerTId);
    } finally {
      vi.useRealTimers();
    }

    // 18:00 ICT: out-of-hours -> manager.hybrid
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T18:00:00+07:00'));
    try {
      const cookieA = await loginCookie(USER_A_EMAIL);
      const res2 = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieA)
        .send({
          title: 'Evening out-of-hours 18:00',
          amount: 100.00,
          category: 'EQUIPMENT',
          description: 'Submitted at 18:00 ICT',
        });
      expect(res2.status).toBe(201);
      createdRequestIds.push(res2.body.data.request.id);
      expect(res2.body.data.request.assignedReviewerId).toBe(reviewerMId);
    } finally {
      vi.useRealTimers();
    }
  });

  it('TEST-01e: rejects client-supplied assignedReviewerId with 400 VALIDATION_ERROR', async () => {
    const cookieA = await loginCookie(USER_A_EMAIL);
    const beforeCount = await prisma.approvalRequest.count();

    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', cookieA)
      .send({
        title: 'Tampered Assignment Field',
        amount: 500,
        category: 'EQUIPMENT',
        description: 'Trying to inject assignedReviewerId',
        assignedReviewerId: reviewerMId,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    const afterCount = await prisma.approvalRequest.count();
    expect(afterCount).toBe(beforeCount);
  });

  it('TEST-01f: manager.hybrid submits large request (> 5000) -> falls back to t.reviewer, never self-assigns (BR-01)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T10:00:00+07:00'));
    try {
      const cookieM = await loginCookie(REVIEWER_M_EMAIL);
      const res = await request(app)
        .post('/api/requests')
        .set('Cookie', cookieM)
        .send({
          title: 'Manager High-Value Equipment',
          amount: 6000.00,
          category: 'EQUIPMENT',
          description: 'Amount > 5000 would escalate to manager.hybrid, but manager is requester',
        });
      expect(res.status).toBe(201);
      const created = res.body.data.request;
      createdRequestIds.push(created.id);
      expect(created.requesterId).toBe(reviewerMId);
      // Must not self-assign to manager.hybrid; must fall back to t.reviewer
      expect(created.assignedReviewerId).toBe(reviewerTId);
      expect(created.assignedReviewerId).not.toBe(reviewerMId);
    } finally {
      vi.useRealTimers();
    }
  });
});
