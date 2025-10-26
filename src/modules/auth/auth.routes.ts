import { Router } from 'express';

import { requireAuth, requireAdmin } from '../../middleware/authz';

import { login, register } from './auth.controller';

const router = Router();
router.post('/login', login);
// Note: register is protected to prevent random admin creation in prod.
// optional: allow self-register in dev; in prod, restrict to admins
router.post('/register', requireAuth, requireAdmin, register);

export default router;
