import {Router} from 'express';
import {externalController} from '@controllers/index';

const router = Router();

router.route('/courses').get(externalController.getAllCourses);
router.route('/enroll').post(externalController.createLead);
router.route('/username').get(externalController.createuserNameUniwque);
export default router;
