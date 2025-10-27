import { FlagState } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

function simpleHash(str: string) {
  let h = 0 >>> 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export async function evaluateFlag(featureKey: string, envKey: string, userId?: string) {
  const [feature, env] = await Promise.all([
    prisma.feature.findUnique({ where: { key: featureKey } }),
    prisma.environment.findUnique({ where: { key: envKey } }),
  ]);
  if (!feature || !env) return { enabled: false };

  if (userId) {
    const override = await prisma.userOverride.findFirst({
      where: { featureId: feature.id, environmentId: env.id, userId },
    });
    if (override) return { enabled: override.state === FlagState.ON };
  }

  const flagAssignment = await prisma.flagAssignment.findFirst({
    where: { featureId: feature.id, environmentId: env.id },
  });
  if (!flagAssignment) return { enabled: false };

  if (flagAssignment.state === FlagState.ON) return { enabled: true };
  if (flagAssignment.state === FlagState.OFF) return { enabled: false };
  if (!userId) return { enabled: false };

  const bucket = simpleHash(userId) % 100;
  const percentage = flagAssignment.rolloutPct ?? 0;
  return { enabled: bucket < percentage };
}

export async function setFlagState(
  featureKey: string,
  envKey: string,
  state: FlagState,
  rolloutPct?: number,
) {
  const [feature, env] = await Promise.all([
    prisma.feature.findUnique({ where: { key: featureKey } }),
    prisma.environment.findUnique({ where: { key: envKey } }),
  ]);
  if (!feature || !env) throw AppError.notFound('Feature or Environment not found');

  const existing = await prisma.flagAssignment.findFirst({
    where: { featureId: feature.id, environmentId: env.id },
  });

  if (existing) {
    return prisma.flagAssignment.update({
      where: { id: existing.id },
      data: { state, rolloutPct },
    });
  } else {
    return prisma.flagAssignment.create({
      data: { featureId: feature.id, environmentId: env.id, state, rolloutPct },
    });
  }
}
