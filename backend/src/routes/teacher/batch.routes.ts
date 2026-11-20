import {Router} from 'express';
import {batchController} from '@controllers/teacher';
import dailyTaskRoutes from './dailyTask.routes';
import assignmentRoutes from './assignment.routes';

const router = Router();

router.route('/').post(batchController.createBatch).get(batchController.getBatches);

router.use('/tasks', dailyTaskRoutes);
router.use('/assignments', assignmentRoutes);

router.route('/students/:id').get(batchController.getStudents);
router.route('/refer/:id').get(batchController.getReferedStudent);

router
    .route('/:id')
    .get(batchController.getBatchById)
    .patch(batchController.updateBatch)
    .delete(batchController.deleteBatch);

export default router;
