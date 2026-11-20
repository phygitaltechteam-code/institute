import {Router, Request, Response} from 'express';
import httpStatus from 'http-status';
import prisma from '@client';
import ApiError from '@utils/ApiError';
import rateLimit from 'express-rate-limit';
import {contactMessageSchema} from '@validations/academy.validation';
import contentService from '@services/admin/academy/content.service';

/**
 * Public, read-only website data (no login): settings, popular/public courses, bundles, blogs.
 * Pass ?adminId=… for a specific institute; defaults to the first institute.
 */
const router = Router();

/** Live (active, not deleted) institutes only. */
const liveAdmin = {user: {isActive: true, deletedAt: null}} as const;

/**
 * The institute whose website is shown. With ?adminId=… that one; otherwise the oldest
 * live institute that has something to show (a public course or active bundle),
 * falling back to the oldest live institute. Deleted/disabled institutes are skipped.
 */
const instituteId = async (req: Request) => {
    const wanted = typeof req.query.adminId === 'string' ? req.query.adminId : undefined;
    const pick = {orderBy: {createdAt: 'asc'}, select: {id: true}} as const;
    const admin = wanted
        ? await prisma.admin.findFirst({where: {id: wanted, ...liveAdmin}, select: {id: true}})
        : ((await prisma.admin.findFirst({
              ...pick,
              where: {
                  ...liveAdmin,
                  OR: [{onlineCourses: {some: {status: 'PUBLIC'}}}, {bundles: {some: {isActive: true}}}],
              },
          })) ?? (await prisma.admin.findFirst({...pick, where: liveAdmin})));
    if (!admin) throw new ApiError(httpStatus.NOT_FOUND, 'Institute not found');
    return admin.id;
};

const courseCard = {
    id: true,
    name: true,
    shortDescription: true,
    thumbnail: true,
    price: true,
    discountPrice: true,
    level: true,
    language: true,
    category: {select: {id: true, name: true}},
} as const;

router.get('/website', async (req: Request, res: Response) => {
    const adminId = await instituteId(req);
    const row = await prisma.siteSetting.findUnique({where: {adminId_key: {adminId, key: 'website'}}});
    res.json({success: true, data: row?.value ?? {}});
});

router.get('/courses', async (req: Request, res: Response) => {
    const adminId = await instituteId(req);
    const popular = req.query.popular === 'true';
    const data = await prisma.onlineCourse.findMany({
        where: {adminId, status: 'PUBLIC', ...(popular ? {isPopular: true} : {})},
        orderBy: popular ? {popularOrder: 'asc'} : {createdAt: 'desc'},
        select: courseCard,
    });
    res.json({success: true, data});
});

router.get('/courses/:id', async (req: Request, res: Response) => {
    const adminId = await instituteId(req);
    const course = await prisma.onlineCourse.findFirst({
        where: {id: req.params.id, adminId, status: 'PUBLIC'},
        select: {
            ...courseCard,
            description: true,
            faqs: true,
            validityDays: true,
            sections: {
                orderBy: {order: 'asc'},
                select: {
                    title: true,
                    lessons: {
                        orderBy: {order: 'asc'},
                        select: {title: true, durationMinutes: true, isPreview: true, videoUrl: true},
                    },
                },
            },
        },
    });
    if (!course) throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
    // Only preview lessons expose their video
    course.sections.forEach((s) =>
        s.lessons.forEach((l) => {
            if (!l.isPreview) l.videoUrl = null;
        }),
    );
    res.json({success: true, data: course});
});

router.get('/bundles', async (req: Request, res: Response) => {
    const adminId = await instituteId(req);
    const data = await prisma.bundle.findMany({
        where: {adminId, isActive: true},
        orderBy: {createdAt: 'desc'},
        include: {courses: {select: {course: {select: courseCard}}}},
    });
    res.json({success: true, data});
});

/** One bundle's landing page: bundle, its courses with curriculum outline, and the institute's contact/branding. */
router.get('/bundles/:id', async (req: Request, res: Response) => {
    const bundle = await prisma.bundle.findFirst({
        where: {id: req.params.id, isActive: true},
        include: {
            courses: {
                select: {
                    course: {
                        select: {
                            ...courseCard,
                            description: true,
                            validityDays: true,
                            sections: {
                                orderBy: {order: 'asc'},
                                select: {
                                    title: true,
                                    lessons: {orderBy: {order: 'asc'}, select: {title: true, durationMinutes: true}},
                                },
                            },
                        },
                    },
                },
            },
            admin: {
                select: {
                    logo: true,
                    tagLine: true,
                    address: true,
                    city: true,
                    state: true,
                    user: {select: {fullname: true, phoneNumber: true, email: true}},
                },
            },
            _count: {select: {enrollments: true}},
        },
    });
    if (!bundle) throw new ApiError(httpStatus.NOT_FOUND, 'This bundle is not available');
    const website = await prisma.siteSetting.findUnique({
        where: {adminId_key: {adminId: bundle.adminId, key: 'website'}},
    });
    const {admin, courses, _count, adminId: _adminId, ...rest} = bundle;
    res.json({
        success: true,
        data: {
            ...rest,
            enrollmentCount: _count.enrollments,
            courses: courses.map((c) => c.course),
            institute: {
                name: admin.user.fullname,
                logo: admin.logo,
                tagline: admin.tagLine,
                phone: admin.user.phoneNumber,
                email: admin.user.email,
                address: [admin.address, admin.city, admin.state].filter(Boolean).join(', '),
            },
            website: website?.value ?? {},
        },
    });
});

/** Website contact form. Rate-limited per IP; a hidden "website" field catches simple bots. */
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {success: false, message: 'Too many messages. Please try again in a few minutes.'},
});
router.post('/contact', contactLimiter, async (req: Request, res: Response) => {
    const data = contactMessageSchema.parse(req.body);
    if (data.website) {
        // Bot filled the honeypot: pretend success, store nothing
        res.status(httpStatus.CREATED).json({success: true, message: 'Message sent'});
        return;
    }
    const adminId = await instituteId(req);
    await contentService.createContactMessage(adminId, data);
    res.status(httpStatus.CREATED).json({success: true, message: 'Thanks! We will get back to you soon.'});
});

router.get('/blogs', async (req: Request, res: Response) => {
    const adminId = await instituteId(req);
    const data = await prisma.blog.findMany({
        where: {adminId, isPublished: true},
        orderBy: {publishedAt: 'desc'},
        select: {id: true, title: true, slug: true, excerpt: true, coverImage: true, author: true, tags: true, publishedAt: true},
    });
    res.json({success: true, data});
});

router.get('/blogs/:slug', async (req: Request, res: Response) => {
    const adminId = await instituteId(req);
    const blog = await prisma.blog.findFirst({where: {adminId, slug: req.params.slug, isPublished: true}});
    if (!blog) throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
    res.json({success: true, data: blog});
});

export default router;
