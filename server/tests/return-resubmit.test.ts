import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { HistoryAction, PrismaClient, RequestStatus, Role } from '@prisma/client';
import { app } from '../src/app.js';

/**
 * F-06 / Deliverable 2 - TEST-15.1..15.6 (AC-14.1..14.6).
 * RED phase: tests are authored against contract before implementation.
 */
const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const OWNER_EMAIL = 'oum.requester@cpe334.local';
const REVIEWER_EMAIL = 't.reviewer@cpe334.local';
const MANAGER_EMAIL = 'manager.hybrid@cpe334.local';
const OTHER_EMAIL = 'f06.other.requester@cpe334.local';

let ownerId: string;
let reviewerId: string;
let managerId: string;
const createdRequestIds: string[] = [];

const cookieCache = new Map<string, string>();
async function loginCookie(email: string): Promise<string> {
  const cached = cookieCache.get(email);
  if (cached) {
    return cached;
  }
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = setCookie?.[0]?.split(';')[0];
  expect(cookie).toBeDefined();
  cookieCache.set(email, cookie ?? '');
  return cookie ?? '';
}

async function createPendingRequest(amount = 1500, category = 'EQUIPMENT'): Promise<string> {
  const cookie = await loginCookie(OWNER_EMAIL);
  const res = await request(app)
    .post('/api/requests')
    .set('Cookie', cookie)
    .send({
      title: 'F-06 return/resubmit test request',
      amount,
      category,
      description: 'Request for testing return-resubmit lifecycle',
    });
  expect(res.status).toBe(201);
  const id = res.body.data.request.id as string;
  createdRequestIds.push(id);
  return id;
}

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const upsert = (email: string, name: string, role: Role) =>
    prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash },
      create: { email, name, role, passwordHash },
    });

  ownerId = (await upsert(OWNER_EMAIL, 'Oum Requester', Role.REQUESTER)).id;
  reviewerId = (await upsert(REVIEWER_EMAIL, 'T Reviewer', Role.REVIEWER)).id;
  managerId = (await upsert(MANAGER_EMAIL, 'Manager Hybrid', Role.REVIEWER)).id;
  await upsert(OTHER_EMAIL, 'F06 Other Requester', Role.REQUESTER);
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    await prisma.approvalRequest.deleteMany({ where: { id: { in: createdRequestIds } } });
  }
  await prisma.user.deleteMany({ where: { email: OTHER_EMAIL } });
  await prisma.$disconnect();
});

