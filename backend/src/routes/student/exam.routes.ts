import {Router} from 'express';
import {examController} from '@controllers/student';

const router = Router({mergeParams: true});

router.route('/').get(examController.getExams);
router.route('/:id').get(examController.getExamById);
router.route('/submit/:id').post(examController.submitExam);
router.route('/result/:id').get(examController.getExamResult);
router.route('/result/analysis/:id').get(examController.getStudentExamsResultAnalysis);

export default router;
