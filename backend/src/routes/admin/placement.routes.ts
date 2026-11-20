import {Router} from 'express';
import {placementController} from '@controllers/admin';

const router = Router();

router.route('/assign/:id').get(placementController.getAssignedPlacement);
router
    .route('/schedule/:id')
    .post(placementController.scheduleInterview)
    .get(placementController.getInterviewStudent);
router
    .route('/students')
    .post(placementController.createPlacementStudent)
    .get(placementController.getPlacementStudents);
router
    .route('/students/:id')
    .post(placementController.assignStudents)
    .get(placementController.getPlacementStudentById)
    .patch(placementController.updatePlacementStudent)
    .delete(placementController.deletePlacementStudent);

router.route('/').post(placementController.createPlacement).get(placementController.getPlacements);

router
    .route('/:id')
    .get(placementController.getPlacementById)
    .patch(placementController.updatePlacement)
    .delete(placementController.deletePlacement);

export default router;
