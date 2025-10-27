import { AppError } from '../../errors/AppError';
import { buildOrderBy, getPaginationParams } from '../../utils/pagination';
import { ok } from '../../utils/response';

import { createUserSchema, updateUserRoleSchema } from './users.schemas';
import { createUserAdmin, listUsers, updateUserRole } from './users.service';

import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export async function getUsers(req: Request, res: Response) {
  const { page, pageSize, q, sort } = getPaginationParams(req.query);

  // Only allow known, indexed fields
  const rawOrder = buildOrderBy(sort, { createdAt: true, email: true, role: true } as const);

  // Adapt to Prisma type at the controller boundary (safe due to whitelist)
  const orderBy = rawOrder as Prisma.UserOrderByWithRelationInput[];

  const result = await listUsers({ page, pageSize, q, orderBy });

  if (result.total === 0) throw AppError.notFound('No users found');

  return res.json(ok(result.items, { page, pageSize, total: result.total }));
}

export async function postUser(req: Request, res: Response) {
  // Zod throws on invalid input -> handled centrally as VALIDATION
  const { email, password, role } = createUserSchema.parse(req.body);

  // Domain logic in service; may throw AppError.conflict if email exists
  const user = await createUserAdmin(email, password, role);

  return res.status(201).json(ok(user));
}

export async function patchUserRole(req: Request, res: Response) {
  const { userId } = req.params;
  if (!userId) throw AppError.validation('Missing path param: userId');

  const { role } = updateUserRoleSchema.parse(req.body);

  // Service may throw AppError.notFound if user doesn't exist
  const user = await updateUserRole(userId, role);

  return res.json(ok(user));
}
