import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/authz';

import { deleteWebhook, getWebhooks, postWebhook, postWebhookTest } from './webhook.controller';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', getWebhooks);
router.post('/', postWebhook);
router.delete('/:id', deleteWebhook);
router.post('/test', postWebhookTest);

export default router;
