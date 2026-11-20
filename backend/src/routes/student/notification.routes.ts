import {Router} from 'express';
import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import notificationService from '../../services/student/notification.service';

const router = Router();

router.get(
    '/',
    catchAsync(async (req, res) => {
        const result = await notificationService.list(req.user!.studentId as string);
        res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, result, 'Notifications fetched'));
    }),
);

export default router;
