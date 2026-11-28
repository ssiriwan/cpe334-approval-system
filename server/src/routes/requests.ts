import { Router } from 'express';
import { Role } from '@prisma/client';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createRequest,
  createRequestSchema,
  getRequestDetail,
  listMyRequests,
  resubmitRequest,
} from '../services/request.service.js';
import { listPendingReviews, returnRequest, submitReview } from '../services/review.service.js';
import { getRequestHistory } from '../services/history.service.js';
import { parseRequestFilters } from '../validation/filters.js';
import { listAttachments, uploadAttachment } from '../services/attachment.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

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
    const filters = parseRequestFilters(req.query);
    const { requests, count } = await listMyRequests(req.user!.id, filters);
    res.status(200).json({ data: { requests, count } });
  } catch (error) {
    next(error);
  }
});

requestsRouter.get(
  '/pending',
  requireRole(Role.REVIEWER),
  async (req, res, next) => {
    try {
      const filters = parseRequestFilters(req.query);
      const { requests, count } = await listPendingReviews(req.user!.id, filters);
      res.status(200).json({ data: { requests, count } });
    } catch (error) {
      next(error);
    }
  }
);

// F-05: read-only audit endpoint. Registered before `/:id` so the route
// intent is explicit; Express still matches `/:id` only for a single segment.
requestsRouter.get('/:id/history', async (req, res, next) => {
  try {
    const history = await getRequestHistory(req.params.id, req.user!.id);
    res.status(200).json({ data: history });
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

requestsRouter.post(
  '/:id/review',
  requireRole(Role.REVIEWER),
  async (req, res, next) => {
    try {
      const result = await submitReview(String(req.params.id), req.user!.id, req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

requestsRouter.post(
  '/:id/return',
  requireRole(Role.REVIEWER),
  async (req, res, next) => {
    try {
      const result = await returnRequest(String(req.params.id), req.user!.id, req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

requestsRouter.post('/:id/resubmit', async (req, res, next) => {
  try {
    const result = await resubmitRequest(String(req.params.id), req.user!.id, req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

requestsRouter.post(
  '/:id/attachments',
  upload.single('file'),
  async (req, res, next) => {
    try {
      const attachment = await uploadAttachment(
        String(req.params.id),
        req.user!.id,
        req.file
      );
      res.status(201).json({ data: { attachment } });
    } catch (error) {
      next(error);
    }
  }
);

requestsRouter.get('/:id/attachments', async (req, res, next) => {
  try {
    const attachments = await listAttachments(
      String(req.params.id),
      req.user!.id
    );
    res.status(200).json({ data: { attachments } });
  } catch (error) {
    next(error);
  }
});
