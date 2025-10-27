import bcrypt from 'bcrypt';

import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

import type { Prisma, Role } from '@prisma/client';

export type ListUsersParams = {
  page: number;
  pageSize: number;
  q?: string;
  orderBy: Prisma.UserOrderByWithRelationInput[]; // already validated/whitelisted by controller
};

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
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw AppError.conflict('Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return created;
}

export async function updateUserRole(userId: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw AppError.notFound('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return updated;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User not found');
  return user;
}
