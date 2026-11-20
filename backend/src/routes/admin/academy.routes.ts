import {Router} from 'express';
import c from '@controllers/admin/academy.controller';
import {academyUpload} from '@utils/academyUpload';

/** Online academy (LMS) admin API — mounted at /api/v1/admin/academy (admin JWT required). */
const router = Router();

router.post('/uploads', academyUpload.single('file'), c.upload);

router.route('/categories').get(c.listCategories).post(c.createCategory);
router.route('/categories/:id').patch(c.updateCategory).delete(c.deleteCategory);

router.get('/courses/options', c.courseOptions);
router.route('/courses').get(c.listCourses).post(c.createCourse);
router.route('/courses/:id').get(c.getCourse).put(c.updateCourse).delete(c.deleteCourse);

router.post('/sections', c.createSection);
router.patch('/sections/reorder', c.reorderSections);
router.route('/sections/:id').patch(c.updateSection).delete(c.deleteSection);

router.post('/lessons', c.createLesson);
router.patch('/lessons/reorder', c.reorderLessons);
router.route('/lessons/:id').patch(c.updateLesson).delete(c.deleteLesson);
router.post('/lessons/:id/resources', c.addResource);
router.delete('/resources/:id', c.deleteResource);

router.get('/questions', c.listQuestions);
router.post('/questions/:id/replies', c.replyQuestion);
router.patch('/questions/:id', c.resolveQuestion);
router.delete('/questions/:id', c.deleteQuestion);

router.route('/popular-courses').get(c.listPopular).put(c.setPopular);

router.get('/bundles/options', c.bundleOptions);
router.route('/bundles').get(c.listBundles).post(c.createBundle);
router.route('/bundles/:id').put(c.updateBundle).delete(c.deleteBundle);

router.route('/live-classes').get(c.listLiveClasses).post(c.createLiveClass);
router.route('/live-classes/:id').put(c.updateLiveClass).delete(c.deleteLiveClass);

router.route('/enrollments').get(c.listEnrollments).post(c.createEnrollments);
router.route('/enrollments/:id').patch(c.setEnrollmentStatus).delete(c.deleteEnrollment);
router.get('/invoices/:id', c.getInvoice);

router.post('/coupons/validate', c.validateCoupon);
router.route('/coupons').get(c.listCoupons).post(c.createCoupon);
router.route('/coupons/:id').put(c.updateCoupon).delete(c.deleteCoupon);

router.route('/partners').get(c.listPartners).post(c.createPartner);
router.route('/partners/:id').put(c.updatePartner).delete(c.deletePartner);
router.route('/payouts').get(c.listPayouts).post(c.createPayout);
router.route('/payouts/:id').patch(c.updatePayout).delete(c.deletePayout);

router.get('/report', c.report);

router.route('/files').get(c.listFiles).post(c.createFile);
router.route('/files/:id').patch(c.updateFile).delete(c.deleteFile);

router.route('/blogs').get(c.listBlogs).post(c.createBlog);
router.route('/blogs/:id').get(c.getBlog).put(c.updateBlog).delete(c.deleteBlog);

router.get('/contact-messages', c.listContactMessages);
router.route('/contact-messages/:id').patch(c.setContactMessageRead).delete(c.deleteContactMessage);

router.route('/settings/:key').get(c.getSetting).put(c.saveSetting);

router.get('/students/options', c.learnerOptions);
router.route('/students').get(c.listLearners).post(c.createLearner);
router.patch('/students/:id', c.updateLearner);
router.get('/students/:id/enrollments', c.learnerEnrollments);

export default router;
