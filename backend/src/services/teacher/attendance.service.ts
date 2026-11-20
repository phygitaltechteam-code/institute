import prisma from '@client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';

class AttendanceService {
    async recordAttendance(
        teacherId: string,
        batchId: string,
        studentIds: string[],
        dateInput?: Date,
        totalStudent?: number,
        presentStudents?: number,
        absentStudents?: number,
    ) {
        const batch = await prisma.batch.findFirst({
            where: {id: batchId, teacherId},
        });
        if (!batch) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized for this batch');
        }

        const date = dateInput ? new Date(dateInput) : new Date();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return prisma.$transaction(async (tx) => {
            // Find existing attendance sheet for this batch on this calendar day
            const existingAttendance = await tx.attendance.findFirst({
                where: {
                    batchId,
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });

            if (existingAttendance) {
                // Keep the day's summary counts in sync with the re-submitted sheet
                await tx.attendance.update({
                    where: {id: existingAttendance.id},
                    data: {
                        totalStudent: totalStudent ?? existingAttendance.totalStudent,
                        presentStudent: presentStudents ?? studentIds.length,
                        absentStudent: absentStudents ?? existingAttendance.absentStudent,
                    },
                });

                // Delete existing entries
                await tx.attendanceEntry.deleteMany({
                    where: {attendanceId: existingAttendance.id},
                });

                // Create new entries
                if (studentIds.length > 0) {
                    await tx.attendanceEntry.createMany({
                        data: studentIds.map((studentId) => ({
                            studentId,
                            attendanceId: existingAttendance.id,
                        })),
                    });
                }

                return tx.attendance.findUnique({
                    where: {id: existingAttendance.id},
                    include: {
                        attendanceEntries: {
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                fullname: true,
                                                username: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            }

            // Create new attendance sheet
            const attendance = await tx.attendance.create({
                data: {
                    batchId,
                    teacherId,
                    totalStudent: totalStudent,
                    absentStudent: absentStudents,
                    presentStudent: presentStudents,
                    createdAt: date,
                    attendanceEntries: {
                        create: studentIds.map((studentId) => ({
                            studentId,
                        })),
                    },
                },
                include: {
                    attendanceEntries: {
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: {
                                            fullname: true,
                                            username: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            return attendance;
        });
    }

    async getAttendance(adminId: string, batchId: string, from: Date, to: Date) {
        const batchDetails = await prisma.batch.findFirst({
            where: {id: batchId, adminId},
            include: {
                batchStudents: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        fullname: true,
                                        username: true,
                                        phoneNumber: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!batchDetails) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }

        const startOfFrom = new Date(from);
        startOfFrom.setHours(0, 0, 0, 0);
        const endOfTo = new Date(to);
        endOfTo.setHours(23, 59, 59, 999);

        const attendances = await prisma.attendance.findMany({
            where: {
                batchId,
                createdAt: {
                    gte: startOfFrom,
                    lte: endOfTo,
                },
            },
            include: {
                attendanceEntries: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const students = batchDetails.batchStudents.map((bs) => {
            const student = bs.student;
            const studentAttendance = attendances.map((att) => {
                const isPresent = att.attendanceEntries.some(
                    (entry) => entry.studentId === student.id,
                );
                return {
                    attendanceId: att.id,
                    date: att.createdAt,
                    status: isPresent ? 'present' : 'absent',
                };
            });

            return {
                id: student.id,
                fullname: student.user.fullname,
                username: student.user.username,
                phoneNumber: student.user.phoneNumber,
                attendance: studentAttendance,
            };
        });

        return {
            dates: attendances.map((att) => ({
                id: att.id,
                date: att.createdAt,
                totalStudent: att.totalStudent,
                presentStudent: att.presentStudent,
                absentStudent: att.absentStudent,
            })),
            students,
        };
    }
}

export default new AttendanceService();
