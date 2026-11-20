import prisma from '@client';
import {Coupon, Prisma} from '@prisma/client';
import httpStatus from 'http-status';
import {z} from 'zod';
import ApiError from '@utils/ApiError';
import * as v from '@validations/academy.validation';
import contentService from './content.service';

type EnrollmentInput = z.infer<typeof v.enrollmentSchema>;

const round2 = (n: number) => Math.round(n * 100) / 100;
const notFound = (what: string) => new ApiError(httpStatus.NOT_FOUND, `${what} not found`);

const enrollmentInclude = {
    student: {select: {id: true, user: {select: {fullname: true, phoneNumber: true, email: true}}}},
    course: {select: {id: true, name: true}},
    bundle: {select: {id: true, name: true}},
    coupon: {select: {id: true, code: true}},
    partner: {select: {id: true, name: true, code: true}},
} satisfies Prisma.EnrollmentInclude;

class AcademySalesService {
    // ── Coupons ───────────────────────────────────────────────
    async listCoupons(adminId: string) {
        return prisma.coupon.findMany({
            where: {adminId},
            orderBy: {createdAt: 'desc'},
            include: {
                course: {select: {id: true, name: true}},
                partner: {select: {id: true, name: true}},
            },
        });
    }

    private async assertRefs(adminId: string, courseId?: string | null, partnerId?: string | null) {
        if (courseId && !(await prisma.onlineCourse.findFirst({where: {id: courseId, adminId}}))) {
            throw notFound('Course');
        }
        if (partnerId && !(await prisma.partner.findFirst({where: {id: partnerId, adminId}}))) {
            throw notFound('Partner');
        }
    }

    async createCoupon(adminId: string, data: z.infer<typeof v.couponSchema>) {
        await this.assertRefs(adminId, data.courseId, data.partnerId);
        const exists = await prisma.coupon.findUnique({where: {adminId_code: {adminId, code: data.code}}});
        if (exists) throw new ApiError(httpStatus.CONFLICT, 'This coupon code already exists');
        return prisma.coupon.create({data: {...data, adminId}});
    }

    async updateCoupon(adminId: string, id: string, data: z.infer<typeof v.couponSchema>) {
        await this.findCoupon(adminId, id);
        await this.assertRefs(adminId, data.courseId, data.partnerId);
        const clash = await prisma.coupon.findFirst({where: {adminId, code: data.code, NOT: {id}}});
        if (clash) throw new ApiError(httpStatus.CONFLICT, 'This coupon code already exists');
        return prisma.coupon.update({where: {id}, data});
    }

    async deleteCoupon(adminId: string, id: string) {
        await this.findCoupon(adminId, id);
        await prisma.coupon.delete({where: {id}});
        return {id};
    }

    private async findCoupon(adminId: string, id: string) {
        const c = await prisma.coupon.findFirst({where: {id, adminId}});
        if (!c) throw notFound('Coupon');
        return c;
    }

