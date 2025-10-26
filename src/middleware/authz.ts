// reusable guards for auth & role checks.
import jwt from 'jsonwebtoken';

import { ENV } from '../config/env';
import { fail } from '../utils/response';

import type { JwtUser } from '../types/jwt';
import type { NextFunction, Request, Response } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json(fail('Unauthorized', 'UNAUTH'));
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json(fail('Invalid token', 'UNAUTH'));
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json(fail('Unauthorized', 'UNAUTH'));
  if (req.user.role !== 'ADMIN') return res.status(403).json(fail('Forbidden', 'FORBIDDEN'));
  next();
}
