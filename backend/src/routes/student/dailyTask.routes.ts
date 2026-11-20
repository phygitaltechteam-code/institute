import {Router} from 'express';
import {dailyTaskController} from '@controllers/student';
import {upload} from '@middlewares/index';

const router = Router({mergeParams: true});

router.route('/').get(dailyTaskController.getDailyTasks);
router.route('/placement').get(dailyTaskController.getPlacementTasks);
router.route('/stats').get(dailyTaskController.getStats);
router.route('/referal').post(dailyTaskController.createLead).get(dailyTaskController.getLead);

router
    .route('/submit/:id')
    .post(upload.fields([{name: 'file', maxCount: 1}]), dailyTaskController.completeDailyTask);

router.route('/profile').get(dailyTaskController.getStudentById);
export default router;
