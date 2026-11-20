import prisma from '@client';
import {ApiError} from '@utils/index';
import {batchValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type CreateBatchData = z.infer<typeof batchValidation.createBatchSchema>;
type UpdateBatchData = z.infer<typeof batchValidation.updateBatchSchema>;
type PaginateBatches = z.infer<typeof batchValidation.paginateBatchesSchema>;

class BatchService {
    async createBatch(adminId: string, data: CreateBatchData) {
        const {teachingDays, feeOptions, ...batchData} = data;

        return prisma.$transaction(async (tx) => {
            const batch = await tx.batch.create({
                data: {
                    ...batchData,
                    adminId,
                    teachingDays: {
                        create: teachingDays,
                    },
                    feeOptions: {
                        create: feeOptions.map((opt) => ({
                            name: opt.name,
                            feeInstallments: {
                                create: opt.feeInstallments,
                            },
                        })),
                    },
                },
                include: {
                    teachingDays: true,
                    feeOptions: {
                        include: {
                            feeInstallments: true,
                        },
                    },
                },
            });
            return batch;
        });
    }
    async getStudents(batchId: string, adminId: string) {
        const batch = await prisma.batch.findFirst({
            where: {id: batchId, adminId},
            include: {
                attendances: true,
                dailyTasks: true,
                assignments: true,
                examBatches: true,
                batchStudents: {
                    select: {
                        student: {
                            select: {
                                id: true,
                                batchStudents: {
                                    include: {
                                        batch: true,
                                    },
                                },
                                attendanceEntries: true,
                                leads: true,
                                examResults: true,
                                taskCompletions: true,
                                assignmentCompletions: true,
                                totalExams: true,
                                finalExam: true,
                                placementForm: true,
                                internship: true,
                                paidFees: true,
                                pendingFees: true,
                                followUpDate: true,
                                totalFees: true,
                                discount: true,
                                interviewsGiven: true,
                                placementReceived: true,
                                referrals: true,
                                placementInterviews: true,
                                placementForms: true,
                                referAmount: true,
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
                                feeFollowups: {
                                    take: 1,
                                    orderBy: {
                                        createdAt: 'desc',
                                    },
                                },
                                user: {
                                    select: {
                                        fullname: true,
                                        phoneNumber: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }
        const totalBatchAttendance = batch.attendances.length;

        // formatting
        return batch.batchStudents.map((student) => {
            const studentPresentDays = student.student.attendanceEntries.length;
            const attendancePercentage =
                totalBatchAttendance > 0
                    ? Number(((studentPresentDays / totalBatchAttendance) * 100).toFixed(2))
                    : 0;

            return {
                id: student.student.id,
                name: student.student.user.fullname,
                phone: student.student.user.phoneNumber,
                totalAttendance: attendancePercentage,
                totalExam: batch.examBatches.length,
                completeExam: student.student.examResults.length,
                finalExam: student.student.finalExam,
                placementForm: student.student.placementForm,
                internship: student.student.internship,
                totalFees: student.student.totalFees,
                discount: student.student.discount ?? 0,
                paidFees: student.student.paidFees,
                pendingFees: student.student.pendingFees,
                followUpDate: student.student.followUpDate,
                totalInterviewGiven: student.student.placementInterviews.length,
                placementRecieved: student.student.placementReceived,
                referals: student.student.leads.length,
                followUp: student.student.feeFollowups[0],
                username: student.student.user.username,
                referAmount: student.student.referAmount,
                totaldailyTask: batch.dailyTasks.length,
                completedDailyTask: student.student.taskCompletions.length,
                totalAssignment: batch.assignments.length,
                completedAssignment: student.student.assignmentCompletions.length,
                batch: (
                    student.student.batchStudents.find((bs) => bs.batchId === batchId) ??
                    student.student.batchStudents[0]
                )?.batch,
                payments: student.student.feesCollects,
            };
        });
    }

    async getBatches(adminId: string, query: PaginateBatches) {
        const {page, limit, searchTerm} = query;

        const [batches, totalItems] = await Promise.all([
            prisma.batch.findMany({
                where: {
                    adminId,
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                include: {
                    course: true,
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    fullname: true,
                                    phoneNumber: true,
                                },
                            },
                        },
                    },
                    teachingDays: true,
                    feeOptions: {
                        include: {
                            feeInstallments: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.batch.count({
                where: {
                    adminId,
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            }),
        ]);

        return {
            data: batches,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getBatchById(id: string, adminId: string) {
        const batch = await prisma.batch.findFirst({
            where: {id, adminId},
            include: {
                course: true,
                teacher: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
                teachingDays: true,
                feeOptions: {
                    include: {
                        feeInstallments: true,
                    },
                },
            },
        });
        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }
        return batch;
    }

    async updateBatch(id: string, adminId: string, data: UpdateBatchData) {
        const {teachingDays, feeOptions, ...batchData} = data;

        const existingBatch = await prisma.batch.findFirst({
            where: {id, adminId},
        });
        if (!existingBatch) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }

        return prisma.$transaction(async (tx) => {
            if (teachingDays) {
                await tx.teachingDays.update({
                    where: {batchId: id},
                    data: teachingDays,
                });
            }

            if (feeOptions) {
                const existingOptions = await tx.feeOptions.findMany({
                    where: {batchId: id},
                    select: {id: true},
                });
                const optionIds = existingOptions.map((opt) => opt.id);

                await tx.feeInstallments.deleteMany({
                    where: {feeOptionId: {in: optionIds}},
                });
                await tx.feeOptions.deleteMany({
                    where: {batchId: id},
                });

                for (const opt of feeOptions) {
                    await tx.feeOptions.create({
                        data: {
                            name: opt.name,
                            batchId: id,
                            feeInstallments: {
                                create: opt.feeInstallments?.map((inst) => ({
                                    name: inst.name,
                                    amount: inst.amount,
                                })),
                            },
                        },
                    });
                }
            }

            return tx.batch.update({
                where: {id},
                data: batchData,
                include: {
                    teachingDays: true,
                    feeOptions: {
                        include: {
                            feeInstallments: true,
                        },
                    },
                },
            });
        });
    }

    async deleteBatch(id: string, adminId: string) {
        const existingBatch = await prisma.batch.findFirst({
            where: {id, adminId},
        });
        if (!existingBatch) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }

        return prisma.$transaction(async (tx) => {
            const existingOptions = await tx.feeOptions.findMany({
                where: {batchId: id},
                select: {id: true},
            });
            const optionIds = existingOptions.map((opt) => opt.id);

            await tx.feeInstallments.deleteMany({
                where: {feeOptionId: {in: optionIds}},
            });

            await tx.feeOptions.deleteMany({
                where: {batchId: id},
            });

            await tx.teachingDays.delete({
                where: {batchId: id},
            });

            return tx.batch.delete({
                where: {id},
            });
        });
    }
    async getReferedStudent(id: string) {
        const batch = await prisma.batch.findUnique({
            where: {id},
            include: {
                batchStudents: {
                    where: {
                        student: {
                            leads: {
                                some: {},
                            },
                        },
                    },
                    include: {
                        student: {
                            include: {
                                user: true,
                                leads: true,
                            },
                        },
                    },
                },
            },
        });

        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }

        return batch.batchStudents.map((bs) => bs.student);
    }
}

export default new BatchService();
