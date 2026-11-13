import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { HistoryAction, PrismaClient, RequestStatus, Role } from '@prisma/client';
import { app } from '../src/app.js';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const REQUESTER_EMAIL = 'oum.requester@cpe334.local';
const REVIEWER_T_EMAIL = 't.reviewer@cpe334.local';
const REVIEWER_M_EMAIL = 'manager.hybrid@cpe334.local';

let requesterId: string;
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

async function createRequest(
  cookie: string,
  overrides: Partial<{
    title: string;
    amount: number;
    category: string;
    description: string;
  }> = {}
) {
  const res = await request(app)
    .post('/api/requests')
    .set('Cookie', cookie)
    .send({
      title: overrides.title ?? 'Reviewer Slice Test Request',
      amount: overrides.amount ?? 1500,
      category: overrides.category ?? 'EQUIPMENT',
      description: overrides.description ?? 'Created for reviewer slice integration tests',
    });
  expect(res.status).toBe(201);
  const created = res.body.data.request as { id: string; requestNo: string };
  createdRequestIds.push(created.id);
  return created;
}

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const requester = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { name: 'Oum Requester', role: Role.REQUESTER, passwordHash },
    create: {
      email: REQUESTER_EMAIL,
      name: 'Oum Requester',
      role: Role.REQUESTER,
      passwordHash,
    },
  });
  requesterId = requester.id;

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
  await prisma.$disconnect();
});

describe('GET /api/requests/pending', () => {
  it('TEST-05: returns only PENDING requests assigned to the current reviewer', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const cookieM = await loginCookie(REVIEWER_M_EMAIL);

    const pendingForT = await createRequest(cookieRequester, {
      title: 'Pending for T',
      category: 'EQUIPMENT',
    });
    const decidedForT = await createRequest(cookieRequester, {
      title: 'Already decided for T',
      category: 'TRAVEL',
    });
    const pendingForM = await createRequest(cookieRequester, {
      title: 'Pending for M',
      category: 'SOFTWARE',
    });

    await prisma.approvalRequest.update({
      where: { id: decidedForT.id },
      data: { status: RequestStatus.APPROVED },
    });

    const resT = await request(app)
      .get('/api/requests/pending')
      .set('Cookie', cookieT);
    expect(resT.status).toBe(200);

    const idsT = (resT.body.data.requests as Array<{ id: string }>).map((item) => item.id);
    expect(idsT).toContain(pendingForT.id);
    expect(idsT).not.toContain(decidedForT.id);
    expect(idsT).not.toContain(pendingForM.id);

    const item = (resT.body.data.requests as Array<Record<string, unknown>>).find(
      (row) => row.id === pendingForT.id
    );
    expect(item?.status).toBe(RequestStatus.PENDING);
    expect((item?.requester as { email: string }).email).toBe(REQUESTER_EMAIL);

    const resM = await request(app)
      .get('/api/requests/pending')
      .set('Cookie', cookieM);
    expect(resM.status).toBe(200);
    const idsM = (resM.body.data.requests as Array<{ id: string }>).map((item) => item.id);
    expect(idsM).toContain(pendingForM.id);
    expect(idsM).not.toContain(pendingForT.id);
  });

  it('rejects unauthenticated and non-reviewer access', async () => {
    const unauthenticated = await request(app).get('/api/requests/pending');
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe('UNAUTHORIZED');

    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const forbidden = await request(app)
      .get('/api/requests/pending')
      .set('Cookie', cookieRequester);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
  });
});

