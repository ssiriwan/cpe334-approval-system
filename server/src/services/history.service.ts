import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

/**
 * F-05 (Deliverable 2): read-only audit view over the append-only history.
 *
 * Authorization is re-evaluated from the current request row, so a reviewer
 * who has been reassigned (F-06 resubmit / F-07 stage switch) can no longer
 * read the history. Only public user fields are serialized.
 */
export async function getRequestHistory(requestId: string, currentUserId: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, requesterId: true, assignedReviewerId: true },
  });

  if (!request) {
    throw new AppError(404, 'NOT_FOUND', 'Approval request was not found.');
  }

  if (request.requesterId !== currentUserId && request.assignedReviewerId !== currentUserId) {
    throw new AppError(403, 'ACCESS_DENIED', 'You do not have permission to view this request.');
  }

  const histories = await prisma.approvalHistory.findMany({
    where: { requestId: request.id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { actor: { select: PUBLIC_USER_SELECT } },
  });

  return { requestId: request.id, histories };
}
