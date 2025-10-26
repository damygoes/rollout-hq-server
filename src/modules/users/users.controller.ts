import { buildOrderBy, getPaginationParams } from '../../utils/pagination';
import { ok, fail } from '../../utils/response';

import { createUserSchema, updateUserRoleSchema } from './users.schemas';
import { createUserAdmin, listUsers, updateUserRole } from './users.service';

import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export async function getUsers(req: Request, res: Response) {
  try {
    const { page, pageSize, q, sort } = getPaginationParams(req.query);

    // Only allow known, indexed fields
    const rawOrder = buildOrderBy(sort, { createdAt: true, email: true, role: true } as const);

    // Adapt to Prisma type at the controller boundary (safe due to whitelist)
    const orderBy = rawOrder as Prisma.UserOrderByWithRelationInput[];

    const result = await listUsers({ page, pageSize, q, orderBy });

    return res.json(ok(result.items, { page, pageSize, total: result.total }));
  } catch {
    return res.status(500).json(fail('Failed to fetch users', 'INTERNAL'));
  }
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
