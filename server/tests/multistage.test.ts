import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { app } from '../src/app.js';

/**
 * F-07 / Deliverable 2 - TEST-16.1..16.6 (AC-15.1..15.6).
 * RED phase: multi-stage transitions and the stage-2 availability guard
 * do not exist on pre-change code.
 */
const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const OWNER_EMAIL = 'oum.requester@cpe334.local';
const STAGE1_EMAIL = 'manager.hybrid@cpe334.local';
const STAGE2_EMAIL = 't.reviewer@cpe334.local';

let ownerId: string;
let stage1Id: string;
let stage2Id: string;
const createdRequestIds: string[] = [];

async function loginCookie(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  return setCookie?.[0]?.split(';')[0] ?? '';
}

async function createRequest(
  cookie: string,
  overrides: Partial<{ title: string; amount: number; category: string }> = {}
) {
  return request(app)
    .post('/api/requests')
    .set('Cookie', cookie)
    .send({
      title: overrides.title ?? 'F-07 multi-stage integration request',
      amount: overrides.amount ?? 7500,
      category: overrides.category ?? 'EQUIPMENT',
      description: 'Created for Sprint 2 multi-stage tests',
    });
}

async function createHighValueRequest(): Promise<string> {
  const res = await createRequest(await loginCookie(OWNER_EMAIL));
  expect(res.status).toBe(201);
  const id = res.body.data.request.id as string;
  createdRequestIds.push(id);
  return id;
}

async function row(id: string) {
  const record = await prisma.approvalRequest.findUniqueOrThrow({ where: { id } });
  return record;
}

