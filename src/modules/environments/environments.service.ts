import { prisma } from '../../db/prisma';

import type { Prisma } from '@prisma/client';

export type ListEnvironmentsParams = {
  page: number;
  pageSize: number;
  q?: string;
  orderBy: Prisma.EnvironmentOrderByWithRelationInput[];
};

export async function listEnvironments(params: ListEnvironmentsParams) {
  const { page, pageSize, q, orderBy } = params;

  const where: Prisma.EnvironmentWhereInput = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.environment.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
      where,
      select: { id: true, key: true, name: true, createdAt: true },
    }),
    prisma.environment.count({ where }),
  ]);

  return { items, total };
}

export function createEnvironment(key: string, name: string) {
  return prisma.environment.create({ data: { key, name } });
}
