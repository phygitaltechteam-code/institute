import prisma from '@client';
import {Prisma, Role} from '@prisma/client';
import httpStatus from 'http-status';
import {z} from 'zod';
import ApiError from '@utils/ApiError';
import {encryptPassword} from '@utils/index';
import {removeAcademyFile} from '@utils/academyUpload';
import userService from '@services/user.service';
import * as v from '@validations/academy.validation';

const notFound = (what: string) => new ApiError(httpStatus.NOT_FOUND, `${what} not found`);

export type BusinessSettings = {
    businessName?: string;
    legalName?: string;
    gstNumber?: string;
    panNumber?: string;
    gstPercent?: number;
    sacCode?: string;
    invoicePrefix?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
    invoiceFooter?: string;
};

const slugify = (s: string) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120) || 'post';

class AcademyContentService {
    // ── Bundles ───────────────────────────────────────────────
    async listBundles(adminId: string) {
        const bundles = await prisma.bundle.findMany({
            where: {adminId},
            orderBy: {createdAt: 'desc'},
            include: {
                courses: {include: {course: {select: {id: true, name: true, price: true, discountPrice: true}}}},
                _count: {select: {enrollments: {where: {status: 'ACTIVE'}}}},
            },
        });
        return bundles.map(({courses, _count, ...b}) => ({
            ...b,
            courses: courses.map((c) => c.course),
            enrollmentCount: _count.enrollments,
        }));
    }

    private async assertCourses(adminId: string, ids: string[]) {
        const unique = [...new Set(ids)];
        const count = await prisma.onlineCourse.count({where: {adminId, id: {in: unique}}});
        if (count !== unique.length) throw notFound('Course');
        return unique;
    }

    async createBundle(adminId: string, data: z.infer<typeof v.bundleSchema>) {
        const {courseIds, ...rest} = data;
        const ids = await this.assertCourses(adminId, courseIds);
        return prisma.bundle.create({
            data: {...rest, adminId, courses: {create: ids.map((courseId) => ({courseId}))}},
        });
    }

    async updateBundle(adminId: string, id: string, data: z.infer<typeof v.bundleSchema>) {
        const bundle = await prisma.bundle.findFirst({where: {id, adminId}});
        if (!bundle) throw notFound('Bundle');
        const {courseIds, ...rest} = data;
        const ids = await this.assertCourses(adminId, courseIds);
        if (bundle.thumbnail && bundle.thumbnail !== rest.thumbnail) removeAcademyFile(bundle.thumbnail);
        return prisma.$transaction(async (tx) => {
            await tx.bundleCourse.deleteMany({where: {bundleId: id}});
            return tx.bundle.update({
                where: {id},
                data: {...rest, courses: {create: ids.map((courseId) => ({courseId}))}},
            });
        });
    }

