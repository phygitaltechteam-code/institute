import prisma from '@client';
import {Prisma} from '@prisma/client';
import httpStatus from 'http-status';
import {z} from 'zod';
import ApiError from '@utils/ApiError';
import {removeAcademyFile} from '@utils/academyUpload';
import * as v from '@validations/academy.validation';

type CourseInput = z.infer<typeof v.courseSchema>;
type LessonInput = z.infer<typeof v.lessonSchema>;
type LessonUpdate = z.infer<typeof v.lessonUpdateSchema>;

const notFound = (what: string) => new ApiError(httpStatus.NOT_FOUND, `${what} not found`);

class AcademyCourseService {
    // ── Categories ────────────────────────────────────────────
    listCategories(adminId: string) {
        return prisma.courseCategory.findMany({
            where: {adminId},
            orderBy: {name: 'asc'},
            include: {_count: {select: {courses: true}}},
        });
    }

    async createCategory(adminId: string, name: string) {
        const exists = await prisma.courseCategory.findUnique({where: {adminId_name: {adminId, name}}});
        if (exists) throw new ApiError(httpStatus.CONFLICT, 'A category with this name already exists');
        return prisma.courseCategory.create({data: {adminId, name}});
    }

    async updateCategory(adminId: string, id: string, name: string) {
        await this.findCategory(adminId, id);
        const clash = await prisma.courseCategory.findFirst({where: {adminId, name, NOT: {id}}});
        if (clash) throw new ApiError(httpStatus.CONFLICT, 'A category with this name already exists');
        return prisma.courseCategory.update({where: {id}, data: {name}});
    }

