import { fail, ok } from '../../utils/response';

import { createFeatureSchema, updateFeatureSchema } from './features.schemas';
import {
  createFeature,
  deleteFeatureById,
  listFeatures,
  updateFeatureById,
} from './features.service';

import type { Request, Response } from 'express';

export async function getFeatures(_req: Request, res: Response) {
  const features = await listFeatures();
  res.json(ok(features));
}

export async function postFeature(req: Request, res: Response) {
  const parsed = createFeatureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const f = await createFeature(parsed.data);
  res.status(201).json(ok(f));
}

export async function patchFeature(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateFeatureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail('Invalid input', 'VALIDATION'));
  const f = await updateFeatureById(id, parsed.data);
  res.json(ok(f));
}

export async function removeFeature(req: Request, res: Response) {
  const { id } = req.params;
  await deleteFeatureById(id);
  res.status(204).send();
}
