import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  ALLOWED_CATEGORIES,
  createRequest,
  getRequestDetail,
  listMyRequests,
} from '../services/request.service.js';

const createRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must contain at least 3 characters.')
      .max(150, 'Title must not exceed 150 characters.'),
    amount: z
      .number()
      .finite('Amount must be a finite number.')
      .positive('Amount must be greater than 0.')
      .max(9999999999.99, 'Amount exceeds the maximum allowed value (9,999,999,999.99).')
      .refine(
        (val) => Math.abs(val * 100 - Math.round(val * 100)) < 1e-8,
        'Amount must have at most 2 decimal places.'
      ),
    category: z.enum(ALLOWED_CATEGORIES),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required.')
      .max(1000, 'Description must not exceed 1,000 characters.'),
  })
  .strict();

export const requestsRouter = Router();

requestsRouter.use(requireAuth);

requestsRouter.post(
  '/',
  requireRole(Role.REQUESTER, Role.REVIEWER),
  async (req, res, next) => {
    try {
      const payload = createRequestSchema.parse(req.body ?? {});
      const created = await createRequest(req.user!.id, payload);
      res.status(201).json({ data: { request: created } });
    } catch (error) {
      next(error);
    }
  }
);

requestsRouter.get('/my', async (req, res, next) => {
  try {
    const requests = await listMyRequests(req.user!.id);
    res.status(200).json({ data: { requests } });
  } catch (error) {
    next(error);
  }
});

requestsRouter.get('/:id', async (req, res, next) => {
  try {
    const detail = await getRequestDetail(req.params.id, req.user!.id);
    res.status(200).json({ data: detail });
  } catch (error) {
    next(error);
  }
});