    async deleteCategory(adminId: string, id: string) {
        await this.findCategory(adminId, id);
        const courses = await prisma.onlineCourse.count({where: {categoryId: id}});
        if (courses > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `This category has ${courses} course(s). Move them to another category first.`,
            );
        }
        return prisma.courseCategory.delete({where: {id}});
    }

    private async findCategory(adminId: string, id: string) {
        const cat = await prisma.courseCategory.findFirst({where: {id, adminId}});
        if (!cat) throw notFound('Category');
        return cat;
    }

    // ── Courses ───────────────────────────────────────────────
    async listCourses(
        adminId: string,
        q: {search?: string; categoryId?: string; status?: string},
    ) {
        const where: Prisma.OnlineCourseWhereInput = {adminId};
        if (q.search) where.name = {contains: q.search, mode: 'insensitive'};
        if (q.categoryId) where.categoryId = q.categoryId;
        if (q.status && ['DRAFT', 'PUBLIC', 'PRIVATE'].includes(q.status)) {
            where.status = q.status as 'DRAFT' | 'PUBLIC' | 'PRIVATE';
        }
        const courses = await prisma.onlineCourse.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            include: {
                category: {select: {id: true, name: true}},
                sections: {select: {_count: {select: {lessons: true}}}},
                _count: {select: {sections: true, enrollments: {where: {status: 'ACTIVE'}}}},
            },
        });
        return courses.map(({sections, _count, ...c}) => ({
            ...c,
            sectionCount: _count.sections,
            lessonCount: sections.reduce((s, x) => s + x._count.lessons, 0),
            enrollmentCount: _count.enrollments,
        }));
    }

    /** Compact list for dropdowns (enrollment, coupons, bundles, live classes). */
    courseOptions(adminId: string) {
        return prisma.onlineCourse.findMany({
            where: {adminId},
            orderBy: {name: 'asc'},
            select: {id: true, name: true, price: true, discountPrice: true, status: true, validityDays: true},
        });
    }

    async getCourse(adminId: string, id: string) {
        const course = await prisma.onlineCourse.findFirst({
            where: {id, adminId},
            include: {
                category: {select: {id: true, name: true}},
                sections: {
                    orderBy: [{order: 'asc'}, {createdAt: 'asc'}],
                    include: {
                        lessons: {
                            orderBy: [{order: 'asc'}, {createdAt: 'asc'}],
                            include: {resources: {orderBy: {createdAt: 'asc'}}},
                        },
                    },
                },
                _count: {select: {enrollments: {where: {status: 'ACTIVE'}}, questions: true}},
            },
        });
        if (!course) throw notFound('Course');
        const revenue = await prisma.enrollment.aggregate({
            where: {courseId: id, status: 'ACTIVE'},
            _sum: {amountPaid: true},
        });
        return {...course, revenue: revenue._sum.amountPaid ?? 0};
    }

    private async assertCategory(adminId: string, categoryId: string | null) {
        if (categoryId) await this.findCategory(adminId, categoryId);
    }

    async createCourse(adminId: string, data: CourseInput) {
        await this.assertCategory(adminId, data.categoryId);
        return prisma.onlineCourse.create({data: {...data, adminId, faqs: data.faqs}});
    }

    async updateCourse(adminId: string, id: string, data: CourseInput) {
        const course = await this.findCourse(adminId, id);
        await this.assertCategory(adminId, data.categoryId);
        if (course.thumbnail && course.thumbnail !== data.thumbnail) removeAcademyFile(course.thumbnail);
        return prisma.onlineCourse.update({where: {id}, data: {...data, faqs: data.faqs}});
    }

    async deleteCourse(adminId: string, id: string) {
        const course = await this.findCourse(adminId, id);
        const enrolled = await prisma.enrollment.count({where: {courseId: id}});
        if (enrolled > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `${enrolled} enrollment(s) exist for this course. Set it to Private instead of deleting it.`,
            );
        }
        const lessons = await prisma.courseLesson.findMany({
            where: {section: {courseId: id}},
            select: {videoUrl: true, resources: {select: {fileUrl: true}}},
        });
        await prisma.onlineCourse.delete({where: {id}});
        removeAcademyFile(course.thumbnail);
        lessons.forEach((l) => {
            removeAcademyFile(l.videoUrl);
            l.resources.forEach((r) => removeAcademyFile(r.fileUrl));
        });
        return {id};
    }

    async findCourse(adminId: string, id: string) {
        const course = await prisma.onlineCourse.findFirst({where: {id, adminId}});
        if (!course) throw notFound('Course');
        return course;
    }

    // ── Sections ──────────────────────────────────────────────
    async createSection(adminId: string, courseId: string, title: string) {
        await this.findCourse(adminId, courseId);
        const order = await prisma.courseSection.count({where: {courseId}});
        return prisma.courseSection.create({data: {courseId, title, order}});
    }

    private async findSection(adminId: string, id: string) {
        const section = await prisma.courseSection.findFirst({where: {id, course: {adminId}}});
        if (!section) throw notFound('Section');
        return section;
    }

    async updateSection(adminId: string, id: string, title: string) {
        await this.findSection(adminId, id);
        return prisma.courseSection.update({where: {id}, data: {title}});
    }

    async deleteSection(adminId: string, id: string) {
        await this.findSection(adminId, id);
        const lessons = await prisma.courseLesson.findMany({
            where: {sectionId: id},
            select: {videoUrl: true, resources: {select: {fileUrl: true}}},
        });
        await prisma.courseSection.delete({where: {id}});
        lessons.forEach((l) => {
            removeAcademyFile(l.videoUrl);
            l.resources.forEach((r) => removeAcademyFile(r.fileUrl));
        });
        return {id};
    }

    async reorderSections(adminId: string, ids: string[]) {
        const count = await prisma.courseSection.count({where: {id: {in: ids}, course: {adminId}}});
        if (count !== ids.length) throw notFound('Section');
        await prisma.$transaction(
            ids.map((id, order) => prisma.courseSection.update({where: {id}, data: {order}})),
        );
        return {ok: true};
    }

    // ── Lessons ───────────────────────────────────────────────
    async createLesson(adminId: string, data: LessonInput) {
        await this.findSection(adminId, data.sectionId);
        const order = await prisma.courseLesson.count({where: {sectionId: data.sectionId}});
        return prisma.courseLesson.create({data: {...data, order}});
    }

    private async findLesson(adminId: string, id: string) {
        const lesson = await prisma.courseLesson.findFirst({where: {id, section: {course: {adminId}}}});
        if (!lesson) throw notFound('Lesson');
        return lesson;
    }

    async updateLesson(adminId: string, id: string, data: LessonUpdate) {
        const lesson = await this.findLesson(adminId, id);
        if (data.videoUrl !== undefined && lesson.videoUrl && lesson.videoUrl !== data.videoUrl) {
            removeAcademyFile(lesson.videoUrl);
        }
        return prisma.courseLesson.update({where: {id}, data});
    }

    async deleteLesson(adminId: string, id: string) {
        const lesson = await this.findLesson(adminId, id);
        const resources = await prisma.lessonResource.findMany({where: {lessonId: id}});
        await prisma.courseLesson.delete({where: {id}});
        removeAcademyFile(lesson.videoUrl);
        resources.forEach((r) => removeAcademyFile(r.fileUrl));
        return {id};
    }

    async reorderLessons(adminId: string, ids: string[]) {
        const count = await prisma.courseLesson.count({
            where: {id: {in: ids}, section: {course: {adminId}}},
        });
        if (count !== ids.length) throw notFound('Lesson');
        await prisma.$transaction(
            ids.map((id, order) => prisma.courseLesson.update({where: {id}, data: {order}})),
        );
        return {ok: true};
    }

    // ── Lesson resources ──────────────────────────────────────
    async addResource(adminId: string, lessonId: string, data: z.infer<typeof v.resourceSchema>) {
        await this.findLesson(adminId, lessonId);
        return prisma.lessonResource.create({data: {...data, lessonId}});
    }

    async deleteResource(adminId: string, id: string) {
        const res = await prisma.lessonResource.findFirst({
            where: {id, lesson: {section: {course: {adminId}}}},
        });
        if (!res) throw notFound('Resource');
        await prisma.lessonResource.delete({where: {id}});
        removeAcademyFile(res.fileUrl);
        return {id};
    }

    // ── Student Q&A ───────────────────────────────────────────
    async listQuestions(adminId: string, q: {courseId?: string; status?: string; search?: string}) {
        const where: Prisma.CourseQuestionWhereInput = {course: {adminId}};
        if (q.courseId) where.courseId = q.courseId;
        if (q.status === 'open') where.isResolved = false;
        if (q.status === 'resolved') where.isResolved = true;
        if (q.search) where.question = {contains: q.search, mode: 'insensitive'};
        const [items, open] = await Promise.all([
            prisma.courseQuestion.findMany({
                where,
                orderBy: [{isResolved: 'asc'}, {createdAt: 'desc'}],
                take: 200,
                include: {
                    course: {select: {id: true, name: true}},
                    lesson: {select: {id: true, title: true}},
                    student: {select: {id: true, user: {select: {fullname: true, phoneNumber: true}}}},
                    replies: {orderBy: {createdAt: 'asc'}},
                },
            }),
            prisma.courseQuestion.count({where: {course: {adminId}, isResolved: false}}),
        ]);
        return {items, openCount: open};
    }

    private async findQuestion(adminId: string, id: string) {
        const q = await prisma.courseQuestion.findFirst({where: {id, course: {adminId}}});
        if (!q) throw notFound('Question');
        return q;
    }

    async replyQuestion(
        adminId: string,
        id: string,
        user: {id: string; fullname: string},
        message: string,
    ) {
        await this.findQuestion(adminId, id);
        const [reply] = await prisma.$transaction([
            prisma.courseQuestionReply.create({
                data: {questionId: id, userId: user.id, authorName: user.fullname, isStaff: true, message},
            }),
            prisma.courseQuestion.update({where: {id}, data: {isResolved: true}}),
        ]);
        return reply;
    }

    async setQuestionResolved(adminId: string, id: string, isResolved: boolean) {
        await this.findQuestion(adminId, id);
        return prisma.courseQuestion.update({where: {id}, data: {isResolved}});
    }

    async deleteQuestion(adminId: string, id: string) {
        await this.findQuestion(adminId, id);
        await prisma.courseQuestion.delete({where: {id}});
        return {id};
    }

    // ── Popular courses (shown on the website home page) ─────
    listPopular(adminId: string) {
        return prisma.onlineCourse.findMany({
            where: {adminId, isPopular: true},
            orderBy: {popularOrder: 'asc'},
            select: {id: true, name: true, thumbnail: true, price: true, discountPrice: true, status: true},
        });
    }

    async setPopular(adminId: string, courseIds: string[]) {
        const unique = [...new Set(courseIds)];
        const owned = await prisma.onlineCourse.count({where: {adminId, id: {in: unique}}});
        if (owned !== unique.length) throw notFound('Course');
        await prisma.$transaction([
            prisma.onlineCourse.updateMany({where: {adminId}, data: {isPopular: false, popularOrder: 0}}),
            ...unique.map((id, i) =>
                prisma.onlineCourse.update({where: {id}, data: {isPopular: true, popularOrder: i}}),
            ),
        ]);
        return this.listPopular(adminId);
    }
}

export default new AcademyCourseService();
