import { ok, fail } from '../../utils/response';

import { evaluateSchema, setStateSchema } from './flags.schemas';
import { evaluateFlag, setFlagState } from './flags.service';

import type { FlagState } from '@prisma/client';
import type { Request, Response } from 'express';

export async function evaluate(req: Request, res: Response) {
  const parsed = evaluateSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(fail('Invalid query', 'VALIDATION'));
  const { featureKey, env, userId } = parsed.data;
  const result = await evaluateFlag(featureKey, env, userId);
  res.json(ok(result));
}

export async function putState(req: Request, res: Response) {
  const { featureKey } = req.params;
  const parsed = setStateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const { env, state, rolloutPct } = parsed.data;
  const updated = await setFlagState(featureKey, env, state as FlagState, rolloutPct);
  res.json(ok(updated));
}
