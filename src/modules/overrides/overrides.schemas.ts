import { z } from 'zod';

export const upsertOverrideSchema = z.object({
  featureKey: z.string().min(2),
  env: z.string().min(2),
  userId: z.string().min(1),
  state: z.enum(['ON', 'OFF']), // only ON/OFF for overrides
});

export const deleteOverrideSchema = z.object({
  featureKey: z.string().min(2),
  env: z.string().min(2),
  userId: z.string().min(1),
});
