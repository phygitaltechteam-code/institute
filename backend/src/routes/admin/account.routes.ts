import {Router} from 'express';
import {accountController} from '@controllers/admin';

const router = Router();

router.route('/').post(accountController.createAccount).get(accountController.getAccounts);

router
    .route('/:id')
    .get(accountController.getAccountById)
    .put(accountController.updateAccount)
    .delete(accountController.deleteAccount);

export default router;
