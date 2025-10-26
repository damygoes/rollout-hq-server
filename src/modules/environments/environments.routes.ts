import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/authz';

import { getEnvironments, postEnvironment } from './environments.controller';

const router = Router();

router.get('/', requireAuth, getEnvironments);
router.post('/', requireAuth, requireAdmin, postEnvironment);

export default router;