describe('POST /api/requests/:id/review', () => {
  it('TEST-06: approves an assigned request and appends APPROVED history in the same transaction', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Approve Me',
      category: 'EQUIPMENT',
    });

    const res = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieT)
      .send({ decision: 'APPROVE', comment: 'Approved for project use' });

    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe(RequestStatus.APPROVED);
    expect(res.body.data.history.action).toBe(HistoryAction.APPROVED);
    expect(res.body.data.history.actorId).toBe(reviewerTId);
    expect(res.body.data.history.comment).toBe('Approved for project use');
    expect(
      new Date(res.body.data.request.updatedAt).getTime()
    ).toBeGreaterThan(new Date(res.body.data.request.createdAt).getTime());

    const dbRequest = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: { orderBy: { createdAt: 'asc' } } },
    });
    expect(dbRequest?.status).toBe(RequestStatus.APPROVED);
    expect(dbRequest?.histories).toHaveLength(2);
    expect(dbRequest?.histories[0].action).toBe(HistoryAction.SUBMITTED);
    expect(dbRequest?.histories[1].action).toBe(HistoryAction.APPROVED);
    expect(dbRequest?.histories[1].actorId).toBe(reviewerTId);
  });

  it('TEST-07: rejects an assigned request with a trimmed comment and appends REJECTED history', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Reject Me',
      category: 'TRAVEL',
    });

    const res = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieT)
      .send({ decision: 'REJECT', comment: '  Missing receipts  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe(RequestStatus.REJECTED);
    expect(res.body.data.history.action).toBe(HistoryAction.REJECTED);
    expect(res.body.data.history.comment).toBe('Missing receipts');

    const dbRequest = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: true },
    });
    expect(dbRequest?.status).toBe(RequestStatus.REJECTED);
    expect(dbRequest?.histories).toHaveLength(2);
  });

  it('TEST-08: blocks self-approval before the assignment check (BR-01)', async () => {
    const cookieM = await loginCookie(REVIEWER_M_EMAIL);

    // manager.hybrid owns an EQUIPMENT request, which is assigned to t.reviewer.
    const ownRequest = await createRequest(cookieM, {
      title: 'My Own Equipment Request',
      category: 'EQUIPMENT',
    });

    const dbBefore = await prisma.approvalRequest.findUnique({
      where: { id: ownRequest.id },
      include: { histories: true },
    });
    expect(dbBefore?.assignedReviewerId).toBe(reviewerTId);
    expect(dbBefore?.histories).toHaveLength(1);

    const res = await request(app)
      .post(`/api/requests/${ownRequest.id}/review`)
      .set('Cookie', cookieM)
      .send({ decision: 'APPROVE', comment: 'Self approval attempt' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SELF_APPROVAL_NOT_ALLOWED');

    const dbAfter = await prisma.approvalRequest.findUnique({
      where: { id: ownRequest.id },
      include: { histories: true },
    });
    expect(dbAfter?.status).toBe(RequestStatus.PENDING);
    expect(dbAfter?.histories).toHaveLength(1);
  });

  it('TEST-09: rejects a second decision with INVALID_STATE_TRANSITION and appends no history', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Decide Once',
      category: 'EQUIPMENT',
    });

    const first = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieT)
      .send({ decision: 'APPROVE', comment: 'First decision' });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieT)
      .send({ decision: 'REJECT', comment: 'Second decision attempt' });

    expect(second.status).toBe(400);
    expect(second.body.error.code).toBe('INVALID_STATE_TRANSITION');

    const dbRequest = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: true },
    });
    expect(dbRequest?.status).toBe(RequestStatus.APPROVED);
    expect(dbRequest?.histories).toHaveLength(2);
  });

  it('TEST-10: rejects a REQUESTER calling the review endpoint with FORBIDDEN', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Requester Cannot Review',
      category: 'EQUIPMENT',
    });

    const res = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieRequester)
      .send({ decision: 'APPROVE' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    const dbRequest = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: true },
    });
    expect(dbRequest?.status).toBe(RequestStatus.PENDING);
    expect(dbRequest?.histories).toHaveLength(1);
  });

  it('TEST-11: rejects an unrelated reviewer with ACCESS_DENIED', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieM = await loginCookie(REVIEWER_M_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Not Assigned To M',
      category: 'EQUIPMENT',
    });

    const res = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieM)
      .send({ decision: 'APPROVE', comment: 'Unrelated reviewer attempt' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCESS_DENIED');

    const dbRequest = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: true },
    });
    expect(dbRequest?.status).toBe(RequestStatus.PENDING);
    expect(dbRequest?.histories).toHaveLength(1);
  });

  it('TEST-12: validates the decision payload without changing the request', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Decision Validation',
      category: 'EQUIPMENT',
    });

    const invalidPayloads = [
      {},
      { decision: 'ESCALATE' },
      { decision: 'approve' },
      { decision: 'REJECT' },
      { decision: 'REJECT', comment: 'ab' },
      { decision: 'REJECT', comment: 'x'.repeat(501) },
      { decision: 'APPROVE', comment: 'x'.repeat(501) },
    ];

    for (const payload of invalidPayloads) {
      const res = await request(app)
        .post(`/api/requests/${created.id}/review`)
        .set('Cookie', cookieT)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }

    const dbRequest = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: true },
    });
    expect(dbRequest?.status).toBe(RequestStatus.PENDING);
    expect(dbRequest?.histories).toHaveLength(1);
  });

  it('TEST-13: keeps history append-only and exposes no update/delete route', async () => {
    const cookieRequester = await loginCookie(REQUESTER_EMAIL);
    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const created = await createRequest(cookieRequester, {
      title: 'Append Only History',
      category: 'EQUIPMENT',
    });

    const before = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: { orderBy: { createdAt: 'asc' } } },
    });
    expect(before?.histories).toHaveLength(1);
    const originalHistory = before?.histories[0];

    const approve = await request(app)
      .post(`/api/requests/${created.id}/review`)
      .set('Cookie', cookieT)
      .send({ decision: 'APPROVE', comment: 'Keep history immutable' });
    expect(approve.status).toBe(200);

    const after = await prisma.approvalRequest.findUnique({
      where: { id: created.id },
      include: { histories: { orderBy: { createdAt: 'asc' } } },
    });
    expect(after?.histories).toHaveLength(2);
    expect(after?.histories[0].id).toBe(originalHistory?.id);
    expect(after?.histories[0].action).toBe(HistoryAction.SUBMITTED);
    expect(after?.histories[0].comment).toBe(originalHistory?.comment);

    const updateHistory = await request(app)
      .put(`/api/requests/${created.id}/history`)
      .set('Cookie', cookieT)
      .send({ comment: 'tamper' });
    expect(updateHistory.status).toBe(404);

    const deleteHistory = await request(app)
      .delete(`/api/requests/${created.id}/history`)
      .set('Cookie', cookieT);
    expect(deleteHistory.status).toBe(404);

    const count = await prisma.approvalHistory.count({
      where: { requestId: created.id },
    });
    expect(count).toBe(2);
  });

  it('returns 401 without a session and 404 for an unknown request', async () => {
    const unauthenticated = await request(app)
      .post('/api/requests/00000000-0000-0000-0000-000000000000/review')
      .send({ decision: 'APPROVE' });
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe('UNAUTHORIZED');

    const cookieT = await loginCookie(REVIEWER_T_EMAIL);
    const missing = await request(app)
      .post('/api/requests/00000000-0000-0000-0000-000000000000/review')
      .set('Cookie', cookieT)
      .send({ decision: 'APPROVE' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });
});
