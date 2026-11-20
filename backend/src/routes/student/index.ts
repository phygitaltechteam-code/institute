import {Router} from 'express';
import {checkStudent, verifyJWT} from '@middlewares/index';
import dailyTaskRoutes from './dailyTask.routes';
import placementRoutes from './placement.routes';
import examRoutes from './exam.routes';
import assignmentRoutes from './assignment.routes';
import academyRoutes from './academy.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use(verifyJWT, checkStudent);

router.use('/daily-tasks', dailyTaskRoutes);
router.use('/placement', placementRoutes);
router.use('/exams', examRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/academy', academyRoutes);
router.use('/notifications', notificationRoutes);

export default router;
