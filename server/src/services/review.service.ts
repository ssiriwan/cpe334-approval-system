import {
  HistoryAction,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

const reviewDecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT'], {
      errorMap: () => ({ message: 'Decision must be APPROVE or REJECT.' }),
    }),
    comment: z
      .string()
      .trim()
      .max(500, 'Comment must not exceed 500 characters.')
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.decision === 'REJECT' && (value.comment?.length ?? 0) < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['comment'],
        message: 'A rejection comment of at least 3 characters is required.',
      });
    }
  });

function serializeRequest<
  T extends {
    amount: Prisma.Decimal;
  }
>(record: T): Omit<T, 'amount'> & { amount: string } {
  return {
    ...record,
    amount: record.amount.toFixed(2),
  };
}

/**
 * List the pending review queue for one reviewer.
 * BR-05/BR-03: only requests explicitly assigned to this reviewer, and only
 * while they are still PENDING. Oldest first so the queue is FIFO.
 */
export async function listPendingReviews(reviewerId: string) {
  const records = await prisma.approvalRequest.findMany({
    where: {
      assignedReviewerId: reviewerId,
      status: RequestStatus.PENDING,
    },
    orderBy: [{ createdAt: 'asc' }, { requestNo: 'asc' }],
    include: {
      requester: { select: PUBLIC_USER_SELECT },
      assignedReviewer: { select: PUBLIC_USER_SELECT },
    },
  });

  return records.map(serializeRequest);
}

/**
 * Record an approve/reject decision.
 *
 * The check order is part of the contract:
 * existence -> BR-01 self-approval -> BR-05 assignment -> BR-02 state ->
 * BR-07 payload validation -> transactional update + append-only history.
 */
export async function submitReview(
  requestId: string,
  reviewerId: string,
  body: unknown
) {
  const existing = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      requesterId: true,
      assignedReviewerId: true,
      status: true,
    },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Approval request was not found.');
  }

  // BR-01 runs before the assignment check so an owner can never approve their
  // own request, even when it is assigned to another reviewer.
  if (existing.requesterId === reviewerId) {
    throw new AppError(
      403,
      'SELF_APPROVAL_NOT_ALLOWED',
      'You cannot approve or reject your own request.'
    );
  }

  // BR-05: only the assigned reviewer may decide.
  if (existing.assignedReviewerId !== reviewerId) {
    throw new AppError(
      403,
      'ACCESS_DENIED',
      'This request is not assigned to you.'
    );
  }

  // BR-02: decisions are single-shot from PENDING only.
  if (existing.status !== RequestStatus.PENDING) {
    throw new AppError(
      400,
      'INVALID_STATE_TRANSITION',
      `Request is already ${existing.status}.`
    );
  }

  // BR-07: validate the payload only after role/self/assignment/state checks.
  const payload = reviewDecisionSchema.parse(body ?? {});
  const nextStatus =
    payload.decision === 'APPROVE' ? RequestStatus.APPROVED : RequestStatus.REJECTED;
  const action =
    payload.decision === 'APPROVE' ? HistoryAction.APPROVED : HistoryAction.REJECTED;
  const comment = payload.comment && payload.comment.length > 0 ? payload.comment : null;

  return prisma.$transaction(async (tx) => {
    // Conditional write guards against two reviewers / double submits.
    const updated = await tx.approvalRequest.updateMany({
      where: { id: requestId, status: RequestStatus.PENDING },
      data: { status: nextStatus },
    });

    if (updated.count === 0) {
      throw new AppError(
        400,
        'INVALID_STATE_TRANSITION',
        'Request has already been decided.'
      );
    }

    const history = await tx.approvalHistory.create({
      data: {
        requestId,
        actorId: reviewerId,
        action,
        comment,
      },
      include: {
        actor: { select: PUBLIC_USER_SELECT },
      },
    });

    const request = await tx.approvalRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: {
        requester: { select: PUBLIC_USER_SELECT },
        assignedReviewer: { select: PUBLIC_USER_SELECT },
      },
    });

    return {
      request: serializeRequest(request),
      history,
    };
  });
}
