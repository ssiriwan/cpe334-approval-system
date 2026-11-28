import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { app } from '../src/app.js';

/**
 * F-09 / Deliverable 2 Part C - TEST-18.1..18.4 (AC-17.1..17.4).
 * RED phase: list endpoints ignore query filters and do not return `count`.
 */
const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const OWNER_EMAIL = 'f09.owner.requester@cpe334.local';
const REVIEWER_EMAIL = 'manager.hybrid@cpe334.local';
const OTHER_REQUESTER_EMAIL = 'f09.other.requester@cpe334.local';

const createdRequestIds: string[] = [];

async function loginCookie(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  return setCookie?.[0]?.split(';')[0] ?? '';
}

async function makeRequest(
  cookie: string,
  category: string,
  createdAt: string
): Promise<string> {
  const res = await request(app)
    .post('/api/requests')
    .set('Cookie', cookie)
    .send({
      title: `F-09 ${category} ${createdAt.slice(0, 10)}`,
      amount: 7500,
      category,
      description: 'Created for Sprint 3 search/filter tests',
    });
  expect(res.status).toBe(201);
  const id = res.body.data.request.id as string;
  createdRequestIds.push(id);
  await prisma.approvalRequest.update({
    where: { id },
    data: { createdAt: new Date(createdAt) },
  });
  return id;
}

let pendingA: string;
let pendingB: string;
let approved: string;
let returned: string;

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const upsert = (email: string, name: string, role: Role) =>
    prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash },
      create: { email, name, role, passwordHash },
    });
  const owner = await upsert(OWNER_EMAIL, 'Oum Requester', Role.REQUESTER);
  await upsert(REVIEWER_EMAIL, 'Manager Hybrid', Role.REVIEWER);
  await upsert(OTHER_REQUESTER_EMAIL, 'F09 Other Requester', Role.REQUESTER);

  const ownerCookie = await loginCookie(OWNER_EMAIL);
  const reviewerCookie = await loginCookie(REVIEWER_EMAIL);

  pendingA = await makeRequest(ownerCookie, 'EQUIPMENT', '2026-11-02T10:00:00+07:00');
  pendingB = await makeRequest(ownerCookie, 'SOFTWARE', '2026-11-12T10:00:00+07:00');
  approved = await makeRequest(ownerCookie, 'EQUIPMENT', '2026-11-18T10:00:00+07:00');
  returned = await makeRequest(ownerCookie, 'TRAVEL', '2026-11-22T10:00:00+07:00');

  expect(
    (await request(app)
      .post(`/api/requests/${approved}/review`)
      .set('Cookie', reviewerCookie)
      .send({ decision: 'APPROVE', comment: 'Approved for filter tests' })).status
  ).toBe(200);
  expect(
    (await request(app)
      .post(`/api/requests/${returned}/return`)
      .set('Cookie', reviewerCookie)
      .send({ comment: 'Please revise the travel dates' })).status
  ).toBe(200);

  // A request owned by a different requester must never appear in owner's list.
  await makeRequest(await loginCookie(OTHER_REQUESTER_EMAIL), 'EQUIPMENT', '2026-11-05T10:00:00+07:00');
  expect(owner.id).toBeTruthy();
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    await prisma.approvalRequest.deleteMany({ where: { id: { in: createdRequestIds } } });
  }
  await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, OTHER_REQUESTER_EMAIL] } } });
  await prisma.$disconnect();
});

describe('F-09 server-side filters (TEST-18.1..18.4)', () => {
  it('TEST-18.1: status filter returns only own requests with that status and a count', async () => {
    const res = await request(app)
      .get('/api/requests/my?status=PENDING')
      .set('Cookie', await loginCookie(OWNER_EMAIL));

    expect(res.status).toBe(200);
    const ids = (res.body.data.requests as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toContain(pendingA);
    expect(ids).toContain(pendingB);
    expect(ids).not.toContain(approved);
    expect(ids).not.toContain(returned);
    expect(res.body.data.count).toBe(ids.length);
    expect(ids).toHaveLength(2);
  });

  it('TEST-18.2: category and status filters are ANDed', async () => {
    const res = await request(app)
      .get('/api/requests/my?status=PENDING&category=SOFTWARE')
      .set('Cookie', await loginCookie(OWNER_EMAIL));

    expect(res.status).toBe(200);
    const ids = (res.body.data.requests as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toEqual([pendingB]);
    expect(res.body.data.count).toBe(1);
  });

  it('TEST-18.3: date bounds are inclusive in Asia/Bangkok; invalid input is rejected', async () => {
    const inRange = await request(app)
      .get('/api/requests/my?from=2026-11-10&to=2026-11-20')
      .set('Cookie', await loginCookie(OWNER_EMAIL));
    expect(inRange.status).toBe(200);
    const ids = (inRange.body.data.requests as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toContain(pendingB);
    expect(ids).toContain(approved);
    expect(ids).not.toContain(pendingA);
    expect(ids).not.toContain(returned);

    const badDate = await request(app)
      .get('/api/requests/my?from=2026-99-99')
      .set('Cookie', await loginCookie(OWNER_EMAIL));
    expect(badDate.status).toBe(400);
    expect(badDate.body.error.code).toBe('VALIDATION_ERROR');

    const reversed = await request(app)
      .get('/api/requests/my?from=2026-11-20&to=2026-11-10')
      .set('Cookie', await loginCookie(OWNER_EMAIL));
    expect(reversed.status).toBe(400);
    expect(reversed.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('TEST-18.4: reviewer queue filters cannot reveal other reviewers or decided requests', async () => {
    const reviewerCookie = await loginCookie(REVIEWER_EMAIL);
    const filtered = await request(app)
      .get('/api/requests/pending?status=PENDING&category=EQUIPMENT')
      .set('Cookie', reviewerCookie);
    expect(filtered.status).toBe(200);
    const ids = (filtered.body.data.requests as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toContain(pendingA);
    expect(ids).not.toContain(approved);
    expect(ids).not.toContain(returned);
    expect(filtered.body.data.count).toBe(ids.length);

    const asRequester = await request(app)
      .get('/api/requests/pending?status=PENDING')
      .set('Cookie', await loginCookie(OWNER_EMAIL));
    expect(asRequester.status).toBe(403);
    expect(asRequester.body.error.code).toBe('FORBIDDEN');
  });
});
