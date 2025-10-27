import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

import type { FlagState } from '@prisma/client';

export async function upsertOverride(
  featureKey: string,
  envKey: string,
  userId: string,
  state: Extract<FlagState, 'ON' | 'OFF'>,
) {
  const [feature, env] = await Promise.all([
    prisma.feature.findUnique({ where: { key: featureKey } }),
    prisma.environment.findUnique({ where: { key: envKey } }),
  ]);

  if (!feature || !env) throw AppError.notFound('Feature or environment not found');

  return prisma.userOverride.upsert({
    where: {
      feature_env_user_unique: {
        featureId: feature.id,
        environmentId: env.id,
        userId,
      },
    },
    update: { state: state as FlagState },
    create: {
      featureId: feature.id,
      environmentId: env.id,
      userId,
      state: state as FlagState,
    },
  });
}

export async function deleteOverride(featureKey: string, envKey: string, userId: string) {
  const [feature, env] = await Promise.all([
    prisma.feature.findUnique({ where: { key: featureKey } }),
    prisma.environment.findUnique({ where: { key: envKey } }),
  ]);

  if (!feature || !env) throw AppError.notFound('Feature or environment not found');

  return prisma.userOverride.delete({
    where: {
      feature_env_user_unique: {
        featureId: feature.id,
        environmentId: env.id,
        userId,
      },
    },
  });
}
