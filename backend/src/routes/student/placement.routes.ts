import {Router} from 'express';
import {examController, dailyTaskController} from '@controllers/student';
import {upload} from '@middlewares/index';
// import {validate} from '@middlewares/index';
// import {placementValidation} from '@validations/index';

const router = Router({mergeParams: true});

router.route('/').get(dailyTaskController.getPlacementTasks);
router
    .route('/form')
    .get(dailyTaskController.getPlacementForm)
    .post(
        upload.fields([
            {name: 'resume', maxCount: 1},
            {name: 'profile_photo', maxCount: 1},
            // {name: 'passport', maxCount: 1},
            {name: 'aadharcard', maxCount: 1},
        ]),
        dailyTaskController.savePlacementForm,
    );
router.route('/interview').get(dailyTaskController.getInterviews);
router.route('/interview/:interviewId').patch(dailyTaskController.updateInterviewStatus);
router.route('/:id').post(examController.applyPlacement);

export default router;
