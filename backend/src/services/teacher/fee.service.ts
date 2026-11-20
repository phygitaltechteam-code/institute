/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {ApiError} from '@utils/index';
import {feeValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {paymentType} from '@prisma/client';

type CollectFeeData = z.infer<typeof feeValidation.collectFeeSchema>;
type CreateFeeFollowupData = z.infer<typeof feeValidation.createFeeFollowupSchema>;
type PaginateFees = z.infer<typeof feeValidation.paginateFeesSchema>;

class TeacherFeeService {
    async collectFee(teacherId: string, data: CollectFeeData) {
        const student = await prisma.student.findUnique({
            where: {id: data.studentId},
            include: {user: true},
        });

        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        // A payment must be positive and cannot exceed what the student still owes
        const pendingNow = student.pendingFees ?? 0;
        if (!(data.amount > 0)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be greater than 0');
        }
        if (data.amount > pendingNow) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Amount (₹${data.amount}) is more than the pending fee (₹${pendingNow})`,
            );
        }

        // Verify this student is associated with the teacher

        return prisma.$transaction(async (tx) => {
            const studentPaidFees = (student.paidFees || 0) + data.amount;
            const studentPendingFees = Math.max(0, (student.pendingFees || 0) - data.amount);
            const studentTotalPaidFees = (student.totalPaidFees || 0) + data.amount;
            const studentTotalPendingFees = Math.max(
                0,
                (student.totalPendingFees || 0) - data.amount,
            );

            await tx.student.update({
                where: {id: data.studentId},
                data: {
                    paidFees: studentPaidFees,
                    pendingFees: studentPendingFees,
                    totalPaidFees: studentTotalPaidFees,
                    totalPendingFees: studentTotalPendingFees,
                },
            });

            if (data.accountId) {
                const account = await tx.accounts.findUnique({
                    where: {id: data.accountId},
                });
                if (!account) {
                    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
                }

                const updatedAccount = await tx.accounts.update({
                    where: {id: data.accountId},
                    data: {
                        balance: {
                            increment: data.amount,
                        },
                    },
                });

                await tx.accountHistory.create({
                    data: {
                        accountId: data.accountId,
                        amount: data.amount,
                        notes: `Fees collected for student: ${student.user?.fullname || 'Unknown'}`,
                        type: paymentType.CREDIT,
                        afterWalletBalance: updatedAccount.balance,
                    },
                });
            }

            const recordPendingAmount =
                data.pendingAmount !== undefined && data.pendingAmount !== null
                    ? data.pendingAmount
                    : studentPendingFees;

            return tx.feesCollect.create({
                data: {
                    studentId: data.studentId,
                    amount: data.amount,
                    teacherId,
                    pendingAmount: recordPendingAmount,
                    accountId: data.accountId || null,
                },
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
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    fullname: true,
                                    username: true,
                                },
                            },
                        },
                    },
                    account: true,
                },
            });
        });
    }

    async createFeeFollowup(teacherId: string, data: CreateFeeFollowupData) {
        const student = await prisma.student.findUnique({
            where: {id: data.studentId},
        });

        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        // if (student.teacherId !== teacherId) {
        //     throw new ApiError(
        //         httpStatus.FORBIDDEN,
        //         'You do not have permission to follow up on this student',
        //     );
        // }

        const recordPendingAmount =
            data.pendingAmount !== undefined && data.pendingAmount !== null
                ? data.pendingAmount
                : student.pendingFees || 0;

        return prisma.feeFollowup.create({
            data: {
                studentId: data.studentId,
                amount: data.amount,
                pendingAmount: recordPendingAmount,
                notes: data.notes,
                followUpDate: data.followUpDate || undefined,
                teacherId,
            },
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
                teacher: {
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
        });
    }

    async getFeeCollections(teacherId: string, query: PaginateFees) {
        const {page, limit, searchTerm, studentId, accountId} = query;

        const where: any = {
            student: {
                teacherId,
            },
        };
        if (studentId) where.studentId = studentId;
        if (accountId) where.accountId = accountId;

        if (searchTerm) {
            where.student.user = {
                fullname: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            };
        }

        const [collections, totalItems] = await Promise.all([
            prisma.feesCollect.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
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
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    fullname: true,
                                    username: true,
                                },
                            },
                        },
                    },
                    account: true,
                },
            }),
            prisma.feesCollect.count({where}),
        ]);

        return {
            data: collections,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getFeeFollowups(teacherId: string, query: PaginateFees) {
        const {page, limit, searchTerm, studentId} = query;

        const where: any = {
            student: {
                teacherId,
            },
        };
        if (studentId) where.studentId = studentId;

        if (searchTerm) {
            where.OR = [
                {
                    notes: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    student: {
                        user: {
                            fullname: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ];
        }

        const [followups, totalItems] = await Promise.all([
            prisma.feeFollowup.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
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
                    teacher: {
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
            }),
            prisma.feeFollowup.count({where}),
        ]);

        return {
            data: followups,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }
}

export default new TeacherFeeService();
