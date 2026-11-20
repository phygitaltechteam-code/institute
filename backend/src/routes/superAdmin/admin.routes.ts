import {Router} from 'express';
import {adminController} from '@controllers/index';

const router = Router();

router.route('/').post(adminController.registerAdmin).get(adminController.getAdmins);
router.route('/data/:id').delete(adminController.deleteAdminData);

router
    .route('/:id')
    .get(adminController.getAdminById)
    .patch(adminController.updateAdmin)
    .delete(adminController.deleteAdmin);

export default router;
