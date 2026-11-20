import {Router} from 'express';
import {leadController} from '@controllers/teacher';

const router = Router();

router
    .route('/followups')
    .post(leadController.createLeadFollowUp)
    .get(leadController.getLeadFollowUps);

router
    .route('/followups/:id')
    .get(leadController.getLeadFollowUpById)
    .patch(leadController.updateLeadFollowUp)
    .delete(leadController.deleteLeadFollowUp);

router.route('/').post(leadController.createLead).get(leadController.getLeads);

router
    .route('/:id')
    .get(leadController.getLeadById)
    .put(leadController.updateLead)
    .delete(leadController.deleteLead);

export default router;
