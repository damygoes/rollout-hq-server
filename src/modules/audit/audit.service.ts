import { prisma } from '../../db/prisma';
import { dispatchAuditWebhook } from '../webhooks/webhook.dispatcher';

import type { JwtUser } from '../../types/jwt';
import type { Prisma } from '@prisma/client';

export type AuditContext = {
  actor: JwtUser;
  action: string; // e.g., 'FLAG_SET_STATE'
  featureKey?: string;
  environmentKey?: string;
  payload?: Prisma.InputJsonValue;
};

export async function createAuditLog(ctx: AuditContext) {
  const log = await prisma.auditLog.create({
    data: {
      actorUserId: ctx.actor.id,
      action: ctx.action,
      featureKey: ctx.featureKey ?? null,
      environmentKey: ctx.environmentKey ?? null,
      payload: ctx.payload ?? {}, // this is now typed correctly
    },
  });

  dispatchAuditWebhook({
    id: log.id,
    type: log.action,
    createdAt: log.createdAt.toISOString(),
    actor: { id: ctx.actor.id, email: ctx.actor.email, role: ctx.actor.role },
    data: {
      featureKey: ctx.featureKey,
      environmentKey: ctx.environmentKey,
      ...(ctx.payload as Record<string, unknown>), // outbound shape, not stored in DB; safe cast for transport
    },
  }).catch(() => {});

  return log;
}
