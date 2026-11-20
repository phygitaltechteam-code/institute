import {Router} from 'express';
import {verifyJWT, checkSuperAdmin} from '@middlewares/index';

import adminRoutes from './admin.routes';

const router = Router();
router.use(verifyJWT, checkSuperAdmin);

router.use('/admin', adminRoutes);

export default router;
