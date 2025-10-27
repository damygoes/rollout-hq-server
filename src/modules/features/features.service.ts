import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

import type { Prisma } from '@prisma/client';

export type ListFeaturesParams = {
  page: number;
  pageSize: number;
  q?: string;
  orderBy: Prisma.FeatureOrderByWithRelationInput[];
};

export async function listFeatures(params: ListFeaturesParams) {
  const { page, pageSize, q, orderBy } = params;

  const where: Prisma.FeatureWhereInput = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.feature.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
      where,
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        archived: true,
        createdAt: true,
      },
    }),
    prisma.feature.count({ where }),
  ]);

  return { items, total };
}

export function createFeature(data: { key: string; name: string; description?: string }) {
  return prisma.feature.create({
    data,
    select: { id: true, key: true, name: true, description: true, archived: true, createdAt: true },
  });
}

export async function updateFeatureById(
  id: string,
  data: { name?: string; description?: string; archived?: boolean },
) {
  const existing = await prisma.feature.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Feature not found');

  return prisma.feature.update({
    where: { id },
    data,
    select: { id: true, key: true, name: true, description: true, archived: true },
  });
}

export async function deleteFeatureById(id: string) {
  const existing = await prisma.feature.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Feature not found');

  return prisma.feature.delete({ where: { id } });
}
