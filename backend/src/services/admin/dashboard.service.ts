import prisma from '@client';
import {LeadStatus} from '@prisma/client';

const MONTHS = 12;

/** Key like "2026-11" for grouping by calendar month (server local time). */
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

class DashboardService {
    /** Everything the admin home dashboard needs, scoped to one institute (adminId). */
    async getDashboard(adminId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const rangeStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const studentScope = {adminId, user: {deletedAt: null}};
        // Leads have no adminId; they belong to an institute through their course
        const leadScope = {course: {adminId}};

        const [
            totalStudents,
            totalTeachers,
            activeBatches,
            totalBatches,
            totalCourses,
            feeTotals,
            collectedAll,
            collectedThisMonth,
            leadsByStatus,
            newLeadsThisMonth,
            leadFollowUpsDue,
            feeFollowUpsDue,
            admissions,
            collections,
            recentCollections,
        ] = await Promise.all([
            prisma.student.count({where: studentScope}),
            prisma.teacher.count({where: {adminId, user: {deletedAt: null}}}),
            prisma.batch.count({where: {adminId, endDate: {gte: now}}}),
            prisma.batch.count({where: {adminId}}),
            prisma.course.count({where: {adminId}}),
            prisma.student.aggregate({
                where: studentScope,
                _sum: {totalFees: true, pendingFees: true},
            }),
            prisma.feesCollect.aggregate({where: {student: {adminId}}, _sum: {amount: true}}),
            prisma.feesCollect.aggregate({
                where: {student: {adminId}, createdAt: {gte: startOfMonth}},
                _sum: {amount: true},
            }),
            prisma.lead.groupBy({by: ['status'], where: leadScope, _count: {_all: true}}),
            prisma.lead.count({where: {...leadScope, createdAt: {gte: startOfMonth}}}),
            prisma.leadFollowUp.count({
                where: {lead: leadScope, nextFollowUpDate: {gte: startOfToday, lte: in7Days}},
            }),
            prisma.feeFollowup.count({
                where: {student: {adminId}, followUpDate: {gte: startOfToday, lte: in7Days}},
            }),
            prisma.student.findMany({
                where: {...studentScope, createdAt: {gte: rangeStart}},
                select: {createdAt: true},
            }),
            prisma.feesCollect.findMany({
                where: {student: {adminId}, createdAt: {gte: rangeStart}},
                select: {createdAt: true, amount: true},
            }),
            prisma.feesCollect.findMany({
                where: {student: {adminId}},
                orderBy: {createdAt: 'desc'},
                take: 6,
                select: {
                    id: true,
                    amount: true,
                    createdAt: true,
                    account: {select: {name: true}},
                    student: {select: {user: {select: {fullname: true}}}},
                },
            }),
        ]);

        // Last 12 calendar months, oldest first, with zero-filled gaps
        const months = Array.from({length: MONTHS}, (_, i) => {
            const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
            return {key: monthKey(d), label: d.toLocaleString('en-IN', {month: 'short', year: '2-digit'})};
        });
        const admissionsByMonth: Record<string, number> = {};
        admissions.forEach((s) => {
            const k = monthKey(s.createdAt);
            admissionsByMonth[k] = (admissionsByMonth[k] || 0) + 1;
        });
        const collectionsByMonth: Record<string, number> = {};
        collections.forEach((c) => {
            const k = monthKey(c.createdAt);
            collectionsByMonth[k] = (collectionsByMonth[k] || 0) + c.amount;
        });

        const statusCounts = Object.values(LeadStatus).map((status) => ({
            status,
            count: leadsByStatus.find((l) => l.status === status)?._count._all ?? 0,
        }));

        return {
            totals: {
                students: totalStudents,
                teachers: totalTeachers,
                courses: totalCourses,
                batches: totalBatches,
                activeBatches,
                leads: statusCounts.reduce((sum, s) => sum + s.count, 0),
                newLeadsThisMonth,
            },
            fees: {
                totalFees: feeTotals._sum.totalFees ?? 0,
                collected: collectedAll._sum.amount ?? 0,
                collectedThisMonth: collectedThisMonth._sum.amount ?? 0,
                pending: feeTotals._sum.pendingFees ?? 0,
            },
            followUpsDueThisWeek: {leads: leadFollowUpsDue, fees: feeFollowUpsDue},
            leadsByStatus: statusCounts,
            monthly: months.map((m) => ({
                month: m.label,
                admissions: admissionsByMonth[m.key] || 0,
                feeCollected: Math.round(collectionsByMonth[m.key] || 0),
            })),
            recentCollections: recentCollections.map((c) => ({
                id: c.id,
                amount: c.amount,
                createdAt: c.createdAt,
                account: c.account?.name ?? null,
                studentName: c.student?.user?.fullname ?? 'Unknown',
            })),
        };
    }
}

export default new DashboardService();
