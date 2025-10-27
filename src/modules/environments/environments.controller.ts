import { AppError } from '../../errors/AppError';
import { buildOrderBy, getPaginationParams } from '../../utils/pagination';
import { ok, fail } from '../../utils/response';

import { createEnvSchema } from './environments.schemas';
import { createEnvironment, listEnvironments } from './environments.service';

import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export async function getEnvironments(req: Request, res: Response) {
  const { page, pageSize, q, sort } = getPaginationParams(req.query);

  const rawOrder = buildOrderBy(sort, { createdAt: true, key: true, name: true } as const);
  const orderBy = rawOrder as Prisma.EnvironmentOrderByWithRelationInput[];

  const envs = await listEnvironments({ page, pageSize, q, orderBy });
  if (!envs) throw AppError.notFound('No environments found');

  return res.json(ok(envs.items, { page, pageSize, total: envs.total }));
}

export async function postEnvironment(req: Request, res: Response) {
  const { key, name } = createEnvSchema.parse(req.body);
  const env = await createEnvironment(key, name);
  res.status(201).json(ok(env));
}
