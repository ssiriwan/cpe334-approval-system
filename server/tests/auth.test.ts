import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { app } from '../src/app.js';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const REQUESTER_EMAIL = 'auth.requester@cpe334.local';
const REVIEWER_EMAIL = 'auth.reviewer@cpe334.local';

let passwordHash: string;

function getCookie(response: request.Response): string | undefined {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  return setCookie?.[0]?.split(';')[0];
}

async function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

beforeAll(async () => {
  passwordHash = await bcrypt.hash(PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { name: 'Auth Requester', role: Role.REQUESTER, passwordHash },
    create: {
      email: REQUESTER_EMAIL,
      name: 'Auth Requester',
      role: Role.REQUESTER,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: REVIEWER_EMAIL },
    update: { name: 'Auth Reviewer', role: Role.REVIEWER, passwordHash },
    create: {
      email: REVIEWER_EMAIL,
      name: 'Auth Reviewer',
      role: Role.REVIEWER,
      passwordHash,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [REQUESTER_EMAIL, REVIEWER_EMAIL] } },
  });
  await prisma.$disconnect();
});

describe('POST /api/auth/login', () => {
  it('TEST-AUTH-01: logs in with valid credentials and sets an httpOnly cookie', async () => {
    const response = await login(REQUESTER_EMAIL, PASSWORD);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      email: REQUESTER_EMAIL,
      name: 'Auth Requester',
      role: Role.REQUESTER,
    });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');

    const cookie = getCookie(response);
    expect(cookie).toContain('token=');
    expect(response.headers['set-cookie']?.[0]?.toLowerCase()).toContain('httponly');
  });

  it('TEST-AUTH-02: rejects wrong passwords and unknown users without setting a cookie', async () => {
    const wrongPassword = await login(REQUESTER_EMAIL, 'WrongPassword!');
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('UNAUTHORIZED');
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();

    const unknownUser = await login('unknown@cpe334.local', PASSWORD);
    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body.error.code).toBe('UNAUTHORIZED');
    expect(unknownUser.headers['set-cookie']).toBeUndefined();
  });

  it('rejects malformed login payloads with VALIDATION_ERROR', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me and POST /api/auth/logout', () => {
  it('TEST-AUTH-03: rejects unauthenticated /me, returns current user, and clears the session on logout', async () => {
    const unauthenticated = await request(app).get('/api/auth/me');
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe('UNAUTHORIZED');

    const agent = request.agent(app);
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });
    expect(loginResponse.status).toBe(200);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(REQUESTER_EMAIL);

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);

    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects tampered tokens', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=not-a-real-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects logout without a session', async () => {
    const response = await request(app).post('/api/auth/logout');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('role guard middleware', () => {
  it('TEST-AUTH-04: allows REVIEWER and rejects REQUESTER on a reviewer-only route', async () => {
    const { requireAuth, requireRole } = await import('../src/middleware/auth.js');
    const { errorHandler } = await import('../src/middleware/error.js');
    const guardApp = express();
    guardApp.use(cookieParser());
    guardApp.get(
      '/reviewer-only',
      requireAuth,
      requireRole(Role.REVIEWER),
      (_req, res) => res.status(200).json({ data: { ok: true } })
    );
    guardApp.use(errorHandler);

    const requesterLogin = await login(REQUESTER_EMAIL, PASSWORD);
    const requesterCookie = getCookie(requesterLogin);
    expect(requesterCookie).toBeDefined();

    const forbidden = await request(guardApp)
      .get('/reviewer-only')
      .set('Cookie', requesterCookie ?? '');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');

    const reviewerLogin = await login(REVIEWER_EMAIL, PASSWORD);
    const reviewerCookie = getCookie(reviewerLogin);
    expect(reviewerCookie).toBeDefined();

    const allowed = await request(guardApp)
      .get('/reviewer-only')
      .set('Cookie', reviewerCookie ?? '');
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.ok).toBe(true);
  });
});

describe('credential and token security', () => {
  it('TEST-AUTH-05: stores bcrypt cost 12 and issues an 8-hour JWT without leaking secrets', async () => {
    const response = await login(REQUESTER_EMAIL, PASSWORD);
    expect(response.status).toBe(200);

    const cookie = getCookie(response);
    expect(cookie).toBeDefined();

    const token = cookie?.split('=')[1];
    expect(token).toBeDefined();

    const payload = jwt.decode(token ?? '') as {
      exp: number;
      iat: number;
      role: string;
      sub: string;
    };
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
    expect(payload.role).toBe(Role.REQUESTER);

    const dbUser = await prisma.user.findUnique({
      where: { email: REQUESTER_EMAIL },
    });
    expect(dbUser?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(dbUser?.passwordHash).not.toContain(PASSWORD);
    expect(JSON.stringify(response.body)).not.toContain(passwordHash);
  });
});
