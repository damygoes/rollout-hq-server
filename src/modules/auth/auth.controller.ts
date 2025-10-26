import { fail, ok } from '../../utils/response';

import { loginSchema, registerSchema } from './auth.schemas';
import { createUser, findUserByEmail, hashPassword, verifyPassword } from './auth.service';
import { signJwt } from './jwt';

import type { Role } from '@prisma/client';
import type { Request, Response } from 'express';

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid credentials', 'VALIDATION'));
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json(fail('Invalid email or password', 'UNAUTH'));
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json(fail('Invalid email or password', 'UNAUTH'));

  const token = signJwt({ id: user.id, email: user.email, role: user.role });
  return res.json(ok({ token, user: { id: user.id, email: user.email, role: user.role } }));
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));

  const { email, password, role } = parsed.data;
  const exists = await findUserByEmail(email);
  if (exists) return res.status(409).json(fail('Email already in use', 'CONFLICT'));

  // Only ADMIN can set roles explicitly
  const desiredRole: Role = req.user?.role === 'ADMIN' && role ? role : 'VIEWER';

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash, desiredRole);
  const token = signJwt({ id: user.id, email: user.email, role: desiredRole });

  return res.status(201).json(ok({ token, user }));
}
