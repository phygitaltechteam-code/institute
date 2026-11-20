import {Router} from 'express';
import {accountController} from '@controllers/teacher';

const router = Router();

router.route('/').get(accountController.getAccounts);
// router.route('/:id').get(accountController.getAccountById);

export default router;