async function histories(id: string) {
  return prisma.approvalHistory.findMany({
    where: { requestId: id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
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
  stage1Id = (await upsert(STAGE1_EMAIL, 'Manager Hybrid', Role.REVIEWER)).id;
  stage2Id = (await upsert(STAGE2_EMAIL, 'T Reviewer', Role.REVIEWER)).id;
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    await prisma.approvalRequest.deleteMany({ where: { id: { in: createdRequestIds } } });
  }
  await prisma.$disconnect();
});

describe('F-07 multi-stage approval (TEST-16.1..16.6)', () => {
  it('TEST-16.1: high-value request is stage 1 with a distinct stage-2 reviewer; ordinary stays single-stage', async () => {
    const ownerCookie = await loginCookie(OWNER_EMAIL);

    const high = await createRequest(ownerCookie, { amount: 7500 });
    expect(high.status).toBe(201);
    const highId = high.body.data.request.id as string;
    createdRequestIds.push(highId);
    const highRow = await row(highId);
    expect(highRow.stage).toBe(1);
    expect(highRow.status).toBe('PENDING');
    expect(highRow.assignedReviewerId).toBe(stage1Id);
    expect(stage2Id).not.toBe(stage1Id);

    const ordinary = await createRequest(ownerCookie, { amount: 1500 });
    expect(ordinary.status).toBe(201);
    const ordinaryId = ordinary.body.data.request.id as string;
    createdRequestIds.push(ordinaryId);
    expect((await row(ordinaryId)).stage).toBe(1);

    // Requester is one of only two reviewers -> no distinct stage-2 reviewer.
    const impossible = await createRequest(await loginCookie(STAGE1_EMAIL), { amount: 7500 });
    expect(impossible.status).toBe(400);
    expect(impossible.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(impossible.body.error.details)).toContain('STAGE_REVIEWER_UNAVAILABLE');
  });

  it('TEST-16.2: stage-1 approve moves to PENDING_STAGE2 and switches assignment', async () => {
    const id = await createHighValueRequest();
    const res = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 1 approved' });

    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe('PENDING_STAGE2');
    expect(res.body.data.request.stage).toBe(2);
    expect(res.body.data.request.assignedReviewerId).toBe(stage2Id);
    expect(res.body.data.history.action).toBe('APPROVED');
    expect(res.body.data.history.stage).toBe(1);

    const stage1Queue = await request(app)
      .get('/api/requests/pending')
      .set('Cookie', await loginCookie(STAGE1_EMAIL));
    expect(stage1Queue.status).toBe(200);
    expect((stage1Queue.body.data.requests as Array<{ id: string }>).map((r) => r.id)).not.toContain(id);

    const stage2Queue = await request(app)
      .get('/api/requests/pending')
      .set('Cookie', await loginCookie(STAGE2_EMAIL));
    expect((stage2Queue.body.data.requests as Array<{ id: string }>).map((r) => r.id)).toContain(id);
  });

  it('TEST-16.3: stage-2 approve finalises to APPROVED and clears both queues', async () => {
    const id = await createHighValueRequest();
    await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 1 approved' });

    const res = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 2 approved' });

    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe('APPROVED');
    expect(res.body.data.history.stage).toBe(2);
    const rows = await histories(id);
    expect(rows.filter((h) => h.action === 'APPROVED')).toHaveLength(2);

    for (const email of [STAGE1_EMAIL, STAGE2_EMAIL]) {
      const queue = await request(app)
        .get('/api/requests/pending')
        .set('Cookie', await loginCookie(email));
      expect((queue.body.data.requests as Array<{ id: string }>).map((r) => r.id)).not.toContain(id);
    }
  });

  it('TEST-16.4: reject at either stage produces REJECTED with the current stage recorded', async () => {
    const first = await createHighValueRequest();
    const reject1 = await request(app)
      .post(`/api/requests/${first}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'REJECT', comment: 'Rejected at stage one' });
    expect(reject1.status).toBe(200);
    expect(reject1.body.data.request.status).toBe('REJECTED');
    expect(reject1.body.data.history.action).toBe('REJECTED');
    expect(reject1.body.data.history.stage).toBe(1);

    const second = await createHighValueRequest();
    await request(app)
      .post(`/api/requests/${second}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 1 approved' });
    const reject2 = await request(app)
      .post(`/api/requests/${second}/review`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ decision: 'REJECT', comment: 'Rejected at stage two' });
    expect(reject2.status).toBe(200);
    expect(reject2.body.data.request.status).toBe('REJECTED');
    expect(reject2.body.data.history.stage).toBe(2);
  });

  it('TEST-16.5: self-approval blocked at both stages; unrelated reviewer and requester denied', async () => {
    // Stage 1: a REVIEWER owning an ordinary request cannot decide it.
    const ownLow = await createRequest(await loginCookie(STAGE1_EMAIL), { amount: 1500 });
    expect(ownLow.status).toBe(201);
    const ownLowId = ownLow.body.data.request.id as string;
    createdRequestIds.push(ownLowId);
    const self1 = await request(app)
      .post(`/api/requests/${ownLowId}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'APPROVE' });
    expect(self1.status).toBe(403);
    expect(self1.body.error.code).toBe('SELF_APPROVAL_NOT_ALLOWED');

    // Stage 2: simulate the current assignee being the requester, then verify
    // BR-01 is still checked before assignment.
    const id = await createHighValueRequest();
    await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 1 approved' });
    await prisma.approvalRequest.update({
      where: { id },
      data: { requesterId: stage2Id },
    });
    const self2 = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ decision: 'APPROVE' });
    expect(self2.status).toBe(403);
    expect(self2.body.error.code).toBe('SELF_APPROVAL_NOT_ALLOWED');
    await prisma.approvalRequest.update({ where: { id }, data: { requesterId: ownerId } });

    const unrelated = await createHighValueRequest();
    const wrong = await request(app)
      .post(`/api/requests/${unrelated}/review`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ decision: 'APPROVE' });
    expect(wrong.status).toBe(403);
    expect(wrong.body.error.code).toBe('ACCESS_DENIED');

    const requester = await request(app)
      .post(`/api/requests/${unrelated}/review`)
      .set('Cookie', await loginCookie(OWNER_EMAIL))
      .send({ decision: 'APPROVE' });
    expect(requester.status).toBe(403);
    expect(requester.body.error.code).toBe('FORBIDDEN');
  });

  it('TEST-16.6: decided request and RETURN from stage 2 are rejected; history stays append-only', async () => {
    const id = await createHighValueRequest();
    await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE1_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 1 approved' });

    const before = await histories(id);
    const illegalReturn = await request(app)
      .post(`/api/requests/${id}/return`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ comment: 'Trying to return at stage two' });
    expect(illegalReturn.status).toBe(400);
    expect(illegalReturn.body.error.code).toBe('INVALID_STATE_TRANSITION');

    await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ decision: 'APPROVE', comment: 'Stage 2 approved' });
    const afterApproval = await histories(id);
    expect(afterApproval.slice(0, before.length)).toEqual(before);

    const secondDecision = await request(app)
      .post(`/api/requests/${id}/review`)
      .set('Cookie', await loginCookie(STAGE2_EMAIL))
      .send({ decision: 'REJECT', comment: 'Too late' });
    expect(secondDecision.status).toBe(400);
    expect(secondDecision.body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect(await histories(id)).toEqual(afterApproval);
  });
});
