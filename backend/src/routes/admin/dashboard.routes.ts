import {Router} from 'express';
import {dashboardController} from '@controllers/admin';

const router = Router();

router.route('/').get(dashboardController.getDashboard);

export default router;
