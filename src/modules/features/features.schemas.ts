import { z } from 'zod';

export const createFeatureSchema = z.object({
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
});

export const updateFeatureSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  archived: z.boolean().optional(),
});
