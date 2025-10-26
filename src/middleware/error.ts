// single source to handle errors across the application
import { z, ZodError } from 'zod';

import { fail } from '../utils/response';

import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json(fail('Validation error', 'VALIDATION_ERROR', z.treeifyError(err)));
  }
  if (err?.status && err?.message) {
    return res.status(err.status).json(fail(err.message, err.code));
  }
  console.error(err);
  return res.status(500).json(fail('Internal server error', 'INTERNAL'));
}
