import { prisma } from '../../db/prisma';

export function listFeatures() {
  return prisma.feature.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, key: true, name: true, description: true, archived: true, createdAt: true },
  });
}

export function createFeature(data: { key: string; name: string; description?: string }) {
  return prisma.feature.create({
    data,
    select: { id: true, key: true, name: true, description: true, archived: true, createdAt: true },
  });
}

export function updateFeatureById(
  id: string,
  data: { name?: string; description?: string; archived?: boolean },
) {
  return prisma.feature.update({
    where: { id },
    data,
    select: { id: true, key: true, name: true, description: true, archived: true },
  });
}

export function deleteFeatureById(id: string) {
  return prisma.feature.delete({ where: { id } });
}
