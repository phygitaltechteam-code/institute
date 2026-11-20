import {Router} from 'express';
import {expenditureController} from '@controllers/admin';

const router = Router();

router
    .route('/')
    .post(expenditureController.createExpenditure)
    .get(expenditureController.getExpenditures);

router
    .route('/:id')
    .get(expenditureController.getExpenditureById)
    .put(expenditureController.updateExpenditure)
    .delete(expenditureController.deleteExpenditure);

export default router;
