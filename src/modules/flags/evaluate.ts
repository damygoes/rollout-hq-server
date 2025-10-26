import { PrismaClient, FlagState } from '@prisma/client';
const db = new PrismaClient();

export async function evaluate(featureKey: string, envKey: string, userId?: string) {
  const feature = await db.feature.findUnique({ where: { key: featureKey } });
  const env = await db.environment.findUnique({ where: { key: envKey } });
  if (!feature || !env) return { enabled: false };

  if (userId) {
    const ov = await db.userOverride.findUnique({
      where: {
        featureId_environmentId_userId: { featureId: feature.id, environmentId: env.id, userId },
      },
    });
    if (ov) return { enabled: ov.state === FlagState.ON };
  }

  const fa = await db.flagAssignment.findUnique({
    where: { featureId_environmentId: { featureId: feature.id, environmentId: env.id } },
  });
  if (!fa) return { enabled: false };

  if (fa.state === FlagState.ON) return { enabled: true };
  if (fa.state === FlagState.OFF) return { enabled: false };
  // percentage rollout: simple hash on userId for determinism
  const pct = fa.rolloutPct ?? 0;
  if (!userId) return { enabled: false };
  const hash = [...userId].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const bucket = hash % 100;
  return { enabled: bucket < pct };
}
