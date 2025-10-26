import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/authz';

import { putOverride, removeOverride } from './overrides.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

router.put('/', putOverride);
router.delete('/', removeOverride);

export default router;
