import {Router} from 'express';
import {examQuestionController} from '@controllers/admin';

const router = Router({mergeParams: true});

router
    .route('/')
    .post(examQuestionController.createExamQuestion)
    .get(examQuestionController.getExamQuestions);

router
    .route('/:questionId')
    .get(examQuestionController.getExamQuestionById)
    .patch(examQuestionController.updateExamQuestion)
    .delete(examQuestionController.deleteExamQuestion);

export default router;
