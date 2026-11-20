import {Router} from 'express';
import {courseController} from '@controllers/teacher';

const router = Router();

router.route('/').post(courseController.createCourse).get(courseController.getCourses);

router
    .route('/:id')
    .get(courseController.getCourseById)
    .put(courseController.updateCourse)
    .delete(courseController.deleteCourse);

export default router;
