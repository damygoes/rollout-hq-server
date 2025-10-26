import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'VIEWER']).default('VIEWER'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'VIEWER']),
});
