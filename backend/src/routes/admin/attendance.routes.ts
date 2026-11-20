import {Router} from 'express';
import {attendanceController} from '@controllers/admin';

const router = Router();

router.route('/').post(attendanceController.recordAttendance);
router.route('/:batchId').put(attendanceController.getAttendance);

export default router;
