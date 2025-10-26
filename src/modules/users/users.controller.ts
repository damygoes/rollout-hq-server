import { ok, fail } from '../../utils/response';

import { createUserSchema, updateUserRoleSchema } from './users.schemas';
import { createUserAdmin, listUsers, updateUserRole } from './users.service';

import type { Request, Response } from 'express';

export async function getUsers(_req: Request, res: Response) {
  const users = await listUsers();
  res.json(ok(users));
}

export async function postUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const { email, password, role } = parsed.data;
  const u = await createUserAdmin(email, password, role);
  res.status(201).json(ok(u));
}

export async function patchUserRole(req: Request, res: Response) {
  const { userId } = req.params;
  const parsed = updateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const u = await updateUserRole(userId, parsed.data.role);
  res.json(ok(u));
}
