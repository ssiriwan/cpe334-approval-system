import path from 'node:path';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAttachmentForDownload } from '../services/attachment.service.js';

export const attachmentsRouter = Router();

attachmentsRouter.use(requireAuth);

attachmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const fileInfo = await getAttachmentForDownload(String(req.params.id), req.user!.id);

    res.setHeader('Content-Type', fileInfo.mime);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileInfo.filename)}"`
    );
    res.sendFile(path.resolve(fileInfo.fullPath));
  } catch (error) {
    next(error);
  }
});
