import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, RequestStatus, Role } from '@prisma/client';
import { app } from '../src/app.js';
import { config } from '../src/config.js';

/**
 * F-08 / Deliverable 2 - TEST-17.1..17.6 (AC-16.1..16.6).
 * RED phase: upload/download endpoints do not exist yet.
 */
const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const OWNER_EMAIL = 'oum.requester@cpe334.local';
const STAGE1_EMAIL = 'manager.hybrid@cpe334.local';
const STAGE2_EMAIL = 't.reviewer@cpe334.local';
const OTHER_EMAIL = 'f08.other.requester@cpe334.local';

let ownerId: string;
let stage1Id: string;
let stage2Id: string;
let otherId: string;
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

async function createTestRequest(amount = 1500, category = 'EQUIPMENT'): Promise<string> {
  const ownerCookie = await loginCookie(OWNER_EMAIL);
  const res = await request(app)
    .post('/api/requests')
    .set('Cookie', ownerCookie)
    .send({
      title: 'F-08 attachments test request',
      amount,
      category,
      description: 'Request for attachment testing',
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
  stage1Id = (await upsert(STAGE1_EMAIL, 'Manager Hybrid', Role.REVIEWER)).id;
  stage2Id = (await upsert(STAGE2_EMAIL, 'T Reviewer', Role.REVIEWER)).id;
  otherId = (await upsert(OTHER_EMAIL, 'F08 Other Requester', Role.REQUESTER)).id;
});

afterAll(async () => {
  if (createdRequestIds.length > 0) {
    const attachments = await prisma.attachment.findMany({
      where: { requestId: { in: createdRequestIds } },
    });
    for (const att of attachments) {
      const fullPath = path.resolve(config.uploadDir, att.path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch {}
      }
    }
    await prisma.approvalRequest.deleteMany({ where: { id: { in: createdRequestIds } } });
  }
  await prisma.user.deleteMany({ where: { email: OTHER_EMAIL } });
  await prisma.$disconnect();
});

describe('F-08 request attachments (TEST-17.1..17.6)', () => {
  it('TEST-17.1: owner uploads valid synthetic PNG (2 KB) -> 201; retrievable via GET /api/attachments/:id', async () => {
    const requestId = await createTestRequest(1500);
    const ownerCookie = await loginCookie(OWNER_EMAIL);

    const syntheticPng = Buffer.alloc(2048, 0x89);

    const uploadRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', syntheticPng, 'receipt.png');

    expect(uploadRes.status).toBe(201);
    const att = uploadRes.body.data.attachment;
    expect(att.id).toBeDefined();
    expect(att.requestId).toBe(requestId);
    expect(att.filename).toBe('receipt.png');
    expect(att.mime).toBe('image/png');
    expect(att.size).toBe(2048);
    expect(att.uploader.email).toBe(OWNER_EMAIL);
    expect(att.path).toBeUndefined(); // internal path is never exposed!

    // Download via GET /api/attachments/:id
    const downloadRes = await request(app)
      .get(`/api/attachments/${att.id}`)
      .set('Cookie', ownerCookie);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toContain('image/png');
    expect(downloadRes.headers['content-disposition']).toContain('filename="receipt.png"');
    expect(Buffer.compare(downloadRes.body as Buffer, syntheticPng)).toBe(0);
  });

  it('TEST-17.2: wrong MIME, oversize file (>5MB), or missing file -> 400 VALIDATION_ERROR; no row/file', async () => {
    const requestId = await createTestRequest(1500);
    const ownerCookie = await loginCookie(OWNER_EMAIL);

    const beforeCount = await prisma.attachment.count({ where: { requestId } });

    // 1. Wrong MIME (.txt)
    const badMimeRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', Buffer.from('plain text content'), 'notes.txt');

    expect(badMimeRes.status).toBe(400);
    expect(badMimeRes.body.error.code).toBe('VALIDATION_ERROR');
    expect(
      badMimeRes.body.error.message.includes('INVALID_ATTACHMENT_TYPE') ||
        JSON.stringify(badMimeRes.body).includes('INVALID_ATTACHMENT_TYPE')
    ).toBe(true);

    // 2. Oversize (> 5MB)
    const oversizeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 0x25); // 5MB + 1KB
    const oversizeRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', oversizeBuffer, { filename: 'large.pdf', contentType: 'application/pdf' });

    expect(oversizeRes.status).toBe(400);
    expect(oversizeRes.body.error.code).toBe('VALIDATION_ERROR');
    expect(
      oversizeRes.body.error.message.includes('ATTACHMENT_TOO_LARGE') ||
        JSON.stringify(oversizeRes.body).includes('ATTACHMENT_TOO_LARGE')
    ).toBe(true);

    // 3. Missing file
    const missingFileRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .send();

    expect(missingFileRes.status).toBe(400);
    expect(missingFileRes.body.error.code).toBe('VALIDATION_ERROR');
    expect(
      missingFileRes.body.error.message.includes('MISSING_FILE') ||
        JSON.stringify(missingFileRes.body).includes('MISSING_FILE')
    ).toBe(true);

    // No row created
    const afterCount = await prisma.attachment.count({ where: { requestId } });
    expect(afterCount).toBe(beforeCount);
  });

  it('TEST-17.3: owner lists attachments -> 200 metadata only, path strictly omitted', async () => {
    const requestId = await createTestRequest(1500);
    const ownerCookie = await loginCookie(OWNER_EMAIL);

    // Upload two files
    await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', Buffer.alloc(512, 0x25), { filename: 'doc1.pdf', contentType: 'application/pdf' });

    await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', Buffer.alloc(1024, 0xff), { filename: 'photo.jpg', contentType: 'image/jpeg' });

    const listRes = await request(app)
      .get(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie);

    expect(listRes.status).toBe(200);
    const attachments = listRes.body.data.attachments as Array<Record<string, unknown>>;
    expect(attachments).toHaveLength(2);
    for (const item of attachments) {
      expect(item.id).toBeDefined();
      expect(item.filename).toBeDefined();
      expect(item.mime).toBeDefined();
      expect(item.size).toBeDefined();
      expect(item.uploader).toBeDefined();
      expect(item.path).toBeUndefined(); // path is NEVER exposed
    }
  });

  it('TEST-17.4: assigned reviewer downloads -> 200; after reassignment previous reviewer receives 403', async () => {
    // High-value request (7500): stage 1 reviewer is manager.hybrid
    const requestId = await createTestRequest(7500);
    const ownerCookie = await loginCookie(OWNER_EMAIL);
    const stage1Cookie = await loginCookie(STAGE1_EMAIL);
    const stage2Cookie = await loginCookie(STAGE2_EMAIL);

    const uploadRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', Buffer.alloc(1024, 0x89), 'invoice.png');
    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.data.attachment.id as string;

    // Stage 1 reviewer can download
    const s1Download = await request(app)
      .get(`/api/attachments/${attachmentId}`)
      .set('Cookie', stage1Cookie);
    expect(s1Download.status).toBe(200);

    // Stage 2 reviewer cannot download yet (assigned to stage 1 reviewer)
    const s2Before = await request(app)
      .get(`/api/attachments/${attachmentId}`)
      .set('Cookie', stage2Cookie);
    expect(s2Before.status).toBe(403);
    expect(s2Before.body.error.code).toBe('ACCESS_DENIED');

    // Stage 1 approves -> request moves to PENDING_STAGE2 and reviewer switches to stage2
    const approveRes = await request(app)
      .post(`/api/requests/${requestId}/review`)
      .set('Cookie', stage1Cookie)
      .send({ decision: 'APPROVE', comment: 'Stage 1 approved' });
    expect(approveRes.status).toBe(200);

    // Now Stage 2 reviewer CAN download
    const s2After = await request(app)
      .get(`/api/attachments/${attachmentId}`)
      .set('Cookie', stage2Cookie);
    expect(s2After.status).toBe(200);

    // Previous Stage 1 reviewer CAN NO LONGER download -> 403 ACCESS_DENIED
    const s1After = await request(app)
      .get(`/api/attachments/${attachmentId}`)
      .set('Cookie', stage1Cookie);
    expect(s1After.status).toBe(403);
    expect(s1After.body.error.code).toBe('ACCESS_DENIED');
  });

  it('TEST-17.5: other user -> 403; unauthenticated -> 401; unknown id -> 404; empty error bodies', async () => {
    const requestId = await createTestRequest(1500);
    const ownerCookie = await loginCookie(OWNER_EMAIL);
    const otherCookie = await loginCookie(OTHER_EMAIL);

    const uploadRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', Buffer.alloc(512, 0x89), 'spec.png');
    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.data.attachment.id as string;

    // 1. Other user lists attachments -> 403 ACCESS_DENIED
    const otherList = await request(app)
      .get(`/api/requests/${requestId}/attachments`)
      .set('Cookie', otherCookie);
    expect(otherList.status).toBe(403);
    expect(otherList.body.error.code).toBe('ACCESS_DENIED');

    // 2. Other user downloads attachment -> 403 ACCESS_DENIED
    const otherDownload = await request(app)
      .get(`/api/attachments/${attachmentId}`)
      .set('Cookie', otherCookie);
    expect(otherDownload.status).toBe(403);
    expect(otherDownload.body.error.code).toBe('ACCESS_DENIED');

    // 3. Unauthenticated list -> 401
    const unauthList = await request(app).get(`/api/requests/${requestId}/attachments`);
    expect(unauthList.status).toBe(401);

    // 4. Unauthenticated download -> 401
    const unauthDownload = await request(app).get(`/api/attachments/${attachmentId}`);
    expect(unauthDownload.status).toBe(401);

    // 5. Unknown attachment ID -> 404
    const unknownDownload = await request(app)
      .get('/api/attachments/00000000-0000-0000-0000-000000000000')
      .set('Cookie', ownerCookie);
    expect(unknownDownload.status).toBe(404);
  });

  it('TEST-17.6: attachments are append-only; PUT/PATCH/DELETE endpoints return 404', async () => {
    const requestId = await createTestRequest(1500);
    const ownerCookie = await loginCookie(OWNER_EMAIL);

    const uploadRes = await request(app)
      .post(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .attach('file', Buffer.alloc(512, 0x89), 'fixed.png');
    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.data.attachment.id as string;

    // Attempt PUT
    const putRes = await request(app)
      .put(`/api/requests/${requestId}/attachments`)
      .set('Cookie', ownerCookie)
      .send({});
    expect(putRes.status).toBe(404);

    // Attempt DELETE
    const deleteRes = await request(app)
      .delete(`/api/attachments/${attachmentId}`)
      .set('Cookie', ownerCookie);
    expect(deleteRes.status).toBe(404);
  });
});
