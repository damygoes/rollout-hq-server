import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/authz';

import { evaluate, putState } from './flags.controller';

const router = Router();
// Public evaluate (or you can protect it and issue client tokens)
router.get('/evaluate', evaluate);

// Admin sets state
router.put('/:featureKey/state', requireAuth, requireAdmin, putState);

export default router;
