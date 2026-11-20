import {Router} from 'express';
import {assignmentController} from '@controllers/student';
import {upload} from '@middlewares/multer.middleware';

const router = Router({mergeParams: true});

router.route('/').get(assignmentController.getAssignments);

router.route('/:assignmentId').get(assignmentController.getAssignmentById);
router
    .route('/submit/:id')
    .post(upload.fields([{name: 'file', maxCount: 1}]), assignmentController.completeAssignment);
router.route('/:assignmentId/complete').patch(assignmentController.completeAssignment);

export default router;
