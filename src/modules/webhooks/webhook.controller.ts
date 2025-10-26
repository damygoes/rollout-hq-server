import { ok, fail } from '../../utils/response';

import { dispatchAuditWebhook } from './webhook.dispatcher';
import { createWebhookSchema, testWebhookSchema } from './webhook.schemas';
import { createWebhookEndpoint, deleteWebhookEndpoint, listWebhooks } from './webhook.service';

import type { Request, Response } from 'express';

export async function getWebhooks(_req: Request, res: Response) {
  const eps = await listWebhooks();
  res.json(ok(eps));
}

export async function postWebhook(req: Request, res: Response) {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const ep = await createWebhookEndpoint(parsed.data);
  res.status(201).json(ok(ep));
}

export async function deleteWebhook(req: Request, res: Response) {
  await deleteWebhookEndpoint(req.params.id);
  res.status(204).send();
}

// Fire a test event to a single endpoint by ID (does not persist an AuditLog)
export async function postWebhookTest(req: Request, res: Response) {
  const parsed = testWebhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));

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
