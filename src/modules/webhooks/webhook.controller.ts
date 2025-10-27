import { AppError } from '../../errors/AppError';
import { buildOrderBy, getPaginationParams } from '../../utils/pagination';
import { ok, fail } from '../../utils/response';

import { dispatchAuditWebhook } from './webhook.dispatcher';
import { createWebhookSchema, testWebhookSchema } from './webhook.schemas';
import { createWebhookEndpoint, deleteWebhookEndpoint, listWebhooks } from './webhook.service';

import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export async function getWebhooks(req: Request, res: Response) {
  const { page, pageSize, q, sort } = getPaginationParams(req.query);
  const rawOrder = buildOrderBy(sort, { createdAt: true, name: true, isActive: true } as const);
  const orderBy = rawOrder as Prisma.WebhookEndpointOrderByWithRelationInput[];

  const result = await listWebhooks({ page, pageSize, q, orderBy });
  return res.json(ok(result.items, { page, pageSize, total: result.total }));
}

export async function postWebhook(req: Request, res: Response) {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.validation('Invalid input');
  const endpoint = await createWebhookEndpoint(parsed.data);
  res.status(201).json(ok(endpoint));
}

export async function deleteWebhook(req: Request, res: Response) {
  await deleteWebhookEndpoint(req.params.id);
  res.status(204).send();
}

// Fire a test event to a single endpoint by ID (does not persist an AuditLog)
export async function postWebhookTest(req: Request, res: Response) {
  const parsed = testWebhookSchema.safeParse(req.body);
  if (!parsed.success) throw AppError.validation('Invalid input');

  const { action } = parsed.data;
  const now = new Date().toISOString();

  await dispatchAuditWebhook({
    id: `test_${now}`,
    type: action,
    createdAt: now,
    actor: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
    },
    data: { test: true, note: 'Manual test event' },
  });

  res.json(ok({ sent: true }));
}
