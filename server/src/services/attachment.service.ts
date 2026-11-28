import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { config } from '../config.js';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

/**
 * Upload an attachment to an approval request (F-08 / FR-09).
 *
 * Check order:
 * authentication (401) -> request existence (404) -> ownership/current-assignment (403) ->
 * file presence & MIME (400) -> size (400) -> write + DB insert -> 201.
 */
export async function uploadAttachment(
  requestId: string,
  uploaderId: string,
  file: Express.Multer.File | undefined
) {
  // 1. Request existence
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      requesterId: true,
      assignedReviewerId: true,
    },
  });

  if (!request) {
    throw new AppError(404, 'NOT_FOUND', 'Approval request was not found.');
  }

  // 2. Ownership / current-assignment check
  const isEligible =
    request.requesterId === uploaderId || request.assignedReviewerId === uploaderId;
  if (!isEligible) {
    throw new AppError(
      403,
      'ACCESS_DENIED',
      'You do not have permission to attach files to this request.'
    );
  }

  // 3. File presence check
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'File is required (field: file).',
      [{ field: 'file', code: 'MISSING_FILE' }]
    );
  }

  // 4. MIME validation
  const mime = file.mimetype.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mime as AllowedMimeType)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid file type. Allowed formats: PDF, PNG, JPEG.',
      [{ field: 'file', code: 'INVALID_ATTACHMENT_TYPE' }]
    );
  }

  // 5. Size limit check
  if (file.size > config.maxAttachmentBytes) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `File size exceeds maximum allowed limit of ${config.maxAttachmentMb} MB.`,
      [{ field: 'file', code: 'ATTACHMENT_TOO_LARGE' }]
    );
  }

  // 6. Write file to disk under UPLOAD_DIR with random UUID filename
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const rawExt = path.extname(file.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
  const relativeFilename = `${crypto.randomUUID()}${rawExt}`;
  const fullDiskPath = path.resolve(config.uploadDir, relativeFilename);

  await fs.promises.writeFile(fullDiskPath, file.buffer);

  // 7. DB insert with compensating delete on failure
  try {
    const record = await prisma.attachment.create({
      data: {
        requestId,
        uploaderId,
        filename: path.basename(file.originalname),
        mime,
        size: file.size,
        path: relativeFilename,
      },
      include: {
        uploader: { select: PUBLIC_USER_SELECT },
      },
    });

    // Never serialize the internal disk path
    const { path: _, ...publicAttachment } = record;
    return publicAttachment;
  } catch (dbError) {
    // Clean up orphan file on disk if DB insert fails
    try {
      await fs.promises.unlink(fullDiskPath);
    } catch {}
    throw dbError;
  }
}

/**
 * List all attachments for an approval request (F-08).
 *
 * Check order:
 * authentication (401) -> request existence (404) -> ownership/current-assignment (403) -> 200 list.
 */
export async function listAttachments(requestId: string, currentUserId: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      requesterId: true,
      assignedReviewerId: true,
    },
  });

  if (!request) {
    throw new AppError(404, 'NOT_FOUND', 'Approval request was not found.');
  }

  const isEligible =
    request.requesterId === currentUserId || request.assignedReviewerId === currentUserId;
  if (!isEligible) {
    throw new AppError(
      403,
      'ACCESS_DENIED',
      'You do not have permission to view attachments for this request.'
    );
  }

  const records = await prisma.attachment.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
    include: {
      uploader: { select: PUBLIC_USER_SELECT },
    },
  });

  // Never expose internal disk paths
  return records.map(({ path: _, ...rest }) => rest);
}

/**
 * Retrieve an attachment for download (F-08).
 *
 * Check order:
 * authentication (401) -> attachment existence (404) -> request existence (404) ->
 * ownership/current-assignment (403) -> stream bytes (200).
 */
export async function getAttachmentForDownload(attachmentId: string, currentUserId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      request: {
        select: {
          id: true,
          requesterId: true,
          assignedReviewerId: true,
        },
      },
    },
  });

  if (!attachment || !attachment.request) {
    throw new AppError(404, 'NOT_FOUND', 'Attachment was not found.');
  }

  // Authorization is re-evaluated dynamically from current assignedReviewerId
  const isEligible =
    attachment.request.requesterId === currentUserId ||
    attachment.request.assignedReviewerId === currentUserId;

  if (!isEligible) {
    throw new AppError(
      403,
      'ACCESS_DENIED',
      'You do not have permission to download this attachment.'
    );
  }

  const fullPath = path.resolve(config.uploadDir, attachment.path);
  if (!fs.existsSync(fullPath)) {
    throw new AppError(404, 'NOT_FOUND', 'Attachment file not found on disk.');
  }

  return {
    filename: attachment.filename,
    mime: attachment.mime,
    size: attachment.size,
    fullPath,
  };
}
