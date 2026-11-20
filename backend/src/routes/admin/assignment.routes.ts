import {Router} from 'express';
import {assignmentController} from '@controllers/admin';
import {upload} from '@middlewares/multer.middleware';

const router = Router({mergeParams: true});

router
    .route('/:batchId')
    .post(
        upload.fields([
            {name: 'pdf', maxCount: 1},
            {name: 'video', maxCount: 1},
        ]),
        assignmentController.createAssignment,
    )
    .get(assignmentController.getAssignments);

router
    .route('/byId/:assignmentId')
    .get(assignmentController.getAssignmentById)
    .put(
        upload.fields([
            {name: 'pdf', maxCount: 1},
            {name: 'video', maxCount: 1},
        ]),
        assignmentController.updateAssignment,
    )
    .delete(assignmentController.deleteAssignment);

router
    .route('/remark/:id')
    .put(assignmentController.submitRemark)
    .get(assignmentController.getDataCompliance);
// router.route('/compliance/:id')

export default router;
