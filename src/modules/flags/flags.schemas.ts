import { z } from 'zod';

export const setStateSchema = z.object({
  env: z.string().min(2),
  state: z.enum(['ON', 'OFF', 'PERCENTAGE']),
  rolloutPct: z.number().int().min(0).max(100).optional(),
});

export const evaluateSchema = z.object({
  featureKey: z.string().min(2),
  env: z.string().min(2),
  userId: z.string().optional(),
});
