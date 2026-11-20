import {Router} from 'express';
import {teacherController} from '@controllers/admin';
import {upload} from '@middlewares/multer.middleware';

const router = Router();

router
    .route('/')
    .post(
        upload.fields([
            {name: 'adharcard', maxCount: 1},
            {name: 'panproof', maxCount: 1},
            {name: 'addressProof', maxCount: 1},
        ]),
        teacherController.registerTeacher,
    )
    .get(teacherController.getTeachers);

router
    .route('/:id')
    .get(teacherController.getTeacherById)
    .put(
        upload.fields([
            {name: 'adharcard', maxCount: 1},
            {name: 'panproof', maxCount: 1},
            {name: 'addressProof', maxCount: 1},
        ]),
        teacherController.updateTeacher,
    )
    .delete(teacherController.deleteTeacher);

export default router;
