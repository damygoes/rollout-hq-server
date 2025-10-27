import { AppError } from '../../errors/AppError';
import { buildOrderBy, getPaginationParams } from '../../utils/pagination';
import { fail, ok } from '../../utils/response';

import { createFeatureSchema, updateFeatureSchema } from './features.schemas';
import {
  createFeature,
  deleteFeatureById,
  listFeatures,
  updateFeatureById,
} from './features.service';

import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export async function getFeatures(req: Request, res: Response) {
  const { page, pageSize, q, sort } = getPaginationParams(req.query);

  const rawOrder = buildOrderBy(sort, { createdAt: true, name: true, key: true } as const);
  const orderBy = rawOrder as Prisma.FeatureOrderByWithRelationInput[];

  const features = await listFeatures({ page, pageSize, q, orderBy });
  if (features.total === 0) throw AppError.notFound('No features found');

  return res.json(ok(features.items, { page, pageSize, total: features.total }));
}

export async function postFeature(req: Request, res: Response) {
  const parsed = createFeatureSchema.safeParse(req.body);

  if (!parsed.success) throw AppError.validation('Invalid input');

  const newFeature = await createFeature(parsed.data);

  res.status(201).json(ok(newFeature));
}

export async function patchFeature(req: Request, res: Response) {
  const { id } = req.params;

  const parsed = updateFeatureSchema.safeParse(req.body);

  if (!parsed.success) throw AppError.validation('Invalid input');

  const updatedFeature = await updateFeatureById(id, parsed.data);

  res.json(ok(updatedFeature));
}

export async function removeFeature(req: Request, res: Response) {
  const { id } = req.params;
  await deleteFeatureById(id);
  res.status(204).send();
}
