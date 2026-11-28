import { RequestStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';

/**
 * F-09 query filters. Values mirror the BR-04 category whitelist and the
 * RequestStatus enum. Kept here (rather than importing the service) to avoid a
 * circular dependency between services and validation.
 */
const STATUSES = [
  'PENDING',
  'PENDING_STAGE2',
  'RETURNED',
  'APPROVED',
  'REJECTED',
] as const;

const CATEGORIES = ['EQUIPMENT', 'TRAVEL', 'SOFTWARE', 'SUPPLIES'] as const;

const filterSchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be an ISO date (YYYY-MM-DD).')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be an ISO date (YYYY-MM-DD).')
    .optional(),
});

export interface ParsedFilters {
  status?: RequestStatus;
  category?: string;
  from?: Date;
  to?: Date;
}

export function parseRequestFilters(query: unknown): ParsedFilters {
  const parsed = filterSchema.safeParse(query ?? {});
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Query filters are invalid.',
      parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'query',
        message: issue.message,
      }))
    );
  }

  const { status, category, from, to } = parsed.data;
  if (from && to && from > to) {
    throw new AppError(400, 'VALIDATION_ERROR', 'from must not be later than to.', [
      { field: 'from', message: 'from must not be later than to.' },
    ]);
  }

  // Asia/Bangkok (UTC+7) inclusive day bounds avoid timezone drift.
  const fromDate = from ? new Date(`${from}T00:00:00.000+07:00`) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999+07:00`) : undefined;
  if ((fromDate && Number.isNaN(fromDate.valueOf())) || (toDate && Number.isNaN(toDate.valueOf()))) {
    throw new AppError(400, 'VALIDATION_ERROR', 'from/to must be valid calendar dates.', [
      { field: 'from/to', message: 'Invalid calendar date.' },
    ]);
  }

  return {
    ...(status ? { status: status as RequestStatus } : {}),
    ...(category ? { category } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };
}

/**
 * Build only the optional filter predicate. Callers MUST combine it with
 * their base ownership/role predicate via `AND` so a filter can never widen
 * what the caller is allowed to see (BR-03/BR-05).
 */
export function filterWhere(filters: ParsedFilters): Prisma.ApprovalRequestWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };
}
