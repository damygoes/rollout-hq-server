import { prisma } from '../../db/prisma';

export function listWebhooks() {
  return prisma.webhookEndpoint.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, url: true, isActive: true, eventTypes: true, createdAt: true },
  });
}

export function createWebhookEndpoint(input: {
  name: string;
  url: string;
  secret: string;
  eventTypes?: string[]; // AuditEvent names
  isActive?: boolean;
}) {
  return prisma.webhookEndpoint.create({
    data: {
      name: input.name,
      url: input.url,
      secret: input.secret,
      isActive: input.isActive ?? true,
      eventTypes: input.eventTypes ?? [],
    },
    select: { id: true, name: true, url: true, isActive: true, eventTypes: true, createdAt: true },
  });
}

export function deleteWebhookEndpoint(id: string) {
  return prisma.webhookEndpoint.delete({
    where: { id },
  });
}
