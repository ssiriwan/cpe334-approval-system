import { HistoryAction, Prisma, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

export const ALLOWED_CATEGORIES = ['EQUIPMENT', 'TRAVEL', 'SOFTWARE', 'SUPPLIES'] as const;
export type RequestCategory = (typeof ALLOWED_CATEGORIES)[number];

export interface CreateRequestInput {
  title: string;
  amount: number;
  category: RequestCategory;
  description: string;
}

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

const CATEGORY_PRIMARY_REVIEWER: Record<RequestCategory, string> = {
  EQUIPMENT: 't.reviewer@cpe334.local',
  TRAVEL: 't.reviewer@cpe334.local',
  SOFTWARE: 'manager.hybrid@cpe334.local',
  SUPPLIES: 'manager.hybrid@cpe334.local',
};

const CATEGORY_FALLBACK_REVIEWER: Record<RequestCategory, string> = {
  EQUIPMENT: 'manager.hybrid@cpe334.local',
  TRAVEL: 'manager.hybrid@cpe334.local',
  SOFTWARE: 't.reviewer@cpe334.local',
  SUPPLIES: 't.reviewer@cpe334.local',
};

function formatDatePrefix(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `REQ-${year}${month}${day}-`;
}

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
 * Get hour in Asia/Bangkok (UTC+7) timezone.
 */
function getBangkokHour(date: Date): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: 'numeric',
    hour12: false,
  });
  return Number.parseInt(formatter.format(date), 10);
}

/**
 * Resolve deterministic reviewer based on category, amount, and submission time (BR-05 v1.1).
 * Normal requests (amount <= 5000.00 THB and within 08:00-17:59 Asia/Bangkok) use category mapping.
 * Escalated requests (amount > 5000.00 THB or out-of-hours) escalate to manager.hybrid.
 * If the selected reviewer is the requester, fall back to alternate reviewer (BR-01).
 */
export async function resolveAssignedReviewerId(
  tx: Prisma.TransactionClient,
  category: RequestCategory,
  requesterId: string,
  amount: number,
  now: Date = new Date()
): Promise<string> {
  const ESCALATED_REVIEWER_EMAIL = 'manager.hybrid@cpe334.local';
  const bangkokHour = getBangkokHour(now);
  const isOutOfHours = bangkokHour < 8 || bangkokHour >= 18;
  const isHighAmount = amount > 5000;
  const isEscalated = isHighAmount || isOutOfHours;

  const candidateEmail = isEscalated
    ? ESCALATED_REVIEWER_EMAIL
    : CATEGORY_PRIMARY_REVIEWER[category];

  const candidate = await tx.user.findUnique({
    where: { email: candidateEmail },
    select: { id: true, role: true },
  });

  if (candidate && candidate.role === Role.REVIEWER && candidate.id !== requesterId) {
    return candidate.id;
  }

  // Fallback when candidate is requester or not eligible
  const fallbackEmail = candidateEmail === ESCALATED_REVIEWER_EMAIL
    ? 't.reviewer@cpe334.local'
    : CATEGORY_FALLBACK_REVIEWER[category];

  const fallback = await tx.user.findUnique({
    where: { email: fallbackEmail },
    select: { id: true, role: true },
  });

  if (fallback && fallback.role === Role.REVIEWER && fallback.id !== requesterId) {
    return fallback.id;
  }

  const anyOtherReviewer = await tx.user.findFirst({
    where: {
      role: Role.REVIEWER,
      id: { not: requesterId },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!anyOtherReviewer) {
    throw new AppError(500, 'INTERNAL_ERROR', 'No eligible reviewer available for assignment.');
  }

  return anyOtherReviewer.id;
}

async function generateNextRequestNo(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = formatDatePrefix(new Date());
  const latest = await tx.approvalRequest.findFirst({
    where: { requestNo: { startsWith: prefix } },
    orderBy: { requestNo: 'desc' },
    select: { requestNo: true },
  });

  let nextSeq = 1;
  if (latest) {
    const suffix = latest.requestNo.slice(prefix.length);
    const parsed = Number.parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export async function createRequest(requesterId: string, input: CreateRequestInput) {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const assignedReviewerId = await resolveAssignedReviewerId(
          tx,
          input.category,
          requesterId,
          input.amount
        );
        const requestNo = await generateNextRequestNo(tx);

        const approvalRequest = await tx.approvalRequest.create({
          data: {
            requestNo,
            title: input.title,
            amount: new Prisma.Decimal(input.amount.toFixed(2)),
            category: input.category,
            description: input.description,
            status: RequestStatus.PENDING,
            requesterId,
            assignedReviewerId,
            histories: {
              create: {
                actorId: requesterId,
                action: HistoryAction.SUBMITTED,
                comment: null,
              },
            },
          },
          include: {
            requester: { select: PUBLIC_USER_SELECT },
            assignedReviewer: { select: PUBLIC_USER_SELECT },
          },
        });

        return approvalRequest;
      });

      return serializeRequest(created);
    } catch (error) {
      const isUniqueConflict =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

      if (isUniqueConflict && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(500, 'INTERNAL_ERROR', 'Unable to generate a unique request number.');
}

export async function listMyRequests(requesterId: string) {
  const records = await prisma.approvalRequest.findMany({
    where: { requesterId },
    orderBy: [{ createdAt: 'desc' }, { requestNo: 'desc' }],
    include: {
      requester: { select: PUBLIC_USER_SELECT },
      assignedReviewer: { select: PUBLIC_USER_SELECT },
    },
  });

  return records.map(serializeRequest);
}

export async function getRequestDetail(requestId: string, currentUserId: string) {
  const record = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: PUBLIC_USER_SELECT },
      assignedReviewer: { select: PUBLIC_USER_SELECT },
      histories: {
        orderBy: { createdAt: 'asc' },
        include: {
          actor: { select: PUBLIC_USER_SELECT },
        },
      },
    },
  });

  if (!record) {
    throw new AppError(404, 'NOT_FOUND', 'Approval request was not found.');
  }

  if (record.requesterId !== currentUserId && record.assignedReviewerId !== currentUserId) {
    throw new AppError(403, 'ACCESS_DENIED', 'You do not have permission to view this request.');
  }

  const { histories, ...requestFields } = record;
  return {
    request: serializeRequest(requestFields),
    histories,
  };
}
