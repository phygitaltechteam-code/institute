import {Router} from 'express';
import {userController} from '@controllers/index';
import {verifyJWT} from '@middlewares/index';

const {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUser,
    verifyVerificationCode,
    requestPasswordReset,
    resetPassword,
} = userController;

const router = Router();

// Public routes
router.route('/register').post(registerUser);
router.route('/verify-code').post(verifyVerificationCode);
router.route('/login').post(loginUser);
router.route('/reset-password-request').post(requestPasswordReset);

// Private routes
router.use(verifyJWT);
router.route('/refresh').post(refreshAccessToken);
router.route('/logout').post(logoutUser);
router.route('/reset-password').post(resetPassword);
router.route('/change-password').post(changeCurrentPassword);
router.route('/me').get(getCurrentUser);
router.route('/update').patch(updateUser);

export default router;
