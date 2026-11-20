import {Router} from 'express';
import {subjectController} from '@controllers/teacher';

const router = Router({mergeParams: true});

router.route('/').get(subjectController.getSubjects).post(subjectController.createSubject);
router
    .route('/:id')
    .get(subjectController.getSubjectById)
    // .post(subjectController.createSubject)
    .put(subjectController.updateSubject)
    .delete(subjectController.deleteSubject);

export default router;
