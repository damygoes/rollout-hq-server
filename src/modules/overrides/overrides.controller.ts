import { fail, ok } from '../../utils/response';
import { createAuditLog } from '../audit/audit.service';

import { deleteOverrideSchema, upsertOverrideSchema } from './overrides.schemas';
import { deleteOverride, upsertOverride } from './overrides.service';

import type { Request, Response } from 'express';

export async function putOverride(req: Request, res: Response) {
  const parsed = upsertOverrideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const { featureKey, env, userId, state } = parsed.data;
  const ov = await upsertOverride(featureKey, env, userId, state);

  await createAuditLog({
    actor: req.user!,
    action: 'OVERRIDE_UPSERT',
    featureKey,
    environmentKey: env,
    payload: { userId, state },
  });

  res.json(ok(ov));
}

export async function removeOverride(req: Request, res: Response) {
  const parsed = deleteOverrideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const { featureKey, env, userId } = parsed.data;
  await deleteOverride(featureKey, env, userId);

  await createAuditLog({
    actor: req.user!,
    action: 'OVERRIDE_DELETE',
    featureKey,
    environmentKey: env,
    payload: { userId },
  });

  res.status(204).send();
}
