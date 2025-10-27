import { ok } from '../../utils/response';

import { loginSchema, registerSchema } from './auth.schemas';
import { authenticateUser, registerUser } from './auth.service';
import { signJwt } from './jwt';

import type { Role } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * POST /auth/login
 * Validates credentials and returns a JWT + user summary.
 * Zod throws on invalid input -> mapped to VALIDATION by errorHandler.
 * authenticateUser throws UNAUTH on invalid credentials.
 */
export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await authenticateUser(email, password);
  const token = signJwt({ id: user.id, email: user.email, role: user.role });

  return res.json(ok({ token, user: { id: user.id, email: user.email, role: user.role } }));
}

/**
 * POST /auth/register
 * Creates a new user. Only ADMIN can set an explicit role; others get VIEWER.
 * Zod throws on invalid input. registerUser throws CONFLICT if email is taken.
 */
export async function register(req: Request, res: Response) {
  const { email, password, role } = registerSchema.parse(req.body);

  // Only ADMIN can assign roles; others default to VIEWER
  const desiredRole: Role = req.user?.role === 'ADMIN' && role ? role : 'VIEWER';

  const user = await registerUser(email, password, desiredRole);
  const token = signJwt({ id: user.id, email: user.email, role: user.role });

  return res
    .status(201)
    .json(ok({ token, user: { id: user.id, email: user.email, role: user.role } }));
}
