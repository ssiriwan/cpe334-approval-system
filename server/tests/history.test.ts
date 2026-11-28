import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { HistoryAction, PrismaClient, Role } from '@prisma/client';
import { app } from '../src/app.js';

/**
 * F-05 / Deliverable 2 - TEST-14.1..14.4 (AC-13.1..13.4).
 * RED phase: the read-only audit endpoint does not exist on pre-change code.
 */
const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const OWNER_EMAIL = 'oum.requester@cpe334.local';
// High-value amount (7500 > 5000) always escalates to manager.hybrid under
// CR-04, so this helper is deterministic regardless of the local clock.
const REVIEWER_EMAIL = 'manager.hybrid@cpe334.local';
const OTHER_EMAIL = 'f05.other.requester@cpe334.local';

let ownerId: string;
let reviewerId: string;
const createdRequestIds: string[] = [];

const cookieCache = new Map<string, string>();
async function loginCookie(email: string): Promise<string> {
  const cached = cookieCache.get(email);
  if (cached) return cached;
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

async function createAndDecideRequest(): Promise<string> {
  const ownerCookie = await loginCookie(OWNER_EMAIL);
  const created = await request(app)
    .post('/api/requests')
    .set('Cookie', ownerCookie)
    .send({
      title: 'F-05 audit view integration request',
      amount: 7500,
      category: 'EQUIPMENT',
      description: 'Created for Sprint 2 audit-view tests',
    });
  expect(created.status).toBe(201);
  const id = created.body.data.request.id as string;
  createdRequestIds.push(id);

  const reviewerCookie = await loginCookie(REVIEWER_EMAIL);
  const decided = await request(app)
    .post(`/api/requests/${id}/review`)
    .set('Cookie', reviewerCookie)
    .send({ decision: 'APPROVE', comment: 'Approved for audit test' });
  expect(decided.status).toBe(200);
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
  await upsert(OTHER_EMAIL, 'F05 Other Requester', Role.REQUESTER);
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    await prisma.approvalRequest.deleteMany({ where: { id: { in: createdRequestIds } } });
  }
  await prisma.user.deleteMany({ where: { email: OTHER_EMAIL } });
  await prisma.$disconnect();
});

describe('F-05 read-only approval history (TEST-14.1..14.4)', () => {
  it('TEST-14.1: owner sees full ordered history with actor, action, comment and timestamp', async () => {
    const id = await createAndDecideRequest();
    const cookie = await loginCookie(OWNER_EMAIL);

    const res = await request(app).get(`/api/requests/${id}/history`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.requestId).toBe(id);
    const histories = res.body.data.histories as Array<Record<string, unknown>>;
    expect(histories).toHaveLength(2);
    expect(histories.map((h) => h.action).sort()).toEqual(['APPROVED', 'SUBMITTED']);
    for (const h of histories) {
      expect(h.id).toBeTruthy();
      expect(h.createdAt).toBeTruthy();
      expect((h.actor as { id: string }).id).toMatch(/^[0-9a-f-]+$/);
      expect(h.actor).not.toHaveProperty('passwordHash');
    }
    const times = histories.map((h) => String(h.createdAt));
    expect(times).toEqual([...times].sort());
  });

  it('TEST-14.2: assigned reviewer sees the same ordered history', async () => {
    const id = await createAndDecideRequest();
    const ownerRes = await request(app)
      .get(`/api/requests/${id}/history`)
      .set('Cookie', await loginCookie(OWNER_EMAIL));
    const reviewerRes = await request(app)
      .get(`/api/requests/${id}/history`)
      .set('Cookie', await loginCookie(REVIEWER_EMAIL));

    expect(reviewerRes.status).toBe(200);
    expect(reviewerRes.body.data.histories).toEqual(ownerRes.body.data.histories);
  });

  it('TEST-14.3: other user, anonymous caller and unknown id are denied without data leak', async () => {
    const id = await createAndDecideRequest();

    const other = await request(app)
      .get(`/api/requests/${id}/history`)
      .set('Cookie', await loginCookie(OTHER_EMAIL));
    expect(other.status).toBe(403);
    expect(other.body.error.code).toBe('ACCESS_DENIED');
    expect(other.body).not.toHaveProperty('data');
    expect(JSON.stringify(other.body)).not.toContain('F-05 audit view');

    const anonymous = await request(app).get(`/api/requests/${id}/history`);
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe('UNAUTHORIZED');

    const missing = await request(app)
      .get('/api/requests/00000000-0000-0000-0000-000000000000/history')
      .set('Cookie', await loginCookie(OWNER_EMAIL));
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('TEST-14.4: history is append-only and persists; no write route exists', async () => {
    const id = await createAndDecideRequest();
    const cookie = await loginCookie(OWNER_EMAIL);
    const before = await request(app).get(`/api/requests/${id}/history`).set('Cookie', cookie);
    expect(before.status).toBe(200);
    const original = before.body.data.histories as Array<Record<string, unknown>>;

    await prisma.approvalHistory.create({
      data: {
        requestId: id,
        actorId: ownerId,
        action: HistoryAction.RETURNED,
        stage: 1,
        comment: 'Appended by TEST-14.4',
      },
    });

    const after = await request(app).get(`/api/requests/${id}/history`).set('Cookie', cookie);
    expect(after.status).toBe(200);
    const rows = after.body.data.histories as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(original.length + 1);
    expect(rows.slice(0, original.length)).toEqual(original);
    expect(rows.at(-1)?.action).toBe('RETURNED');

    for (const method of ['put', 'delete'] as const) {
      const write = await request(app)[method](`/api/requests/${id}/history`).set('Cookie', cookie);
      expect([404, 405]).toContain(write.status);
    }
    expect(reviewerId).toBeTruthy();
  });
});
