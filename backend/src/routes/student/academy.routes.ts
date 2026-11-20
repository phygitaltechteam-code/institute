import {Router, Request, Response} from 'express';
import httpStatus from 'http-status';
import prisma from '@client';
import ApiError from '@utils/ApiError';
import {studentQuestionSchema} from '@validations/academy.validation';

/** Student side of the online academy: my courses + asking questions (feeds admin Student Q&A). */
const router = Router();

const accessibleCourseIds = async (studentId: string) => {
    const now = new Date();
    const enrollments = await prisma.enrollment.findMany({
        where: {studentId, status: 'ACTIVE', OR: [{expiresAt: null}, {expiresAt: {gt: now}}]},
        select: {courseId: true, bundle: {select: {courses: {select: {courseId: true}}}}},
    });
    const ids = new Set<string>();
    enrollments.forEach((e) => {
        if (e.courseId) ids.add(e.courseId);
        e.bundle?.courses.forEach((c) => ids.add(c.courseId));
    });
    return [...ids];
};

router.get('/courses', async (req: Request, res: Response) => {
    const ids = await accessibleCourseIds(req.user!.studentId!);
    const courses = await prisma.onlineCourse.findMany({
        where: {id: {in: ids}},
        include: {
            sections: {
                orderBy: {order: 'asc'},
                include: {lessons: {orderBy: {order: 'asc'}, include: {resources: true}}},
            },
            liveClasses: {where: {status: 'SCHEDULED'}, orderBy: {scheduledAt: 'asc'}},
        },
    });
    res.json({success: true, data: courses});
});

router.get('/questions', async (req: Request, res: Response) => {
    const items = await prisma.courseQuestion.findMany({
        where: {studentId: req.user!.studentId!},
        orderBy: {createdAt: 'desc'},
        include: {course: {select: {name: true}}, replies: {orderBy: {createdAt: 'asc'}}},
    });
    res.json({success: true, data: items});
});

router.post('/questions', async (req: Request, res: Response) => {
    const data = studentQuestionSchema.parse(req.body);
    const ids = await accessibleCourseIds(req.user!.studentId!);
    if (!ids.includes(data.courseId)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not enrolled in this course');
    }
    const q = await prisma.courseQuestion.create({
        data: {...data, studentId: req.user!.studentId!},
    });
    res.status(httpStatus.CREATED).json({success: true, data: q});
});

export default router;
