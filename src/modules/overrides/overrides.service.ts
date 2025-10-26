import { prisma } from '../../db/prisma';

import type { FlagState } from '@prisma/client';

export async function upsertOverride(
  featureKey: string,
  envKey: string,
  userId: string,
  state: 'ON' | 'OFF',
) {
  const [feature, env] = await Promise.all([
    prisma.feature.findUnique({ where: { key: featureKey } }),
    prisma.environment.findUnique({ where: { key: envKey } }),
  ]);
  if (!feature || !env)
    throw Object.assign(new Error('Feature or environment not found'), { status: 404 });

  return prisma.userOverride.upsert({
    where: {
      featureId_environmentId_userId: { featureId: feature.id, environmentId: env.id, userId },
    },
    update: { state: state as FlagState },
    create: { featureId: feature.id, environmentId: env.id, userId, state: state as FlagState },
  });
}

export async function deleteOverride(featureKey: string, envKey: string, userId: string) {
  const [feature, env] = await Promise.all([
    prisma.feature.findUnique({ where: { key: featureKey } }),
    prisma.environment.findUnique({ where: { key: envKey } }),
  ]);
  if (!feature || !env)
    throw Object.assign(new Error('Feature or environment not found'), { status: 404 });

  return prisma.userOverride.delete({
    where: {
      featureId_environmentId_userId: { featureId: feature.id, environmentId: env.id, userId },
    },
  });
}
