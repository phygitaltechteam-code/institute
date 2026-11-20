import {Router} from 'express';
import {feeController} from '@controllers/admin';

const router = Router();

router.route('/collect').post(feeController.collectFee).get(feeController.getFeeCollections);

router.route('/followups').post(feeController.createFeeFollowup).get(feeController.getFeeFollowups);

export default router;
