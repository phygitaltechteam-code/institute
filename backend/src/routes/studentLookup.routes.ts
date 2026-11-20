import {Router} from 'express';
import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import studentLookupService from '../services/studentLookup.service';

/** Mounted under /admin/lookup and /teacher/lookup (auth is applied by the parent router). */
const router = Router();

router.get(
    '/students',
    catchAsync(async (req, res) => {
        const q = String(req.query.q ?? '');
        const limit = Number(req.query.limit) || 15;
        const result = await studentLookupService.search(req.user!.adminId as string, q, limit);
        res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, result, 'Students fetched'));
    }),
);

router.get(
    '/students/:id',
    catchAsync(async (req, res) => {
        const result = await studentLookupService.profile(req.user!.adminId as string, String(req.params.id));
        res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, result, 'Student profile fetched'));
    }),
);

export default router;
