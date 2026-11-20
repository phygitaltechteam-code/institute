import {Router} from 'express';
import userRoute from './user.routes';
import adminRoutes from './admin/index';
import teacherRoutes from './teacher/index';
import studentRoutes from './student/index';
import externalRoutes from './external.routes';
import superAdminRoutes from './superAdmin/index';
import publicRoutes from './public.routes';
import {catchAsync} from '@utils/index';
import paymentGatewayService from '../services/paymentGateway.service';

const router = Router();

router.use('/users', userRoute);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/external', externalRoutes);
router.use('/superadmin', superAdminRoutes);
router.use('/public', publicRoutes);

// Razorpay webhook (public; verified by signature). Set this URL in Razorpay Dashboard → Webhooks → event payment_link.paid
router.post(
    '/webhooks/razorpay',
    catchAsync(async (req: any, res) => {
        const result = await paymentGatewayService.handleWebhook(req.rawBody, req.get('x-razorpay-signature'), req.body);
        res.status(200).json(result);
    }),
);

export default router;
