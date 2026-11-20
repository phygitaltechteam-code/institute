import {Request, Response} from 'express';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import {ACADEMY_URL_PREFIX, fileKind} from '@utils/academyUpload';
import * as v from '@validations/academy.validation';
import courseService from '@services/admin/academy/course.service';
import salesService from '@services/admin/academy/sales.service';
import contentService from '@services/admin/academy/content.service';

const adminOf = (req: Request) => {
    const adminId = req.user?.adminId;
    if (!adminId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Admin not found');
    return adminId;
};
const ok = (res: Response, data: unknown, message = 'Success', status: number = httpStatus.OK) =>
    res.status(status).json({success: true, message, data});
const str = (x: unknown) => (typeof x === 'string' && x.trim() ? x.trim() : undefined);
const pageOf = (req: Request) => ({
    page: Math.max(1, Number(req.query.page) || 1),
    limit: Math.min(200, Math.max(1, Number(req.query.limit) || 20)),
});
const id = (req: Request) => String(req.params.id);

class AcademyController {
    // Upload
    upload = async (req: Request, res: Response) => {
        const file = req.file as Express.Multer.File | undefined;
        if (!file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file received');
        ok(res, {
            url: `${ACADEMY_URL_PREFIX}${file.filename}`,
            name: file.originalname,
            fileType: fileKind(file.originalname),
            sizeBytes: file.size,
        }, 'Uploaded', httpStatus.CREATED);
    };

    // Categories
    listCategories = async (req: Request, res: Response) => ok(res, await courseService.listCategories(adminOf(req)));
    createCategory = async (req: Request, res: Response) =>
        ok(res, await courseService.createCategory(adminOf(req), v.categorySchema.parse(req.body).name), 'Category created', 201);
    updateCategory = async (req: Request, res: Response) =>
        ok(res, await courseService.updateCategory(adminOf(req), id(req), v.categorySchema.parse(req.body).name), 'Category updated');
    deleteCategory = async (req: Request, res: Response) =>
        ok(res, await courseService.deleteCategory(adminOf(req), id(req)), 'Category deleted');

    // Courses
    listCourses = async (req: Request, res: Response) =>
        ok(res, await courseService.listCourses(adminOf(req), {
            search: str(req.query.search),
            categoryId: str(req.query.categoryId),
            status: str(req.query.status),
        }));
    courseOptions = async (req: Request, res: Response) => ok(res, await courseService.courseOptions(adminOf(req)));
    getCourse = async (req: Request, res: Response) => ok(res, await courseService.getCourse(adminOf(req), id(req)));
    createCourse = async (req: Request, res: Response) =>
        ok(res, await courseService.createCourse(adminOf(req), v.courseSchema.parse(req.body)), 'Course created', 201);
    updateCourse = async (req: Request, res: Response) =>
        ok(res, await courseService.updateCourse(adminOf(req), id(req), v.courseSchema.parse(req.body)), 'Course updated');
    deleteCourse = async (req: Request, res: Response) =>
        ok(res, await courseService.deleteCourse(adminOf(req), id(req)), 'Course deleted');

    // Sections
    createSection = async (req: Request, res: Response) => {
        const d = v.sectionSchema.parse(req.body);
        ok(res, await courseService.createSection(adminOf(req), d.courseId, d.title), 'Section added', 201);
    };
    updateSection = async (req: Request, res: Response) =>
        ok(res, await courseService.updateSection(adminOf(req), id(req), v.sectionUpdateSchema.parse(req.body).title), 'Section updated');
    deleteSection = async (req: Request, res: Response) =>
        ok(res, await courseService.deleteSection(adminOf(req), id(req)), 'Section deleted');
    reorderSections = async (req: Request, res: Response) =>
        ok(res, await courseService.reorderSections(adminOf(req), v.reorderSchema.parse(req.body).ids), 'Order saved');

    // Lessons
    createLesson = async (req: Request, res: Response) =>
        ok(res, await courseService.createLesson(adminOf(req), v.lessonSchema.parse(req.body)), 'Lesson added', 201);
    updateLesson = async (req: Request, res: Response) =>
        ok(res, await courseService.updateLesson(adminOf(req), id(req), v.lessonUpdateSchema.parse(req.body)), 'Lesson updated');
    deleteLesson = async (req: Request, res: Response) =>
        ok(res, await courseService.deleteLesson(adminOf(req), id(req)), 'Lesson deleted');
    reorderLessons = async (req: Request, res: Response) =>
        ok(res, await courseService.reorderLessons(adminOf(req), v.reorderSchema.parse(req.body).ids), 'Order saved');
    addResource = async (req: Request, res: Response) =>
        ok(res, await courseService.addResource(adminOf(req), id(req), v.resourceSchema.parse(req.body)), 'Resource added', 201);
    deleteResource = async (req: Request, res: Response) =>
        ok(res, await courseService.deleteResource(adminOf(req), id(req)), 'Resource deleted');

    // Q&A
    listQuestions = async (req: Request, res: Response) =>
        ok(res, await courseService.listQuestions(adminOf(req), {
            courseId: str(req.query.courseId),
            status: str(req.query.status),
            search: str(req.query.search),
        }));
    replyQuestion = async (req: Request, res: Response) =>
        ok(res, await courseService.replyQuestion(
            adminOf(req),
            id(req),
            {id: req.user!.id, fullname: req.user!.fullname},
            v.replySchema.parse(req.body).message,
        ), 'Reply sent', 201);
    resolveQuestion = async (req: Request, res: Response) =>
        ok(res, await courseService.setQuestionResolved(adminOf(req), id(req), req.body?.isResolved !== false), 'Updated');
    deleteQuestion = async (req: Request, res: Response) =>
        ok(res, await courseService.deleteQuestion(adminOf(req), id(req)), 'Question deleted');

    // Popular
    listPopular = async (req: Request, res: Response) => ok(res, await courseService.listPopular(adminOf(req)));
    setPopular = async (req: Request, res: Response) =>
        ok(res, await courseService.setPopular(adminOf(req), v.popularSchema.parse(req.body).courseIds), 'Popular courses saved');

    // Bundles
    listBundles = async (req: Request, res: Response) => ok(res, await contentService.listBundles(adminOf(req)));
    bundleOptions = async (req: Request, res: Response) => ok(res, await contentService.bundleOptions(adminOf(req)));
    createBundle = async (req: Request, res: Response) =>
        ok(res, await contentService.createBundle(adminOf(req), v.bundleSchema.parse(req.body)), 'Bundle created', 201);
    updateBundle = async (req: Request, res: Response) =>
        ok(res, await contentService.updateBundle(adminOf(req), id(req), v.bundleSchema.parse(req.body)), 'Bundle updated');
    deleteBundle = async (req: Request, res: Response) =>
        ok(res, await contentService.deleteBundle(adminOf(req), id(req)), 'Bundle deleted');

    // Live classes
    listLiveClasses = async (req: Request, res: Response) =>
        ok(res, await contentService.listLiveClasses(adminOf(req), {
            status: str(req.query.status),
            courseId: str(req.query.courseId),
        }));
    createLiveClass = async (req: Request, res: Response) =>
        ok(res, await contentService.createLiveClass(adminOf(req), v.liveClassSchema.parse(req.body)), 'Live class scheduled', 201);
    updateLiveClass = async (req: Request, res: Response) =>
        ok(res, await contentService.updateLiveClass(adminOf(req), id(req), v.liveClassSchema.parse(req.body)), 'Live class updated');
    deleteLiveClass = async (req: Request, res: Response) =>
        ok(res, await contentService.deleteLiveClass(adminOf(req), id(req)), 'Live class deleted');

    // Enrollments & invoices
    listEnrollments = async (req: Request, res: Response) =>
        ok(res, await salesService.listEnrollments(adminOf(req), {
            ...pageOf(req),
            search: str(req.query.search),
            courseId: str(req.query.courseId),
            bundleId: str(req.query.bundleId),
            status: str(req.query.status),
            paymentMode: str(req.query.paymentMode),
            from: str(req.query.from),
            to: str(req.query.to),
            paidOnly: req.query.paidOnly === 'true',
        }));
    createEnrollments = async (req: Request, res: Response) =>
        ok(res, await salesService.createEnrollments(adminOf(req), v.enrollmentSchema.parse(req.body)), 'Enrollment saved', 201);
    setEnrollmentStatus = async (req: Request, res: Response) =>
        ok(res, await salesService.setEnrollmentStatus(adminOf(req), id(req), v.enrollmentStatusSchema.parse(req.body).status), 'Enrollment updated');
    deleteEnrollment = async (req: Request, res: Response) =>
        ok(res, await salesService.deleteEnrollment(adminOf(req), id(req)), 'Enrollment deleted');
    getInvoice = async (req: Request, res: Response) => ok(res, await salesService.getInvoice(adminOf(req), id(req)));

    // Coupons
    listCoupons = async (req: Request, res: Response) => ok(res, await salesService.listCoupons(adminOf(req)));
    createCoupon = async (req: Request, res: Response) =>
        ok(res, await salesService.createCoupon(adminOf(req), v.couponSchema.parse(req.body)), 'Coupon created', 201);
    updateCoupon = async (req: Request, res: Response) =>
        ok(res, await salesService.updateCoupon(adminOf(req), id(req), v.couponSchema.parse(req.body)), 'Coupon updated');
    deleteCoupon = async (req: Request, res: Response) =>
        ok(res, await salesService.deleteCoupon(adminOf(req), id(req)), 'Coupon deleted');
    validateCoupon = async (req: Request, res: Response) =>
        ok(res, await salesService.validateCoupon(adminOf(req), v.couponValidateSchema.parse(req.body)), 'Coupon applied');

    // Partners & payouts
    listPartners = async (req: Request, res: Response) => ok(res, await salesService.listPartners(adminOf(req)));
    createPartner = async (req: Request, res: Response) =>
        ok(res, await salesService.createPartner(adminOf(req), v.partnerSchema.parse(req.body)), 'Partner added', 201);
    updatePartner = async (req: Request, res: Response) =>
        ok(res, await salesService.updatePartner(adminOf(req), id(req), v.partnerSchema.parse(req.body)), 'Partner updated');
    deletePartner = async (req: Request, res: Response) =>
        ok(res, await salesService.deletePartner(adminOf(req), id(req)), 'Partner deleted');
    listPayouts = async (req: Request, res: Response) =>
        ok(res, await salesService.listPayouts(adminOf(req), {
            partnerId: str(req.query.partnerId),
            status: str(req.query.status),
        }));
    createPayout = async (req: Request, res: Response) =>
        ok(res, await salesService.createPayout(adminOf(req), v.payoutSchema.parse(req.body)), 'Payout recorded', 201);
    updatePayout = async (req: Request, res: Response) =>
        ok(res, await salesService.updatePayout(adminOf(req), id(req), v.payoutUpdateSchema.parse(req.body)), 'Payout updated');
    deletePayout = async (req: Request, res: Response) =>
        ok(res, await salesService.deletePayout(adminOf(req), id(req)), 'Payout deleted');

    // Report
    report = async (req: Request, res: Response) =>
        ok(res, await salesService.report(adminOf(req), {from: str(req.query.from), to: str(req.query.to)}));

    // Educational files
    listFiles = async (req: Request, res: Response) =>
        ok(res, await contentService.listFiles(adminOf(req), {
            search: str(req.query.search),
            category: str(req.query.category),
            courseId: str(req.query.courseId),
        }));
    createFile = async (req: Request, res: Response) =>
        ok(res, await contentService.createFile(adminOf(req), v.educationalFileSchema.parse(req.body)), 'File added', 201);
    updateFile = async (req: Request, res: Response) =>
        ok(res, await contentService.updateFile(adminOf(req), id(req), v.educationalFileUpdateSchema.parse(req.body)), 'File updated');
    deleteFile = async (req: Request, res: Response) =>
        ok(res, await contentService.deleteFile(adminOf(req), id(req)), 'File deleted');

    // Blogs
    listBlogs = async (req: Request, res: Response) =>
        ok(res, await contentService.listBlogs(adminOf(req), {search: str(req.query.search), status: str(req.query.status)}));
    getBlog = async (req: Request, res: Response) => ok(res, await contentService.getBlog(adminOf(req), id(req)));
    createBlog = async (req: Request, res: Response) =>
        ok(res, await contentService.createBlog(adminOf(req), v.blogSchema.parse(req.body)), 'Blog saved', 201);
    updateBlog = async (req: Request, res: Response) =>
        ok(res, await contentService.updateBlog(adminOf(req), id(req), v.blogSchema.parse(req.body)), 'Blog updated');
    deleteBlog = async (req: Request, res: Response) =>
        ok(res, await contentService.deleteBlog(adminOf(req), id(req)), 'Blog deleted');

    // Contact messages from the website form
    listContactMessages = async (req: Request, res: Response) =>
        ok(
            res,
            await contentService.listContactMessages(adminOf(req), {
                ...pageOf(req),
                search: str(req.query.search),
                status: str(req.query.status),
            }),
        );
    setContactMessageRead = async (req: Request, res: Response) =>
        ok(
            res,
            await contentService.setContactMessageRead(adminOf(req), id(req), v.contactReadSchema.parse(req.body).isRead),
            'Message updated',
        );
    deleteContactMessage = async (req: Request, res: Response) =>
        ok(res, await contentService.deleteContactMessage(adminOf(req), id(req)), 'Message deleted');

    // Settings
    getSetting = async (req: Request, res: Response) => {
        const key = v.settingKeySchema.parse(req.params.key);
        const data =
            key === 'business'
                ? await contentService.getBusinessSettings(adminOf(req))
                : await contentService.getSetting(adminOf(req), key);
        ok(res, data);
    };
    saveSetting = async (req: Request, res: Response) => {
        const key = v.settingKeySchema.parse(req.params.key);
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Settings must be an object');
        }
        ok(res, await contentService.saveSetting(adminOf(req), key, req.body), 'Settings saved');
    };

    // Learners
    listLearners = async (req: Request, res: Response) =>
        ok(res, await contentService.listLearners(adminOf(req), {...pageOf(req), search: str(req.query.search)}));
    learnerOptions = async (req: Request, res: Response) =>
        ok(res, await contentService.learnerOptions(adminOf(req), str(req.query.search)));
    createLearner = async (req: Request, res: Response) =>
        ok(res, await contentService.createLearner(adminOf(req), v.learnerSchema.parse(req.body)), 'Student added', 201);
    updateLearner = async (req: Request, res: Response) =>
        ok(res, await contentService.updateLearner(adminOf(req), id(req), v.learnerUpdateSchema.parse(req.body)), 'Student updated');
    learnerEnrollments = async (req: Request, res: Response) =>
        ok(res, await contentService.learnerEnrollments(adminOf(req), id(req)));
}

export default new AcademyController();
