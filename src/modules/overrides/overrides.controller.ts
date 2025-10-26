import { fail, ok } from '../../utils/response';

import { deleteOverrideSchema, upsertOverrideSchema } from './overrides.schemas';
import { deleteOverride, upsertOverride } from './overrides.service';

import type { Request, Response } from 'express';

export async function putOverride(req: Request, res: Response) {
  const parsed = upsertOverrideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const { featureKey, env, userId, state } = parsed.data;
  const ov = await upsertOverride(featureKey, env, userId, state);
  res.json(ok(ov));
}

export async function removeOverride(req: Request, res: Response) {
  const parsed = deleteOverrideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const { featureKey, env, userId } = parsed.data;
  await deleteOverride(featureKey, env, userId);
  res.status(204).send();
}
