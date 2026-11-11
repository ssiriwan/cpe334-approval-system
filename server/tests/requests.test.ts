import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
