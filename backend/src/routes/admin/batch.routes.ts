import {Router} from 'express';
import {batchController} from '@controllers/admin';
import dailyTaskRoutes from './dailyTask.routes';
import assignmentRoutes from './assignment.routes';

const router = Router();

router.route('/').post(batchController.createBatch).get(batchController.getBatches);

router.route('/students/:id').get(batchController.getStudents);
router.route('/refer/:id').get(batchController.getReferedStudent);

router
    .route('/:id')
    .get(batchController.getBatchById)
    .patch(batchController.updateBatch)
    .delete(batchController.deleteBatch);
router.use('/tasks', dailyTaskRoutes);
router.use('/assignments', assignmentRoutes);

export default router;
