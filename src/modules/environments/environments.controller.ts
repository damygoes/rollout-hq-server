import { ok, fail } from '../../utils/response';

import { createEnvSchema } from './environments.schemas';
import { createEnvironment, listEnvironments } from './environments.service';

import type { Request, Response } from 'express';

export async function getEnvironments(_req: Request, res: Response) {
  const envs = await listEnvironments();
  res.json(ok(envs));
}

export async function postEnvironment(req: Request, res: Response) {
  const parsed = createEnvSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const env = await createEnvironment(parsed.data.key, parsed.data.name);
  res.status(201).json(ok(env));
}
