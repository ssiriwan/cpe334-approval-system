import {
  HistoryAction,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { filterWhere, type ParsedFilters } from '../validation/filters.js';
import { resolveStage2ReviewerId } from './request.service.js';

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

const returnDecisionSchema = z
  .object({
    comment: z
      .string({ required_error: 'A return comment is required.' })
      .trim()
      .min(3, 'A return comment of at least 3 characters is required.')
      .max(500, 'Comment must not exceed 500 characters.'),
  })
  .strict();

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
export async function listPendingReviews(reviewerId: string, filters: ParsedFilters = {}) {
  const records = await prisma.approvalRequest.findMany({
    where: {
      AND: [
        {
          assignedReviewerId: reviewerId,
          // F-07: the stage-2 reviewer also needs a queue; the assignment
          // switch at stage-1 approval keeps this exclusive per current stage.
          status: { in: [RequestStatus.PENDING, RequestStatus.PENDING_STAGE2] },
        },
        filterWhere(filters),
      ],
    },
    orderBy: [{ createdAt: 'asc' }, { requestNo: 'asc' }],
    include: {
      requester: { select: PUBLIC_USER_SELECT },
      assignedReviewer: { select: PUBLIC_USER_SELECT },
    },
  });

  const requests = records.map(serializeRequest);
  return { requests, count: requests.length };
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
      amount: true,
      stage: true,
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

  // BR-02: decisions are single-shot from PENDING, or from PENDING_STAGE2 at
  // the second stage of a high-value request (F-07).
  if (
    existing.status !== RequestStatus.PENDING &&
    existing.status !== RequestStatus.PENDING_STAGE2
  ) {
    throw new AppError(
      400,
      'INVALID_STATE_TRANSITION',
      `Request is already ${existing.status}.`
    );
  }

  const isMultiStage = existing.amount.toNumber() > 5000;
  const currentStage = existing.status === RequestStatus.PENDING_STAGE2 ? 2 : existing.stage;
  if (existing.status === RequestStatus.PENDING_STAGE2 && !isMultiStage) {
    throw new AppError(
      400,
      'INVALID_STATE_TRANSITION',
      'A single-stage request cannot be in the second stage.'
    );
  }

  // BR-07: validate the payload only after role/self/assignment/state checks.
  const payload = reviewDecisionSchema.parse(body ?? {});
  const isStage1Approval = payload.decision === 'APPROVE' && isMultiStage && currentStage === 1;
  const nextStatus = isStage1Approval
    ? RequestStatus.PENDING_STAGE2
    : payload.decision === 'APPROVE'
      ? RequestStatus.APPROVED
      : RequestStatus.REJECTED;
  const action =
    payload.decision === 'APPROVE' ? HistoryAction.APPROVED : HistoryAction.REJECTED;
  const comment = payload.comment && payload.comment.length > 0 ? payload.comment : null;

  return prisma.$transaction(async (tx) => {
    // Stage 2 is assigned to the distinct eligible reviewer at stage-1
    // approval; the requester can never be selected (BR-01).
    const stage2ReviewerId = isStage1Approval
      ? await resolveStage2ReviewerId(tx, existing.requesterId, existing.assignedReviewerId!)
      : undefined;

    // Conditional write guards against two reviewers / double submits.
    const updated = await tx.approvalRequest.updateMany({
      where: { id: requestId, status: existing.status },
      data: {
        status: nextStatus,
        stage: isStage1Approval ? 2 : currentStage,
        ...(stage2ReviewerId ? { assignedReviewerId: stage2ReviewerId } : {}),
      },
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
        stage: currentStage,
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

/**
 * Return a request for revision (F-06 / FR-07).
 *
 * Check order:
 * existence -> BR-01 self-approval -> BR-05 assignment -> BR-02 state ->
 * payload validation (3-500 chars comment) -> transactional update to RETURNED + append history.
 */
export async function returnRequest(
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
      stage: true,
    },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Approval request was not found.');
  }

  // BR-01: self-approval guard before assignment guard
  if (existing.requesterId === reviewerId) {
    throw new AppError(
      403,
      'SELF_APPROVAL_NOT_ALLOWED',
      'You cannot approve, reject, or return your own request.'
    );
  }

  // BR-05: assignment guard
  if (existing.assignedReviewerId !== reviewerId) {
    throw new AppError(
      403,
      'ACCESS_DENIED',
      'This request is not assigned to you.'
    );
  }

  // BR-02: return is only allowed from PENDING
  if (existing.status !== RequestStatus.PENDING) {
    throw new AppError(
      400,
      'INVALID_STATE_TRANSITION',
      `Request is already ${existing.status}.`
    );
  }

  // Payload validation after guards
  const payload = returnDecisionSchema.parse(body ?? {});

  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalRequest.updateMany({
      where: { id: requestId, status: RequestStatus.PENDING },
      data: { status: RequestStatus.RETURNED },
    });

    if (updated.count === 0) {
      throw new AppError(
        400,
        'INVALID_STATE_TRANSITION',
        'Request has already been decided or returned.'
      );
    }

    const history = await tx.approvalHistory.create({
      data: {
        requestId,
        actorId: reviewerId,
        action: HistoryAction.RETURNED,
        stage: existing.stage,
        comment: payload.comment,
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
