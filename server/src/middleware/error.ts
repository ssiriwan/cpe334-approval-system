import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { config } from '../config.js';
import { AppError } from '../lib/errors.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} was not found.`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload is invalid.',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // F-PB-02: body-parser rejects an oversized body before any route runs.
  // Map it to the standard 4xx validation shape instead of falling through to 500.
  if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body is too large.',
      },
    });
    return;
  }

  // Multer errors (e.g. file size boundary or unexpected field)
  if (error && typeof error === 'object' && 'name' in error && error.name === 'MulterError') {
    const multerErr = error as { code?: string; message?: string };
    const errCode = multerErr.code === 'LIMIT_FILE_SIZE' ? 'ATTACHMENT_TOO_LARGE' : 'VALIDATION_ERROR';
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: multerErr.message || 'File upload error.',
        details: [{ field: 'file', code: errCode }],
      },
    });
    return;
  }

  // Malformed JSON bodies are rejected by express.json() with a SyntaxError.
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body is not valid JSON.',
      },
    });
    return;
  }

  if (!config.isProduction) {
    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, error);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};