describe('F-06 return for revision & resubmission (TEST-15.1..15.6)', () => {
  it('TEST-15.1: assigned reviewer returns PENDING request with valid comment -> 200 RETURNED', async () => {
    const id = await createPendingRequest(1500, 'EQUIPMENT');
    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);

    const res = await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Please specify the exact hardware model numbers and vendor quotes.' });

    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe(RequestStatus.RETURNED);
    expect(res.body.data.history.action).toBe(HistoryAction.RETURNED);
    expect(res.body.data.history.comment).toContain('Please specify the exact hardware');

    // Verify DB state
    const dbReq = await prisma.approvalRequest.findUnique({ where: { id } });
    expect(dbReq?.status).toBe(RequestStatus.RETURNED);
  });

  it('TEST-15.2: comment boundary validation (<3, >500, whitespace) -> 400 VALIDATION_ERROR', async () => {
    const id = await createPendingRequest(1500, 'EQUIPMENT');
    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);

    // Too short (< 3 chars)
    const tooShort = await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'no' });
    expect(tooShort.status).toBe(400);
    expect(tooShort.body.error.code).toBe('VALIDATION_ERROR');

    // Whitespace only
    const whitespace = await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: '     ' });
    expect(whitespace.status).toBe(400);
    expect(whitespace.body.error.code).toBe('VALIDATION_ERROR');

    // Too long (> 500 chars)
    const tooLong = await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'a'.repeat(501) });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.error.code).toBe('VALIDATION_ERROR');

    // DB state stays PENDING
    const dbReq = await prisma.approvalRequest.findUnique({ where: { id } });
    expect(dbReq?.status).toBe(RequestStatus.PENDING);
  });

  it('TEST-15.3: role, self-approval and assignment permissions for return', async () => {
    // 1. Requester cannot call return endpoint -> 403 FORBIDDEN
    const id1 = await createPendingRequest(1500, 'EQUIPMENT');
    const ownerCookie = await loginCookie(OWNER_EMAIL);
    const requesterCall = await request(app)
      .post(`/api/requests/${id1}/return`)
      .set('Cookie', ownerCookie)
      .send({ comment: 'Attempting return as requester' });
    expect(requesterCall.status).toBe(403);
    expect(requesterCall.body.error.code).toBe('FORBIDDEN');

    // 2. Unrelated reviewer -> 403 ACCESS_DENIED
    // Request assigned to t.reviewer; manager calls return
    const managerCookie = await loginCookie(MANAGER_EMAIL);
    const unrelatedReviewer = await request(app)
      .post(`/api/requests/${id1}/return`)
      .set('Cookie', managerCookie)
      .send({ comment: 'Manager trying to return t.reviewer request' });
    expect(unrelatedReviewer.status).toBe(403);
    expect(unrelatedReviewer.body.error.code).toBe('ACCESS_DENIED');

    // 3. Self-approval guard: reviewer creates own request -> mapped to alternate
    // If reviewer is requester on a request where they are assigned, return must return 403 SELF_APPROVAL_NOT_ALLOWED
    const reviewerReq = await prisma.approvalRequest.create({
      data: {
        requestNo: `REQ-SELF-${Date.now()}`,
        title: 'Reviewer self request',
        amount: 1000,
        category: 'EQUIPMENT',
        description: 'Self-approval test request',
        status: RequestStatus.PENDING,
        requesterId: reviewerId,
        assignedReviewerId: reviewerId, // artificial assignment to test guard
      },
    });
    createdRequestIds.push(reviewerReq.id);

    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);
    const selfReturn = await request(app)
      .post(`/api/requests/${reviewerReq.id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Reviewer returning own request' });
    expect(selfReturn.status).toBe(403);
    expect(selfReturn.body.error.code).toBe('SELF_APPROVAL_NOT_ALLOWED');
  });

  it('TEST-15.4: owner resubmits RETURNED request with new fields -> 200 PENDING and re-assigns', async () => {
    const id = await createPendingRequest(1500, 'EQUIPMENT');
    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);

    // Reviewer returns it
    await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Budget needs adjustment to 7,500 THB.' });

    // Owner edits amount to 7500 (escalation threshold under CR-04) and resubmits
    const ownerCookie = await loginCookie(OWNER_EMAIL);
    const res = await request(app)
      .post(`/api/requests/${id}/resubmit`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'F-06 updated request title',
        amount: 7500,
        category: 'EQUIPMENT',
        description: 'Updated with vendor quotes and 7,500 THB budget.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe(RequestStatus.PENDING);
    expect(res.body.data.request.title).toBe('F-06 updated request title');
    expect(Number(res.body.data.request.amount)).toBe(7500);

    // Re-resolved under CR-04: > 5000 THB escalates to manager.hybrid
    expect(res.body.data.request.assignedReviewerId).toBe(managerId);

    // History contains RESUBMITTED
    expect(res.body.data.history.action).toBe(HistoryAction.RESUBMITTED);

    // Verify DB history order
    const histories = await prisma.approvalHistory.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
    });
    expect(histories.map((h) => h.action)).toEqual([
      HistoryAction.SUBMITTED,
      HistoryAction.RETURNED,
      HistoryAction.RESUBMITTED,
    ]);
  });

  it('TEST-15.5: invalid payload on resubmit -> 400; non-owner resubmit -> 403', async () => {
    const id = await createPendingRequest(1500, 'EQUIPMENT');
    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);
    await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Please fix amount.' });

    // 1. Invalid payload (amount <= 0) -> 400 VALIDATION_ERROR
    const ownerCookie = await loginCookie(OWNER_EMAIL);
    const invalidAmount = await request(app)
      .post(`/api/requests/${id}/resubmit`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Valid title',
        amount: -50,
        category: 'EQUIPMENT',
        description: 'Invalid negative amount',
      });
    expect(invalidAmount.status).toBe(400);
    expect(invalidAmount.body.error.code).toBe('VALIDATION_ERROR');

    // 2. Non-owner tries to resubmit -> 403 ACCESS_DENIED
    const otherCookie = await loginCookie(OTHER_EMAIL);
    const nonOwner = await request(app)
      .post(`/api/requests/${id}/resubmit`)
      .set('Cookie', otherCookie)
      .send({
        title: 'Hijack title',
        amount: 2000,
        category: 'EQUIPMENT',
        description: 'Unauthorized resubmission',
      });
    expect(nonOwner.status).toBe(403);
    expect(nonOwner.body.error.code).toBe('ACCESS_DENIED');

    // DB state stays RETURNED
    const dbReq = await prisma.approvalRequest.findUnique({ where: { id } });
    expect(dbReq?.status).toBe(RequestStatus.RETURNED);
  });

  it('TEST-15.6: invalid state transitions (return/resubmit on terminal or wrong states) -> 400', async () => {
    // 1. Cannot resubmit a PENDING request
    const id = await createPendingRequest(1500, 'EQUIPMENT');
    const ownerCookie = await loginCookie(OWNER_EMAIL);
    const resubmitPending = await request(app)
      .post(`/api/requests/${id}/resubmit`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Resubmitting while pending',
        amount: 1500,
        category: 'EQUIPMENT',
        description: 'Should fail with INVALID_STATE_TRANSITION',
      });
    expect(resubmitPending.status).toBe(400);
    expect(resubmitPending.body.error.code).toBe('INVALID_STATE_TRANSITION');

    // 2. Cannot return an APPROVED request
    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);
    await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', reviewerCookie)
      .send({ decision: 'APPROVE', comment: 'Approved' });

    const returnApproved = await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Cannot return approved request' });
    expect(returnApproved.status).toBe(400);
    expect(returnApproved.body.error.code).toBe('INVALID_STATE_TRANSITION');

    // 3. Unauthenticated -> 401
    const unauth = await request(app).post(`/api/requests/${id}/return`).send({ comment: 'No cookie' });
    expect(unauth.status).toBe(401);

    // 4. Unknown ID -> 404
    const unknown = await request(app)
      .post('/api/requests/00000000-0000-0000-0000-000000000000/return')
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Unknown request ID' });
    expect(unknown.status).toBe(404);
  });
});
