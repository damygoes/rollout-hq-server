import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

import type { Prisma } from '@prisma/client';

const webhookSelect = {
  id: true,
  name: true,
  url: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.WebhookEndpointSelect;

export type WebhookSummary = Prisma.WebhookEndpointGetPayload<{ select: typeof webhookSelect }>;
export type ListResult<T> = { items: T[]; total: number };

export type ListWebhooksParams = {
  page: number;
  pageSize: number;
  q?: string;
  orderBy: Prisma.WebhookEndpointOrderByWithRelationInput[];
};

export async function listWebhooks(
  params: ListWebhooksParams,
): Promise<ListResult<WebhookSummary>> {
  const { page, pageSize, q, orderBy } = params;

  const where: Prisma.WebhookEndpointWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { url: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.webhookEndpoint.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
      where,
      select: webhookSelect,
    }),
    prisma.webhookEndpoint.count({ where }),
  ]);

  return { items, total };
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

export async function deleteWebhookEndpoint(id: string) {
  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
  if (!endpoint) throw AppError.notFound('Webhook endpoint not found');

  return prisma.webhookEndpoint.delete({
    where: { id },
  });
}
