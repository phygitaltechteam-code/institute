import {Router} from 'express';
import {studentController} from '@controllers/admin';
import {batchController} from '@controllers/teacher';
import {upload} from '@middlewares/index';

const router = Router();

router.route('/').post(studentController.registerStudent).get(studentController.getStudents);
router.route('/certificate/:id').post(
    upload.fields([
        {name: 'pdf', maxCount: 1},
        {name: 'file', maxCount: 1},
    ]),
    batchController.updateStudentCertificate,
);
router.route('/refer/:id').post(studentController.collectReferal);
router.route('/bulk').post(studentController.bulkRegisterStudents);
router
    .route('/:id')
    .get(studentController.getStudentById)
    .put(studentController.updateStudent)
    .delete(studentController.deleteStudent);

export default router;
