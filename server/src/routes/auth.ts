import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { SESSION_COOKIE, requireAuth } from '../middleware/auth.js';
import { authenticate, issueToken } from '../services/auth.service.js';

const loginSchema = z
  .object({
    email: z.string().trim().email('Email must be a valid email address.'),
    password: z.string().min(1, 'Password is required.').max(200),
  })
  .strict();

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.cookieSecure,
    path: '/',
    maxAge: config.jwtExpiresInSeconds * 1000,
  };
}

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body ?? {});
    const user = await authenticate(email, password);

    res.cookie(SESSION_COOKIE, issueToken(user), sessionCookieOptions());
    res.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  });
  res.status(200).json({ data: { message: 'Logged out.' } });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ data: { user: req.user } });
});
