import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import type { PublicUser } from '../types/auth.js';

export interface TokenPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
const INVALID_SESSION_MESSAGE = 'Authentication is required.';

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Verify credentials and return the public user.
 * Unknown email and wrong password both return the same 401 response so the
 * endpoint does not reveal which accounts exist.
 */
export async function authenticate(email: string, password: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'UNAUTHORIZED', INVALID_CREDENTIALS_MESSAGE);
  }

  return toPublicUser(user);
}

/** Sign a stateless HS256 session token for the given user. */
export function issueToken(user: PublicUser): string {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: config.jwtExpiresInSeconds,
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Unexpected token payload');
    }

    return payload as unknown as TokenPayload;
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', INVALID_SESSION_MESSAGE);
  }
}

/**
 * Resolve the current user from a session token.
 * A token for a deleted user is treated as an invalid session.
 */
export async function getUserFromToken(token: string): Promise<PublicUser> {
  const payload = verifyToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', INVALID_SESSION_MESSAGE);
  }

  return toPublicUser(user);
}
