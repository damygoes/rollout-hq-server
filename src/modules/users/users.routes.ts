import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/authz';

import { getUsers, patchUserRole, postUser } from './users.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', getUsers);
router.post('/', postUser);
router.patch('/:userId/role', patchUserRole);

export default router;
