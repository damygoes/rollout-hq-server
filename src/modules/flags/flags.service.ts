import { FlagState } from '@prisma/client';

import { prisma } from '../../db/prisma';

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
    const ov = await prisma.userOverride.findFirst({
      where: { featureId: feature.id, environmentId: env.id, userId },
    });
    if (ov) return { enabled: ov.state === FlagState.ON };
  }

  const fa = await prisma.flagAssignment.findFirst({
    where: { featureId: feature.id, environmentId: env.id },
  });
  if (!fa) return { enabled: false };

  if (fa.state === FlagState.ON) return { enabled: true };
  if (fa.state === FlagState.OFF) return { enabled: false };
  if (!userId) return { enabled: false };

  const bucket = simpleHash(userId) % 100;
  const pct = fa.rolloutPct ?? 0;
  return { enabled: bucket < pct };
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
  if (!feature || !env)
    throw Object.assign(new Error('Feature or environment not found'), { status: 404 });

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
