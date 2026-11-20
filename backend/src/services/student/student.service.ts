/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {$Enums} from '@prisma/client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';
import {placementValidation, leadValidation} from '@validations/index';
import {z} from 'zod';
import e from 'express';

type CreateLeadData = z.infer<typeof leadValidation.createLeadSchema>;
type placement = z.infer<typeof placementValidation.savePlacementFormSchema>;
class StudentService {
    async getDailyTasks(studentId: string) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {user: true, batchStudents: true},
        });
        if (!student) throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');

        const enrollment = await prisma.batchStudents.findFirst({
            where: {
                studentId,
                batchId: {
                    in: student.batchStudents.map((bs) => bs.batchId),
                },
            },
        });

        if (!enrollment) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Student is not enrolled in this batch');
        }

        const dailyTasks = await prisma.dailyTasks.findMany({
            where: {
                batchId: {
                    in: student.batchStudents.map((bs) => bs.batchId),
                },
            },
            include: {
                taskCompletions: {
                    where: {
                        studentId,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        return dailyTasks;
    }

    async completeDailyTask(studentId: string, taskId: string, documentUrl?: string) {
        const task = await prisma.dailyTasks.findUnique({
            where: {id: taskId},
        });

        if (!task) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Daily task not found');
        }

        const existingCompletion = await prisma.taskCompletion.findFirst({
            where: {
                taskId,
                studentId,
            },
        });

        if (existingCompletion) {
            return prisma.taskCompletion.update({
                where: {id: existingCompletion.id},
                data: {
                    completed: true,
                    documentUrl: documentUrl,
                    // remark:remark,
                },
            });
        } else {
            return prisma.taskCompletion.create({
                data: {
                    taskId,
                    studentId,
                    completed: true,
                    documentUrl: documentUrl,
                },
            });
        }
    }
    async getPlacementTasks(studentId: string) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {user: true, batchStudents: true},
        });
        if (!student) throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');

        const placementTasks = await prisma.placement.findMany({
            where: {
                deadLine: {
                    gte: new Date(),
                },
            },
            // where: {
            //     studentId,
            // },
            // include: {
            //     placement: true,
            // },
            orderBy: {
                deadLine: 'asc',
            },
        });
        // console.log(placementTasks);

        return placementTasks;
    }
    async applyPlacement(studentId: string, placementId: string) {
        return await prisma.placementStudent.create({
            data: {
                placementId,
                studentId,
                isApplied: true,
                isInterview: false,
            },
        });
    }
    async createuserNameUniwque(): Promise<string> {
        let username = '';
        let isUnique = false;

        while (!isUnique) {
            const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a number between 1000 and 9999
            username = `MCN${randomNumber}`;

            const existingUser = await prisma.user.findUnique({
                where: {username},
            });

            if (!existingUser) {
                isUnique = true;
            }
        }

        return username;
    }
    async getInterview(studentId: string) {
        return await prisma.placementInterview.findMany({
            where: {
                studentId,
            },
            include: {
                placement: true,
            },
        });
    }
    async updateInterviewStatus(
        interviewId: string,
        studentId: string,
        status: $Enums.InterviewStatus,
    ) {
        const interview = await prisma.placementInterview.findFirst({
            where: {
                id: interviewId,
                studentId,
            },
        });

        if (!interview) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Interview not found or unauthorized');
        }
        if (status === 'PLACED') {
            await prisma.student.update({
                where: {
                    id: studentId,
                },
                data: {
                    placementReceived: 'true',
                },
            });
        }
        return await prisma.placementInterview.update({
            where: {
                id: interviewId,
            },
            data: {
                status,
            },
        });
    }
    async getStats(studentId: string) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {
                batchStudents: true,
            },
        });

        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        const batchIds = student.batchStudents.map((bs) => bs.batchId);

        // 1. Attendance Calculations
        const totalBatchAttendanceCount = await prisma.attendance.count({
            where: {
                batchId: {in: batchIds},
            },
        });

        const studentPresentCount = await prisma.attendanceEntry.count({
            where: {
                studentId,
                attendance: {
                    batchId: {in: batchIds},
                },
            },
        });

        const overallAttendancePercentage =
            totalBatchAttendanceCount > 0
                ? Number(((studentPresentCount / totalBatchAttendanceCount) * 100).toFixed(2))
                : 0;

        // 2. Exam Calculations
        const examResults = await prisma.examResults.findMany({
            where: {studentId},
            select: {
                percentage: true,
                marks: true,
                exam: {
                    select: {
                        marks: true,
                    },
                },
                student: {
                    select: {
                        id: true,
                        paidFees: true,
                        pendingFees: true,
                        totalFees: true,
                        totalPaidFees: true,
                        totalPendingFees: true,
                    },
                },
            },
        });

        const totalExamsAttended = examResults.length;

        // Total available exams for the student's batches
        const totalExamsInBatches = await prisma.examBatches.count({
            where: {
                batchId: {in: batchIds},
            },
        });

        let averageExamScorePercentage = 0;
        if (totalExamsAttended > 0) {
            const sumPercentage = examResults.reduce((acc, result) => {
                if (result.percentage !== null && result.percentage !== undefined) {
                    return acc + result.percentage;
                }
                if (result.exam && result.exam.marks > 0) {
                    return acc + (result.marks / result.exam.marks) * 100;
                }
                return acc;
            }, 0);
            averageExamScorePercentage = Number((sumPercentage / totalExamsAttended).toFixed(2));
        }

        // 3. Interview and Placement Calculations
        const totalInterviews = await prisma.placementInterview.count({
            where: {studentId},
        });

        const totalPlacementApplied = await prisma.placementStudent.count({
            where: {studentId, isApplied: true},
        });

        const totalPlacements = await prisma.placementStudent.count({
            where: {
                studentId,
                placement: {
                    placementInterviews: {
                        some: {studentId},
                    },
                },
            },
        });

        const totalMarketPlacements = await prisma.placement.count();

        return {
            attendance: {
                overallAttendancePercentage,
                totalBatchAttendance: totalBatchAttendanceCount,
                studentPresentDays: studentPresentCount,
            },
            exam: {
                averageExamScorePercentage,
                totalExamsAttended,
                totalExamsInBatches,
            },
            placement: {
                totalInterviews,
                totalPlacementApplied,
                totalPlacements,
                totalMarketPlacements,
            },
            student: {
                paidFees: student.paidFees,
                pendingFees: student.pendingFees,
                totalFees: student.totalFees,
                totalPaidFees: student.totalPaidFees,
                totalPendingFees: student.totalPendingFees,
            },
        };
    }

    async upsertPlacementForm(studentId: string, data: placement) {
        console.log(data);
        const {additional_education, ...placementData} = data;

        const placement = await prisma.placementForm.upsert({
            where: {studentId},
            create: {
                ...placementData,
                studentId,
                degrees:
                    additional_education && additional_education.length > 0
                        ? {
                              create: additional_education.map((d: any) => ({
                                  score: d.score,
                                  course: d.course,
                                  passingyear: d.passingyear,
                                  graduation_type: d.graduation_type,
                              })),
                          }
                        : undefined,
            },
            update: {
                ...placementData,
                degrees: additional_education
                    ? {
                          deleteMany: {},
                          create: additional_education.map((d: any) => ({
                              score: d.score,
                              course: d.course,
                              passingyear: d.passingyear,
                              graduation_type: d.graduation_type,
                          })),
                      }
                    : undefined,
            },
            include: {
                degrees: true,
            },
        });
        await prisma.student.update({
            where: {
                id: studentId,
            },
            data: {
                placementForm: 'true',
            },
        });
        return placement;
    }

    async getPlacementForm(studentId: string) {
        return await prisma.placementForm.findUnique({
            where: {studentId},
            include: {
                degrees: true,
            },
        });
    }

    async getStudentById(studentId: string) {
        return await prisma.student.findUnique({
            where: {id: studentId},
            include: {
                user: true,
            },
        });
    }
    async createLead(id: string, data: CreateLeadData) {
        // if (data.referId) {
        //     data.source = 'refer';
        // } else {
        //     data.source = 'website';
        // }
        return prisma.lead.create({
            data: {
                ...data,
                referId: id,
            },
            include: {
                course: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
                batch: true,
            },
        });
    }
    async getreferedLead(id: string) {
        return await prisma.lead.findMany({
            where: {
                referId: id,
            },
            include: {
                course: true,

                batch: true,
            },
        });
    }
}

export default new StudentService();
