import { Router } from 'express';

import { prisma } from '../../db/prisma';

const router = Router();

// Basic liveness
router.get('/health', (_req, res) => res.json({ ok: true }));

// Readiness (checks DB connectivity)
router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
