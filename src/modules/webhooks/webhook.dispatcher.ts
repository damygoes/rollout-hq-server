import crypto from 'crypto';

import axios from 'axios';

import { prisma } from '../../db/prisma';

import type { Prisma } from '@prisma/client';

type AuditWebhookPayload = {
  id: string;
  type: string; // AuditEvent
  createdAt: string; // ISO
  actor: { id: string; email: string; role: 'ADMIN' | 'VIEWER' };
  data: Record<string, unknown>;
};

function signBody(secret: string, body: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// naive retry schedule (seconds)
const RETRY_DELAYS = [1, 5, 30];

export async function dispatchAuditWebhook(event: AuditWebhookPayload) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { isActive: true },
  });

  // Filter by event subscription (if eventTypes set)
  const targets = endpoints.filter((ep) => {
    if (ep.eventTypes == null) return true; // no filter -> receive all

    const raw = ep.eventTypes as Prisma.JsonValue;
    // Safely narrow to string[]
    if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
      return (raw as string[]).includes(event.type);
    }
    // If stored JSON isn't a string[], default to sending
    return true;
  });

  const body = JSON.stringify(event);
  const now = Date.now().toString();

  for (const ep of targets) {
    const signature = signBody(ep.secret, body);
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Timestamp': now,
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Event': event.type,
    };

    // delivery attempt wrapper
    const sendOnce = async () => {
      try {
        const res = await axios.post(ep.url, body, {
          headers,
          timeout: 10_000,
          validateStatus: () => true, // record even non-2xx
        });

        await prisma.webhookDelivery.create({
          data: {
            endpointId: ep.id,
            action: event.type,
            status: res.status >= 200 && res.status < 300 ? 'SUCCESS' : 'FAILED',
            responseCode: res.status,
            // 👇 store JSON as Prisma.InputJsonValue
            payload: JSON.parse(body) as Prisma.InputJsonValue,
            error: res.status >= 200 && res.status < 300 ? null : `Non-2xx: ${res.status}`,
          },
        });

        // stop retrying on any HTTP response (even 4xx/5xx), to keep it simple.
        return res.status >= 200 && res.status < 300;
      } catch (err: unknown) {
        await prisma.webhookDelivery.create({
          data: {
            endpointId: ep.id,
            action: event.type,
            status: 'FAILED',
            payload: JSON.parse(body) as Prisma.InputJsonValue, // 👈
            error: err instanceof Error ? err.message : 'NetworkError',
          },
        });
        return false;
      }
    };

    // initial try + naive retries
    const ok = await sendOnce();
    if (!ok) {
      RETRY_DELAYS.forEach((sec) => {
        setTimeout(() => {
          void sendOnce();
        }, sec * 1000);
      });
    }
  }
}
