import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/authz';

import { getFeatures, patchFeature, postFeature, removeFeature } from './features.controller';

const router = Router();
router.get('/', requireAuth, getFeatures);
router.post('/', requireAuth, requireAdmin, postFeature);
router.patch('/:id', requireAuth, requireAdmin, patchFeature);
router.delete('/:id', requireAuth, requireAdmin, removeFeature);

export default router;
