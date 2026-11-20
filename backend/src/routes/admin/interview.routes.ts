import {Router} from 'express';
import {placementController} from '@controllers/admin';

const router = Router();

router.route('/students').get(placementController.getPlacementStudents);

router.route('/').get(placementController.getInterviews);

export default router;
