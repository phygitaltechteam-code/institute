import prisma from '@client';
import paymentGatewayService from '../paymentGateway.service';

export type StudentNotification = {
    id: string; // stable id, used by the app to remember what was read
    type: 'CLASS' | 'INTERVIEW' | 'TASK' | 'ASSIGNMENT' | 'EXAM' | 'FEE' | 'PAYMENT';
    url?: string; // external link (online payment)
    title: string;
    message: string;
    date: string; // ISO time the item refers to (class / interview / due date / posted date)
    tab?: number; // student dashboard tab to open
};

const DAY = 24 * 60 * 60 * 1000;
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const fmtDay = (d: Date) => d.toLocaleDateString('en-IN', {weekday: 'short', day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata'});
const fmtDateTime = (d: Date) =>
    d.toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'});
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Builds the student's notification feed from existing data (schedule, interviews, tasks, exams, fees). */
class StudentNotificationService {
    async list(studentId: string): Promise<StudentNotification[]> {
        const now = new Date();
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            select: {
                pendingFees: true,
                feeFollowups: {orderBy: {createdAt: 'desc'}, take: 1},
                batchStudents: {
                    select: {
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                startDate: true,
                                endDate: true,
                                startTime: true,
                                endTime: true,
                                batchType: true,
                                teachingDays: true,
                            },
                        },
                    },
                },
            },
        });
        if (!student) return [];

        const batches = student.batchStudents.map((b) => b.batch);
        const batchIds = batches.map((b) => b.id);
        const items: StudentNotification[] = [];

        // 1. Class schedule: today's / next class for every running batch
        for (const b of batches) {
            if (b.endDate < new Date(now.getTime() - DAY)) continue; // batch finished
            const days = b.teachingDays;
            if (!days) continue;
            for (let i = 0; i < 7; i++) {
                const d = new Date(Math.max(now.getTime(), b.startDate.getTime()) + i * DAY);
                if (d > b.endDate) break;
                if (!days[dayKeys[d.getDay()]]) continue;
                const isToday = d.toDateString() === now.toDateString();
                items.push({
                    id: `class-${b.id}-${d.toISOString().slice(0, 10)}`,
                    type: 'CLASS',
                    title: isToday ? 'Class today' : 'Upcoming class',
                    message: `${b.name} · ${isToday ? 'Today' : fmtDay(d)}, ${b.startTime}${b.endTime ? ` – ${b.endTime}` : ''} (${b.batchType === 'ONLINE' ? 'Online' : 'Offline'})`,
                    date: d.toISOString(),
                    tab: 0,
                });
                break;
            }
        }

        const [interviews, tasks, assignments, exams] = await Promise.all([
            // 2. Interviews scheduled from yesterday onwards
            prisma.placementInterview.findMany({
                where: {studentId, interviewDate: {gte: new Date(now.getTime() - DAY)}},
                orderBy: {interviewDate: 'asc'},
                select: {
                    id: true,
                    interviewDate: true,
                    interviewMode: true,
                    location: true,
                    status: true,
                    placement: {select: {companyName: true, jobRole: true}},
                },
            }),
            // 3. Daily tasks posted in the last 7 days
            prisma.dailyTasks.findMany({
                where: {batchId: {in: batchIds}, createdAt: {gte: new Date(now.getTime() - 7 * DAY)}},
                orderBy: {createdAt: 'desc'},
                take: 10,
                select: {id: true, topic: true, createdAt: true, date: true, batch: {select: {name: true}}},
            }),
            // 4. Assignments still open and not submitted
            prisma.assignment.findMany({
                where: {
                    batchId: {in: batchIds},
                    deadline: {gte: now},
                    assignmentCompletions: {none: {studentId}},
                },
                orderBy: {deadline: 'asc'},
                take: 10,
                select: {id: true, name: true, deadline: true},
            }),
            // 5. Exams assigned in the last 30 days and not attempted
            prisma.examBatches.findMany({
                where: {
                    batchId: {in: batchIds},
                    createdAt: {gte: new Date(now.getTime() - 30 * DAY)},
                    exam: {examResults: {none: {studentId}}},
                },
                orderBy: {createdAt: 'desc'},
                take: 10,
                select: {id: true, createdAt: true, exam: {select: {id: true, name: true, marks: true}}},
            }),
        ]);

        for (const iv of interviews) {
            if (iv.status !== 'SCHEDULED') continue;
            items.push({
                id: `interview-${iv.id}-${iv.interviewDate.toISOString()}`,
                type: 'INTERVIEW',
                title: `Interview: ${iv.placement.companyName}`,
                message: `${iv.placement.jobRole} · ${fmtDateTime(iv.interviewDate)} · ${iv.interviewMode}${iv.location ? ` · ${iv.location}` : ''}`,
                date: iv.interviewDate.toISOString(),
                tab: 3,
            });
        }
        for (const t of tasks) {
            items.push({
                id: `task-${t.id}`,
                type: 'TASK',
                title: 'New daily task',
                message: `${t.topic} · ${t.batch.name}`,
                date: t.createdAt.toISOString(),
                tab: 0,
            });
        }
        for (const a of assignments) {
            const dueSoon = a.deadline.getTime() - now.getTime() < 2 * DAY;
            items.push({
                id: `assignment-${a.id}`,
                type: 'ASSIGNMENT',
                title: dueSoon ? 'Assignment due soon' : 'Assignment pending',
                message: `${a.name} · due ${fmtDateTime(a.deadline)}`,
                date: a.deadline.toISOString(),
                tab: 2,
            });
        }
        for (const e of exams) {
            items.push({
                id: `exam-${e.id}`,
                type: 'EXAM',
                title: 'New exam available',
                message: `${e.exam.name} · ${e.exam.marks} marks`,
                date: e.createdAt.toISOString(),
                tab: 1,
            });
        }

        // 6. Fee instalment reminder
        const fu = student.feeFollowups[0];
        if ((student.pendingFees ?? 0) > 0 && fu?.followUpDate) {
            items.push({
                id: `fee-${fu.id}`,
                type: 'FEE',
                title: fu.followUpDate < now ? 'Fee instalment overdue' : 'Fee instalment due',
                message: `${inr(fu.amount || student.pendingFees || 0)} due on ${fmtDay(fu.followUpDate)} · balance ${inr(student.pendingFees ?? 0)}`,
                date: fu.followUpDate.toISOString(),
            });
        }

        // 7. Online payment links shared by the institute (always pinned on top)
        const links = (student.pendingFees ?? 0) > 0 ? await paymentGatewayService.openLinksForStudent(studentId) : [];
        const pinned: StudentNotification[] = links.map((l) => ({
            id: `pay-${l.id}`,
            type: 'PAYMENT',
            title: 'Pay your fees online',
            message: `${inr(l.amount)} · tap to pay securely (UPI / card / net banking)`,
            date: l.createdAt.toISOString(),
            url: l.shortUrl,
        }));

        // Upcoming items first (soonest on top), then recent past items (newest on top)
        const t = now.getTime() - 12 * 60 * 60 * 1000;
        return pinned.concat(items.sort((a, b) => {
            const da = new Date(a.date).getTime();
            const db = new Date(b.date).getTime();
            const fa = da >= t;
            const fb = db >= t;
            if (fa !== fb) return fa ? -1 : 1;
            return fa ? da - db : db - da;
        }));
    }
}

export default new StudentNotificationService();
