import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import { hashPassword } from '../auth/auth.service';

import type { Prisma, Role } from '@prisma/client';

export type ListUsersParams = {
  page: number;
  pageSize: number;
  q?: string;
  orderBy: Prisma.UserOrderByWithRelationInput[]; // already validated/whitelisted by controller
};

export type ListResult<T> = { items: T[]; total: number };

export async function listUsers(params: ListUsersParams) {
  const { page, pageSize, q, orderBy } = params;

  const where: Prisma.UserWhereInput = q
    ? { OR: [{ email: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
      where,
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function createUserAdmin(email: string, password: string, role: Role) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
}

export function updateUserRole(userId: string, role: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User not found');
  return user;
}
