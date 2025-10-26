import { z } from 'zod';

export const createWebhookSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  secret: z.string().min(8),
  eventTypes: z.array(z.string()).optional(), // use AuditEvent names
  isActive: z.boolean().optional(),
});

export const testWebhookSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
});