    /** Throws a readable error if the coupon cannot be used; returns the discount amount. */
    private couponDiscount(coupon: Coupon, price: number, courseId: string | null, seats = 1) {
        const now = new Date();
        if (!coupon.isActive) throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon is inactive');
        if (coupon.validFrom && coupon.validFrom > now) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon is not active yet');
        }
        if (coupon.validTo && coupon.validTo < now) throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon has expired');
        if (coupon.maxUses !== null && coupon.usedCount + seats > coupon.maxUses) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon has reached its usage limit');
        }
        if (coupon.courseId && coupon.courseId !== courseId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'This coupon is not valid for the selected course');
        }
        if (coupon.minAmount !== null && price < coupon.minAmount) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Coupon needs a minimum amount of ₹${coupon.minAmount}`);
        }
        const raw = coupon.discountType === 'PERCENT' ? (price * coupon.value) / 100 : coupon.value;
        return round2(Math.min(raw, price));
    }

    async validateCoupon(adminId: string, data: z.infer<typeof v.couponValidateSchema>) {
        const item = await this.resolveItem(adminId, data.courseId, data.bundleId);
        const coupon = await prisma.coupon.findUnique({
            where: {adminId_code: {adminId, code: data.code.toUpperCase()}},
        });
        if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
        const discount = this.couponDiscount(coupon, item.price, item.courseId);
        return {code: coupon.code, listPrice: item.price, discount, payable: round2(item.price - discount)};
    }

    // ── Partners & payouts ────────────────────────────────────
    async listPartners(adminId: string) {
        const partners = await prisma.partner.findMany({
            where: {adminId},
            orderBy: {createdAt: 'desc'},
            include: {_count: {select: {enrollments: true, coupons: true}}},
        });
        const [sales, payouts] = await Promise.all([
            prisma.enrollment.groupBy({
                by: ['partnerId'],
                where: {adminId, partnerId: {not: null}, status: 'ACTIVE'},
                _sum: {amountPaid: true, partnerCommission: true},
            }),
            prisma.payout.groupBy({
                by: ['partnerId', 'status'],
                where: {adminId},
                _sum: {amount: true},
            }),
        ]);
        return partners.map((p) => {
            const s = sales.find((x) => x.partnerId === p.id);
            const paid = payouts.find((x) => x.partnerId === p.id && x.status === 'PAID')?._sum.amount ?? 0;
            const pending = payouts.find((x) => x.partnerId === p.id && x.status === 'PENDING')?._sum.amount ?? 0;
            const earned = round2(s?._sum.partnerCommission ?? 0);
            return {
                ...p,
                totalSales: round2(s?._sum.amountPaid ?? 0),
                earned,
                paid: round2(paid),
                pendingPayouts: round2(pending),
                balance: round2(earned - paid - pending),
            };
        });
    }

    async createPartner(adminId: string, data: z.infer<typeof v.partnerSchema>) {
        const exists = await prisma.partner.findUnique({where: {adminId_code: {adminId, code: data.code}}});
        if (exists) throw new ApiError(httpStatus.CONFLICT, 'This partner code already exists');
        return prisma.partner.create({data: {...data, adminId}});
    }

    async updatePartner(adminId: string, id: string, data: z.infer<typeof v.partnerSchema>) {
        await this.findPartner(adminId, id);
        const clash = await prisma.partner.findFirst({where: {adminId, code: data.code, NOT: {id}}});
        if (clash) throw new ApiError(httpStatus.CONFLICT, 'This partner code already exists');
        return prisma.partner.update({where: {id}, data});
    }

    async deletePartner(adminId: string, id: string) {
        await this.findPartner(adminId, id);
        const paid = await prisma.payout.count({where: {partnerId: id, status: 'PAID'}});
        if (paid > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'This partner has paid payouts on record. Mark the partner inactive instead.',
            );
        }
        await prisma.partner.delete({where: {id}});
        return {id};
    }

    private async findPartner(adminId: string, id: string) {
        const p = await prisma.partner.findFirst({where: {id, adminId}});
        if (!p) throw notFound('Partner');
        return p;
    }

    listPayouts(adminId: string, q: {partnerId?: string; status?: string}) {
        const where: Prisma.PayoutWhereInput = {adminId};
        if (q.partnerId) where.partnerId = q.partnerId;
        if (q.status && ['PENDING', 'PAID', 'CANCELLED'].includes(q.status)) {
            where.status = q.status as 'PENDING' | 'PAID' | 'CANCELLED';
        }
        return prisma.payout.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            include: {partner: {select: {id: true, name: true, code: true, upiId: true}}},
        });
    }

    async createPayout(adminId: string, data: z.infer<typeof v.payoutSchema>) {
        await this.findPartner(adminId, data.partnerId);
        return prisma.payout.create({
            data: {...data, adminId, paidAt: data.status === 'PAID' ? new Date() : null},
        });
    }

    async updatePayout(adminId: string, id: string, data: z.infer<typeof v.payoutUpdateSchema>) {
        const payout = await prisma.payout.findFirst({where: {id, adminId}});
        if (!payout) throw notFound('Payout');
        const paidAt =
            data.status === 'PAID' ? (payout.paidAt ?? new Date()) : data.status ? null : payout.paidAt;
        return prisma.payout.update({where: {id}, data: {...data, paidAt}});
    }

    async deletePayout(adminId: string, id: string) {
        const payout = await prisma.payout.findFirst({where: {id, adminId}});
        if (!payout) throw notFound('Payout');
        if (payout.status === 'PAID') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'A paid payout cannot be deleted. Cancel it instead.');
        }
        await prisma.payout.delete({where: {id}});
        return {id};
    }

    // ── Enrollments ───────────────────────────────────────────
    private async resolveItem(adminId: string, courseId?: string | null, bundleId?: string | null) {
        if (courseId) {
            const c = await prisma.onlineCourse.findFirst({where: {id: courseId, adminId}});
            if (!c) throw notFound('Course');
            return {
                courseId: c.id,
                bundleId: null,
                name: c.name,
                price: c.discountPrice ?? c.price,
                validityDays: c.validityDays,
            };
        }
        if (bundleId) {
            const b = await prisma.bundle.findFirst({where: {id: bundleId, adminId}});
            if (!b) throw notFound('Bundle');
            return {courseId: null, bundleId: b.id, name: b.name, price: b.discountPrice ?? b.price, validityDays: null};
        }
        throw new ApiError(httpStatus.BAD_REQUEST, 'Choose a course or a bundle');
    }

    private async nextInvoiceNumbers(tx: Prisma.TransactionClient, adminId: string, prefix: string, n: number) {
        const year = new Date().getFullYear();
        const base = `${prefix}-${year}-`;
        const last = await tx.enrollment.findFirst({
            where: {adminId, invoiceNo: {startsWith: base}},
            orderBy: {invoiceNo: 'desc'},
            select: {invoiceNo: true},
        });
        let seq = last ? Number(last.invoiceNo.slice(base.length)) || 0 : 0;
        return Array.from({length: n}, () => `${base}${String(++seq).padStart(5, '0')}`);
    }

    async createEnrollments(adminId: string, data: EnrollmentInput) {
        const item = await this.resolveItem(adminId, data.courseId, data.bundleId);
        const studentIds = [...new Set(data.studentIds)];
        const students = await prisma.student.findMany({
            where: {id: {in: studentIds}, adminId},
            select: {id: true, user: {select: {fullname: true}}},
        });
        if (students.length !== studentIds.length) throw notFound('Student');

        // Who already has active access to this exact item
        const existing = await prisma.enrollment.findMany({
            where: {
                studentId: {in: studentIds},
                status: 'ACTIVE',
                ...(item.courseId ? {courseId: item.courseId} : {bundleId: item.bundleId}),
            },
            select: {studentId: true},
        });
        const already = new Set(existing.map((e) => e.studentId));
        const toEnroll = students.filter((s) => !already.has(s.id));
        const skipped = students
            .filter((s) => already.has(s.id))
            .map((s) => ({studentId: s.id, name: s.user.fullname, reason: 'Already enrolled'}));
        if (toEnroll.length === 0) return {created: [], skipped};

        let coupon: Coupon | null = null;
        let discount = 0;
        if (data.couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: {adminId_code: {adminId, code: data.couponCode.toUpperCase()}},
            });
            if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
            discount = this.couponDiscount(coupon, item.price, item.courseId, toEnroll.length);
        }

        const payable = round2(item.price - discount);
        const amountPaid = data.paymentMode === 'FREE' ? 0 : round2(data.amountPaid ?? payable);
        if (amountPaid < 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Amount cannot be negative');

        const partnerId = data.partnerId ?? coupon?.partnerId ?? null;
        const partner = partnerId ? await this.findPartner(adminId, partnerId) : null;
        const commission = partner ? round2((amountPaid * partner.commissionPercent) / 100) : 0;

        const business = await contentService.getBusinessSettings(adminId);
        const gst = Number(business.gstPercent) || 0;
        // Amounts are GST-inclusive: tax = total × gst / (100 + gst)
        const taxAmount = gst > 0 ? round2((amountPaid * gst) / (100 + gst)) : 0;

        const expiresAt =
            data.expiresAt ??
            (item.validityDays ? new Date(Date.now() + item.validityDays * 24 * 60 * 60 * 1000) : null);

        const created = await prisma.$transaction(async (tx) => {
            const numbers = await this.nextInvoiceNumbers(
                tx,
                adminId,
                (business.invoicePrefix || 'INV').toUpperCase(),
                toEnroll.length,
            );
            const rows = [];
            for (const [i, s] of toEnroll.entries()) {
                rows.push(
                    await tx.enrollment.create({
                        data: {
                            adminId,
                            studentId: s.id,
                            courseId: item.courseId,
                            bundleId: item.bundleId,
                            invoiceNo: numbers[i],
                            listPrice: item.price,
                            discount,
                            amountPaid,
                            taxAmount,
                            paymentMode: data.paymentMode,
                            paymentRef: data.paymentRef,
                            couponId: coupon?.id ?? null,
                            partnerId: partner?.id ?? null,
                            partnerCommission: commission,
                            expiresAt,
                            note: data.note,
                        },
                        include: enrollmentInclude,
                    }),
                );
            }
            if (coupon) {
                await tx.coupon.update({
                    where: {id: coupon.id},
                    data: {usedCount: {increment: toEnroll.length}},
                });
            }
            return rows;
        });
        return {created, skipped};
    }

    async listEnrollments(
        adminId: string,
        q: {
            page: number;
            limit: number;
            search?: string;
            courseId?: string;
            bundleId?: string;
            status?: string;
            paymentMode?: string;
            from?: string;
            to?: string;
            paidOnly?: boolean;
        },
    ) {
        const where: Prisma.EnrollmentWhereInput = {adminId};
        if (q.courseId) where.courseId = q.courseId;
        if (q.bundleId) where.bundleId = q.bundleId;
        if (q.status === 'ACTIVE' || q.status === 'REVOKED') where.status = q.status;
        if (q.paymentMode) where.paymentMode = q.paymentMode as Prisma.EnumPaymentModeFilter['equals'];
        if (q.paidOnly) where.amountPaid = {gt: 0};
        if (q.from || q.to) {
            where.createdAt = {};
            if (q.from) where.createdAt.gte = new Date(q.from);
            if (q.to) {
                const to = new Date(q.to);
                to.setHours(23, 59, 59, 999);
                where.createdAt.lte = to;
            }
        }
        if (q.search) {
            where.OR = [
                {invoiceNo: {contains: q.search, mode: 'insensitive'}},
                {student: {user: {fullname: {contains: q.search, mode: 'insensitive'}}}},
                {student: {user: {phoneNumber: {contains: q.search}}}},
            ];
        }
        const [items, totalItems, sums] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                orderBy: {createdAt: 'desc'},
                skip: (q.page - 1) * q.limit,
                take: q.limit,
                include: enrollmentInclude,
            }),
            prisma.enrollment.count({where}),
            prisma.enrollment.aggregate({where, _sum: {amountPaid: true, taxAmount: true, discount: true}}),
        ]);
        return {
            items,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / q.limit)),
            currentPage: q.page,
            totals: {
                amountPaid: round2(sums._sum.amountPaid ?? 0),
                taxAmount: round2(sums._sum.taxAmount ?? 0),
                discount: round2(sums._sum.discount ?? 0),
            },
        };
    }

    async getInvoice(adminId: string, id: string) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {id, adminId},
            include: {
                ...enrollmentInclude,
                student: {
                    select: {
                        id: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                        user: {select: {fullname: true, phoneNumber: true, email: true}},
                    },
                },
            },
        });
        if (!enrollment) throw notFound('Invoice');
        const business = await contentService.getBusinessSettings(adminId);
        return {enrollment, business};
    }

    async setEnrollmentStatus(adminId: string, id: string, status: 'ACTIVE' | 'REVOKED') {
        const e = await prisma.enrollment.findFirst({where: {id, adminId}});
        if (!e) throw notFound('Enrollment');
        return prisma.enrollment.update({where: {id}, data: {status}, include: enrollmentInclude});
    }

    async deleteEnrollment(adminId: string, id: string) {
        const e = await prisma.enrollment.findFirst({where: {id, adminId}});
        if (!e) throw notFound('Enrollment');
        await prisma.$transaction(async (tx) => {
            await tx.enrollment.delete({where: {id}});
            if (e.couponId) {
                await tx.coupon.updateMany({
                    where: {id: e.couponId, usedCount: {gt: 0}},
                    data: {usedCount: {decrement: 1}},
                });
            }
        });
        return {id};
    }

    // ── Reports ───────────────────────────────────────────────
    async report(adminId: string, q: {from?: string; to?: string}) {
        const now = new Date();
        const from = q.from ? new Date(q.from) : new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const to = q.to ? new Date(q.to) : now;
        to.setHours(23, 59, 59, 999);
        const where: Prisma.EnrollmentWhereInput = {adminId, status: 'ACTIVE', createdAt: {gte: from, lte: to}};

        const [totals, students, byMode, byCourse, byBundle, rows, totalCourses, totalStudents] =
            await Promise.all([
                prisma.enrollment.aggregate({
                    where,
                    _sum: {amountPaid: true, taxAmount: true, discount: true, partnerCommission: true},
                    _count: {_all: true},
                }),
                prisma.enrollment.groupBy({by: ['studentId'], where}),
                prisma.enrollment.groupBy({
                    by: ['paymentMode'],
                    where,
                    _sum: {amountPaid: true},
                    _count: {_all: true},
                }),
                prisma.enrollment.groupBy({
                    by: ['courseId'],
                    where: {...where, courseId: {not: null}},
                    _sum: {amountPaid: true},
                    _count: {_all: true},
                }),
                prisma.enrollment.groupBy({
                    by: ['bundleId'],
                    where: {...where, bundleId: {not: null}},
                    _sum: {amountPaid: true},
                    _count: {_all: true},
                }),
                prisma.enrollment.findMany({where, select: {createdAt: true, amountPaid: true}}),
                prisma.onlineCourse.count({where: {adminId}}),
                prisma.student.count({where: {adminId}}),
            ]);

        const [courses, bundles] = await Promise.all([
            prisma.onlineCourse.findMany({
                where: {id: {in: byCourse.map((c) => c.courseId!)}},
                select: {id: true, name: true},
            }),
            prisma.bundle.findMany({
                where: {id: {in: byBundle.map((b) => b.bundleId!)}},
                select: {id: true, name: true},
            }),
        ]);

        // Month buckets from `from` to `to`
        const monthly: {month: string; revenue: number; enrollments: number}[] = [];
        const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
        while (cursor <= to && monthly.length < 36) {
            monthly.push({
                month: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
                revenue: 0,
                enrollments: 0,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        rows.forEach((r) => {
            const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
            const m = monthly.find((x) => x.month === key);
            if (m) {
                m.revenue = round2(m.revenue + r.amountPaid);
                m.enrollments += 1;
            }
        });

        const items = [
            ...byCourse.map((c) => ({
                type: 'Course',
                id: c.courseId!,
                name: courses.find((x) => x.id === c.courseId)?.name ?? 'Deleted course',
                enrollments: c._count._all,
                revenue: round2(c._sum.amountPaid ?? 0),
            })),
            ...byBundle.map((b) => ({
                type: 'Bundle',
                id: b.bundleId!,
                name: bundles.find((x) => x.id === b.bundleId)?.name ?? 'Deleted bundle',
                enrollments: b._count._all,
                revenue: round2(b._sum.amountPaid ?? 0),
            })),
        ].sort((a, b) => b.revenue - a.revenue || b.enrollments - a.enrollments);

        return {
            range: {from, to},
            totals: {
                revenue: round2(totals._sum.amountPaid ?? 0),
                tax: round2(totals._sum.taxAmount ?? 0),
                discount: round2(totals._sum.discount ?? 0),
                commission: round2(totals._sum.partnerCommission ?? 0),
                enrollments: totals._count._all,
                buyers: students.length,
                totalCourses,
                totalStudents,
            },
            monthly,
            byPaymentMode: byMode.map((m) => ({
                mode: m.paymentMode,
                count: m._count._all,
                revenue: round2(m._sum.amountPaid ?? 0),
            })),
            items,
        };
    }
}

export default new AcademySalesService();
