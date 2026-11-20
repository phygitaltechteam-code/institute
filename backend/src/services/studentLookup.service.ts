import prisma from '@client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';

/**
 * Institute-wide student lookup used by the admin/teacher universal search and the receipt search page.
 * Everything is scoped to the institute (adminId) of the logged-in user.
 */
class StudentLookupService {
    /** Light list for the search dropdown: name / phone / email / username / college. */
    async search(adminId: string, q: string, limit = 15) {
        const term = q.trim();
        const students = await prisma.student.findMany({
            where: {
                adminId,
                ...(term
                    ? {
                          OR: [
                              {user: {fullname: {contains: term, mode: 'insensitive'}}},
                              {user: {phoneNumber: {contains: term}}},
                              {user: {email: {contains: term, mode: 'insensitive'}}},
                              {user: {username: {contains: term, mode: 'insensitive'}}},
                              {collegeName: {contains: term, mode: 'insensitive'}},
                          ],
                      }
                    : {}),
            },
            take: Math.min(limit, 50),
            orderBy: {createdAt: 'desc'},
            select: {
                id: true,
                totalFees: true,
                paidFees: true,
                pendingFees: true,
                user: {select: {fullname: true, phoneNumber: true, email: true}},
                batchStudents: {
                    orderBy: {createdAt: 'desc'},
                    select: {batch: {select: {id: true, name: true, batchType: true}}},
                },
            },
        });

        return students.map((s) => ({
            id: s.id,
            name: s.user.fullname,
            phone: s.user.phoneNumber,
            email: s.user.email,
            totalFees: s.totalFees ?? 0,
            paidFees: s.paidFees ?? 0,
            pendingFees: s.pendingFees ?? 0,
            batches: s.batchStudents.map((b) => b.batch),
        }));
    }

    /** Full profile: personal, batches, fees + payment history, attendance, exams, interviews, placement. */
    async profile(adminId: string, studentId: string) {
        const s = await prisma.student.findFirst({
            where: {id: studentId, adminId},
            include: {
                user: {
                    select: {fullname: true, phoneNumber: true, email: true, username: true, createdAt: true},
                },
                batchStudents: {
                    orderBy: {createdAt: 'desc'},
                    include: {
                        batch: {
                            include: {
                                course: {select: {name: true}},
                                teacher: {select: {user: {select: {fullname: true}}}},
                                _count: {select: {attendances: true, dailyTasks: true, assignments: true}},
                            },
                        },
                    },
                },
                feesCollects: {
                    orderBy: {createdAt: 'asc'},
                    select: {
                        id: true,
                        amount: true,
                        pendingAmount: true,
                        createdAt: true,
                        account: {select: {name: true}},
                        teacher: {select: {user: {select: {fullname: true}}}},
                    },
                },
                feeFollowups: {orderBy: {createdAt: 'desc'}, take: 1},
                attendanceEntries: {select: {attendance: {select: {batchId: true}}}},
                examResults: {
                    orderBy: {createdAt: 'desc'},
                    select: {id: true, marks: true, percentage: true, createdAt: true, exam: {select: {name: true}}},
                },
                placementInterviews: {
                    orderBy: {interviewDate: 'desc'},
                    select: {
                        id: true,
                        interviewDate: true,
                        interviewMode: true,
                        location: true,
                        status: true,
                        placement: {select: {companyName: true, jobRole: true}},
                    },
                },
                _count: {select: {taskCompletions: true, assignmentCompletions: true, students: true}},
            },
        });
        if (!s) throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');

        const batches = s.batchStudents.map(({batch}) => {
            const present = s.attendanceEntries.filter((e) => e.attendance.batchId === batch.id).length;
            const classes = batch._count.attendances;
            return {
                id: batch.id,
                name: batch.name,
                batchType: batch.batchType,
                startDate: batch.startDate,
                endDate: batch.endDate,
                course: batch.course?.name,
                teacher: batch.teacher?.user?.fullname,
                attendance: {present, classes, percentage: classes ? Math.round((present / classes) * 100) : 0},
                dailyTasks: batch._count.dailyTasks,
                assignments: batch._count.assignments,
            };
        });

        return {
            id: s.id,
            name: s.user.fullname,
            phone: s.user.phoneNumber,
            email: s.user.email,
            username: s.user.username,
            joinedAt: s.user.createdAt,
            address: [s.address, s.city, s.state, s.pincode || s.pinCode].filter(Boolean).join(', '),
            collegeName: s.collegeName,
            qualification: s.qualification,
            placementReceived: s.placementReceived,
            internship: s.internship,
            certificate: s.certificate,
            referrals: s._count.students,
            batches,
            fees: {
                totalFees: s.totalFees ?? 0,
                discount: s.discount ?? 0,
                paidFees: s.paidFees ?? 0,
                pendingFees: s.pendingFees ?? 0,
                followUp: s.feeFollowups[0] ?? null,
                payments: s.feesCollects,
            },
            tasksCompleted: s._count.taskCompletions,
            assignmentsCompleted: s._count.assignmentCompletions,
            exams: s.examResults,
            interviews: s.placementInterviews,
        };
    }
}

export default new StudentLookupService();
