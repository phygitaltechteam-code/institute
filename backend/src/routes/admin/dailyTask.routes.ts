import {Router} from 'express';
import {dailyTaskController} from '@controllers/admin';
import {upload} from '@middlewares/multer.middleware';

const router = Router({mergeParams: true});

router
    .route('/:batchId')
    .post(
        upload.fields([
            {name: 'pdf', maxCount: 1},
            {name: 'video', maxCount: 1},
        ]),
        dailyTaskController.createDailyTask,
    )
    .get(dailyTaskController.getDailyTasks);

router
    .route('/byId/:taskId')
    .get(dailyTaskController.getDailyTaskById)
    .patch(
        upload.fields([
            {name: 'pdf', maxCount: 1},
            {name: 'video', maxCount: 1},
        ]),
        dailyTaskController.updateDailyTask,
    )
    .delete(dailyTaskController.deleteDailyTask);

router
    .route('/remark/:id')
    .put(dailyTaskController.submitRemark)
    .get(dailyTaskController.getDataCompliance);
// router.route('/compliance/:id').get(dailyTaskController.getDataCompliance);

export default router;
