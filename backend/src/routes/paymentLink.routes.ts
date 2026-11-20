import {Router} from 'express';
import httpStatus from 'http-status';
import {z} from 'zod';
import {catchAsync, ApiResponse} from '@utils/index';
import paymentGatewayService from '../services/paymentGateway.service';

/** Mounted under /admin/payment-links and /teacher/payment-links (auth applied by the parent router). */
const router = Router();

router.get(
    '/status',
    catchAsync(async (_req, res) => {
        res.status(httpStatus.OK).json(
            new ApiResponse(httpStatus.OK, {configured: paymentGatewayService.isConfigured()}, 'Gateway status'),
        );
    }),
);

router
    .route('/')
    .get(
        catchAsync(async (req, res) => {
            const studentId = req.query.studentId ? String(req.query.studentId) : undefined;
            const result = await paymentGatewayService.listLinks(req.user!.adminId as string, studentId);
            res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, result, 'Payment links fetched'));
        }),
    )
    .post(
        catchAsync(async (req, res) => {
            const body = z
                .object({studentId: z.string().min(1), amount: z.coerce.number().positive().optional()})
                .parse(req.body);
            const link = await paymentGatewayService.createLink(
                req.user!.adminId as string,
                body.studentId,
                body.amount,
                req.user!.fullname,
            );
            res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, link, 'Payment link created'));
        }),
    );

router.post(
    '/:id/sync',
    catchAsync(async (req, res) => {
        const link = await paymentGatewayService.syncLink(req.user!.adminId as string, String(req.params.id));
        res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, link, 'Payment status updated'));
    }),
);

router.post(
    '/:id/cancel',
    catchAsync(async (req, res) => {
        const link = await paymentGatewayService.cancelLink(req.user!.adminId as string, String(req.params.id));
        res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, link, 'Payment link cancelled'));
    }),
);

export default router;
