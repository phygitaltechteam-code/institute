import {Router} from 'express';
import {examController} from '@controllers/teacher';
import examQuestionRoutes from './examQuestion.routes';

const router = Router();

router.route('/').get(examController.getExams).post(examController.createExam);
router.use('/:examId/questions', examQuestionRoutes);
router
    .route('/batch/:batchId')
    .get(examController.getExamsByBatchId)
    .post(examController.assignBatch);
router.route('/result/:studentId/:id').get(examController.resultAnalysis);

router.route('/data/:id').get(examController.getExamData).patch(examController.updateRemark);
// router.route('/results/:id/remark');

router
    .route('/:id')
    .get(examController.getExamById)

    .patch(examController.updateExam)
    .delete(examController.deleteExam);

export default router;
