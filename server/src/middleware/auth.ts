import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { getUserFromToken } from '../services/auth.service.js';

export const SESSION_COOKIE = 'token';

/** Reject requests without a valid session and attach the current user. */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE];

    if (typeof token !== 'string' || token.length === 0) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }

    req.user = await getUserFromToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

/** Allow only the listed roles. Must run after `requireAuth`. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.')
      );
      return;
    }

    next();
  };
}