    async deleteBundle(adminId: string, id: string) {
        const bundle = await prisma.bundle.findFirst({where: {id, adminId}});
        if (!bundle) throw notFound('Bundle');
        const enrolled = await prisma.enrollment.count({where: {bundleId: id}});
        if (enrolled > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `${enrolled} enrollment(s) exist for this bundle. Mark it inactive instead.`,
            );
        }
        await prisma.bundle.delete({where: {id}});
        removeAcademyFile(bundle.thumbnail);
        return {id};
    }

    bundleOptions(adminId: string) {
        return prisma.bundle.findMany({
            where: {adminId},
            orderBy: {name: 'asc'},
            select: {id: true, name: true, price: true, discountPrice: true, isActive: true},
        });
    }

    // ── Live classes ──────────────────────────────────────────
    listLiveClasses(adminId: string, q: {status?: string; courseId?: string}) {
        const where: Prisma.LiveClassWhereInput = {adminId};
        if (q.courseId) where.courseId = q.courseId;
        if (q.status === 'upcoming') {
            where.status = 'SCHEDULED';
            where.scheduledAt = {gte: new Date(Date.now() - 3 * 60 * 60 * 1000)};
        } else if (q.status && ['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(q.status)) {
            where.status = q.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
        }
        return prisma.liveClass.findMany({
            where,
            orderBy: {scheduledAt: q.status === 'upcoming' ? 'asc' : 'desc'},
            include: {course: {select: {id: true, name: true}}},
        });
    }

    private async assertCourse(adminId: string, courseId?: string | null) {
        if (courseId && !(await prisma.onlineCourse.findFirst({where: {id: courseId, adminId}}))) {
            throw notFound('Course');
        }
    }

    async createLiveClass(adminId: string, data: z.infer<typeof v.liveClassSchema>) {
        await this.assertCourse(adminId, data.courseId);
        return prisma.liveClass.create({data: {...data, adminId}});
    }

    async updateLiveClass(adminId: string, id: string, data: z.infer<typeof v.liveClassSchema>) {
        if (!(await prisma.liveClass.findFirst({where: {id, adminId}}))) throw notFound('Live class');
        await this.assertCourse(adminId, data.courseId);
        return prisma.liveClass.update({where: {id}, data});
    }

    async deleteLiveClass(adminId: string, id: string) {
        if (!(await prisma.liveClass.findFirst({where: {id, adminId}}))) throw notFound('Live class');
        await prisma.liveClass.delete({where: {id}});
        return {id};
    }

    // ── Educational files ─────────────────────────────────────
    listFiles(adminId: string, q: {search?: string; category?: string; courseId?: string}) {
        const where: Prisma.EducationalFileWhereInput = {adminId};
        if (q.category) where.category = q.category;
        if (q.courseId) where.courseId = q.courseId;
        if (q.search) where.title = {contains: q.search, mode: 'insensitive'};
        return prisma.educationalFile.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            include: {course: {select: {id: true, name: true}}},
        });
    }

    async createFile(adminId: string, data: z.infer<typeof v.educationalFileSchema>) {
        await this.assertCourse(adminId, data.courseId);
        return prisma.educationalFile.create({data: {...data, adminId}});
    }

    async updateFile(adminId: string, id: string, data: z.infer<typeof v.educationalFileUpdateSchema>) {
        if (!(await prisma.educationalFile.findFirst({where: {id, adminId}}))) throw notFound('File');
        await this.assertCourse(adminId, data.courseId);
        return prisma.educationalFile.update({where: {id}, data});
    }

    async deleteFile(adminId: string, id: string) {
        const file = await prisma.educationalFile.findFirst({where: {id, adminId}});
        if (!file) throw notFound('File');
        await prisma.educationalFile.delete({where: {id}});
        removeAcademyFile(file.fileUrl);
        return {id};
    }

    // ── Blogs ─────────────────────────────────────────────────
    listBlogs(adminId: string, q: {search?: string; status?: string}) {
        const where: Prisma.BlogWhereInput = {adminId};
        if (q.status === 'published') where.isPublished = true;
        if (q.status === 'draft') where.isPublished = false;
        if (q.search) where.title = {contains: q.search, mode: 'insensitive'};
        return prisma.blog.findMany({where, orderBy: {createdAt: 'desc'}});
    }

    async getBlog(adminId: string, id: string) {
        const blog = await prisma.blog.findFirst({where: {id, adminId}});
        if (!blog) throw notFound('Blog');
        return blog;
    }

    private async uniqueSlug(adminId: string, wanted: string, exceptId?: string) {
        const base = slugify(wanted);
        let slug = base;
        for (let i = 2; ; i++) {
            const clash = await prisma.blog.findFirst({
                where: {adminId, slug, ...(exceptId ? {NOT: {id: exceptId}} : {})},
            });
            if (!clash) return slug;
            slug = `${base}-${i}`;
        }
    }

    async createBlog(adminId: string, data: z.infer<typeof v.blogSchema>) {
        const slug = await this.uniqueSlug(adminId, data.slug || data.title);
        return prisma.blog.create({
            data: {...data, slug, adminId, publishedAt: data.isPublished ? new Date() : null},
        });
    }

    async updateBlog(adminId: string, id: string, data: z.infer<typeof v.blogSchema>) {
        const blog = await this.getBlog(adminId, id);
        const slug = await this.uniqueSlug(adminId, data.slug || data.title, id);
        if (blog.coverImage && blog.coverImage !== data.coverImage) removeAcademyFile(blog.coverImage);
        return prisma.blog.update({
            where: {id},
            data: {
                ...data,
                slug,
                publishedAt: data.isPublished ? (blog.publishedAt ?? new Date()) : null,
            },
        });
    }

    async deleteBlog(adminId: string, id: string) {
        const blog = await this.getBlog(adminId, id);
        await prisma.blog.delete({where: {id}});
        removeAcademyFile(blog.coverImage);
        return {id};
    }

    // ── Contact messages (website form) ───────────────────────
    async createContactMessage(adminId: string, data: z.infer<typeof v.contactMessageSchema>) {
        const {website: _honeypot, ...rest} = data;
        return prisma.contactMessage.create({data: {...rest, adminId}, select: {id: true}});
    }

    async listContactMessages(
        adminId: string,
        q: {page: number; limit: number; search?: string; status?: string},
    ) {
        const where: Prisma.ContactMessageWhereInput = {
            adminId,
            ...(q.status === 'unread' ? {isRead: false} : q.status === 'read' ? {isRead: true} : {}),
            ...(q.search
                ? {
                      OR: [
                          {name: {contains: q.search, mode: 'insensitive'}},
                          {email: {contains: q.search, mode: 'insensitive'}},
                          {phone: {contains: q.search}},
                          {subject: {contains: q.search, mode: 'insensitive'}},
                      ],
                  }
                : {}),
        };
        const [items, totalItems, unreadCount] = await Promise.all([
            prisma.contactMessage.findMany({
                where,
                orderBy: {createdAt: 'desc'},
                skip: (q.page - 1) * q.limit,
                take: q.limit,
            }),
            prisma.contactMessage.count({where}),
            prisma.contactMessage.count({where: {adminId, isRead: false}}),
        ]);
        return {items, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / q.limit)), unreadCount};
    }

    async setContactMessageRead(adminId: string, id: string, isRead: boolean) {
        const row = await prisma.contactMessage.findFirst({where: {id, adminId}, select: {id: true}});
        if (!row) throw notFound('Message');
        return prisma.contactMessage.update({where: {id}, data: {isRead}});
    }

    async deleteContactMessage(adminId: string, id: string) {
        const row = await prisma.contactMessage.findFirst({where: {id, adminId}, select: {id: true}});
        if (!row) throw notFound('Message');
        await prisma.contactMessage.delete({where: {id}});
        return {id};
    }

    // ── Settings (website, business & GST) ────────────────────
    async getSetting<T = Record<string, unknown>>(adminId: string, key: string): Promise<T> {
        const row = await prisma.siteSetting.findUnique({where: {adminId_key: {adminId, key}}});
        return ((row?.value as T) ?? {}) as T;
    }

    async getBusinessSettings(adminId: string) {
        const saved = await this.getSetting<BusinessSettings>(adminId, 'business');
        if (saved.businessName) return saved;
        // Fall back to the institute profile so invoices are never blank
        const admin = await prisma.admin.findUnique({
            where: {id: adminId},
            select: {address: true, city: true, state: true, pincode: true, gst: true, user: true},
        });
        return {
            businessName: admin?.user.fullname ?? 'MedCode Ninja',
            gstNumber: admin?.gst ?? '',
            address: admin?.address ?? '',
            city: admin?.city ?? '',
            state: admin?.state ?? '',
            pincode: admin?.pincode ?? '',
            email: admin?.user.email ?? '',
            phone: admin?.user.phoneNumber ?? '',
            gstPercent: 0,
            invoicePrefix: 'INV',
            ...saved,
        } as BusinessSettings;
    }

    async saveSetting(adminId: string, key: string, value: Prisma.InputJsonValue) {
        const row = await prisma.siteSetting.upsert({
            where: {adminId_key: {adminId, key}},
            create: {adminId, key, value},
            update: {value},
        });
        return row.value;
    }

    // ── Learners (Users → Manage students) ────────────────────
    async listLearners(adminId: string, q: {page: number; limit: number; search?: string}) {
        const where: Prisma.StudentWhereInput = {adminId, user: {deletedAt: null}};
        if (q.search) {
            where.user = {
                deletedAt: null,
                OR: [
                    {fullname: {contains: q.search, mode: 'insensitive'}},
                    {phoneNumber: {contains: q.search}},
                    {email: {contains: q.search, mode: 'insensitive'}},
                    {username: {contains: q.search, mode: 'insensitive'}},
                ],
            };
        }
        const [items, totalItems] = await Promise.all([
            prisma.student.findMany({
                where,
                orderBy: {createdAt: 'desc'},
                skip: (q.page - 1) * q.limit,
                take: q.limit,
                select: {
                    id: true,
                    city: true,
                    state: true,
                    qualification: true,
                    collegeName: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            fullname: true,
                            email: true,
                            phoneNumber: true,
                            isActive: true,
                        },
                    },
                    batchStudents: {select: {batch: {select: {name: true}}}},
                    _count: {select: {enrollments: {where: {status: 'ACTIVE'}}}},
                },
            }),
            prisma.student.count({where}),
        ]);
        return {
            items: items.map(({batchStudents, _count, ...s}) => ({
                ...s,
                batches: batchStudents.map((b) => b.batch.name),
                enrollmentCount: _count.enrollments,
            })),
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / q.limit)),
            currentPage: q.page,
        };
    }

    /** Light list for pickers (enrollment form). */
    learnerOptions(adminId: string, search?: string) {
        return prisma.student.findMany({
            where: {
                adminId,
                user: {
                    deletedAt: null,
                    ...(search
                        ? {
                              OR: [
                                  {fullname: {contains: search, mode: 'insensitive'}},
                                  {phoneNumber: {contains: search}},
                                  {email: {contains: search, mode: 'insensitive'}},
                              ],
                          }
                        : {}),
                },
            },
            orderBy: {user: {fullname: 'asc'}},
            take: 50,
            select: {id: true, user: {select: {fullname: true, phoneNumber: true, email: true}}},
        });
    }

    private async generateUsername() {
        for (let i = 0; i < 20; i++) {
            const username = `MCN${Math.floor(1000 + Math.random() * 9000)}`;
            if (!(await prisma.user.findUnique({where: {username}, select: {id: true}}))) return username;
        }
        return `MCN${Date.now().toString().slice(-7)}`;
    }

    async createLearner(adminId: string, data: z.infer<typeof v.learnerSchema>) {
        const emailTaken = await prisma.user.findFirst({where: {email: data.email}, select: {id: true}});
        if (emailTaken) throw new ApiError(httpStatus.CONFLICT, 'A user with this email already exists');
        const user = await userService.registerUser({
            username: await this.generateUsername(),
            email: data.email,
            fullname: data.fullname,
            password: data.password,
            phoneNumber: data.phoneNumber,
            role: Role.STUDENT,
        } as Parameters<typeof userService.registerUser>[0]);
        try {
            return await prisma.student.create({
                data: {
                    adminId,
                    userId: user.id,
                    city: data.city ?? '',
                    state: data.state ?? '',
                    country: 'India',
                    pincode: data.pincode ?? '',
                    address: data.address ?? '',
                    qualification: data.qualification,
                    collegeName: data.collegeName,
                },
                include: {user: {select: {username: true, fullname: true}}},
            });
        } catch (err) {
            await prisma.user.delete({where: {id: user.id}}).catch(() => undefined);
            throw err;
        }
    }

    async updateLearner(adminId: string, id: string, data: z.infer<typeof v.learnerUpdateSchema>) {
        const student = await prisma.student.findFirst({where: {id, adminId}});
        if (!student) throw notFound('Student');
        if (data.email) {
            const clash = await prisma.user.findFirst({
                where: {email: data.email, NOT: {id: student.userId}},
                select: {id: true},
            });
            if (clash) throw new ApiError(httpStatus.CONFLICT, 'A user with this email already exists');
        }
        const userData: Prisma.UserUpdateInput = {};
        if (data.fullname) userData.fullname = data.fullname;
        if (data.email) userData.email = data.email;
        if (data.phoneNumber) userData.phoneNumber = data.phoneNumber;
        if (data.isActive !== undefined) userData.isActive = data.isActive;
        if (data.password) userData.password = await encryptPassword(data.password);
        const studentData: Prisma.StudentUpdateInput = {};
        if (data.city !== undefined) studentData.city = data.city ?? '';
        if (data.state !== undefined) studentData.state = data.state ?? '';
        if (data.pincode !== undefined) studentData.pincode = data.pincode ?? '';
        if (data.address !== undefined) studentData.address = data.address ?? '';
        if (data.qualification !== undefined) studentData.qualification = data.qualification;
        if (data.collegeName !== undefined) studentData.collegeName = data.collegeName;
        await prisma.$transaction([
            prisma.user.update({where: {id: student.userId}, data: userData}),
            prisma.student.update({where: {id}, data: studentData}),
        ]);
        return {id};
    }

    async learnerEnrollments(adminId: string, id: string) {
        const student = await prisma.student.findFirst({where: {id, adminId}, select: {id: true}});
        if (!student) throw notFound('Student');
        return prisma.enrollment.findMany({
            where: {studentId: id},
            orderBy: {createdAt: 'desc'},
            include: {course: {select: {id: true, name: true}}, bundle: {select: {id: true, name: true}}},
        });
    }
}

export default new AcademyContentService();
