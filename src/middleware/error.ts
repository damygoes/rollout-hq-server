import { Prisma } from '@prisma/client';
import z, { ZodError } from 'zod';

import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../errors/errorCodes';
import { fail } from '../utils/response';

import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // AppError from our code
  if (err instanceof AppError) {
    return res.status(err.status).json(fail(err.message, err.code, err.details));
  }

  // Zod validation
  if (err instanceof ZodError) {
    return res
      .status(HTTP_STATUS.VALIDATION)
      .json(fail('Invalid input', 'VALIDATION', z.treeifyError(err)));
  }

  // Prisma known errors (e.g., unique constraint)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(fail('Resource already exists', 'CONFLICT', { target: err.meta?.target }));
    }
    // Add more codes if useful (P2003 foreign key, etc.)
  }

  // JWT and similar auth errors: (optionally detect by name/message)
  const name = (err as Error)?.name;
  if (name === 'JsonWebTokenError' || name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTH).json(fail('Invalid token', 'UNAUTH'));
  }

  // Fallback
  const message =
    (err as Error)?.message && process.env.NODE_ENV !== 'production'
      ? (err as Error).message
      : 'Internal server error';
  return res.status(HTTP_STATUS.INTERNAL).json(fail(message, 'INTERNAL'));
}
