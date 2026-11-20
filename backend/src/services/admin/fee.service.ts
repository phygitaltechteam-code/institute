import prisma from '@client';
import {ApiError} from '@utils/index';
import {feeValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {paymentType} from '@prisma/client';

type CollectFeeData = z.infer<typeof feeValidation.collectFeeSchema>;
type CreateFeeFollowupData = z.infer<typeof feeValidation.createFeeFollowupSchema>;
type PaginateFees = z.infer<typeof feeValidation.paginateFeesSchema>;

class FeeService {
    async collectFee(data: CollectFeeData) {
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

        return prisma.$transaction(async (tx) => {
            // Update Student's fee numbers
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

            // Update Account if accountId is provided
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

            // Create fee collection record
            // Determine pendingAmount to store on the record (can be passed in or calculated)
            const recordPendingAmount =
                data.pendingAmount !== undefined && data.pendingAmount !== null
                    ? data.pendingAmount
                    : studentPendingFees;

            return tx.feesCollect.create({
                data: {
                    studentId: data.studentId,
                    amount: data.amount,
                    // teacherId: data.teacherId || null,
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

    async createFeeFollowup(data: CreateFeeFollowupData) {
        const student = await prisma.student.findUnique({
            where: {id: data.studentId},
        });

        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        // Determine pendingAmount if not provided
        const recordPendingAmount =
            data.pendingAmount !== undefined && data.pendingAmount !== null
                ? data.pendingAmount
                : student.pendingFees || 0;

        return prisma.feeFollowup.create({
            data: {
                studentId: data.studentId,
                amount: data.amount,
                followUpDate: data.followUpDate || undefined,
                pendingAmount: recordPendingAmount,
                notes: data.notes,
                // teacherId: data.teacherId || null,
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

    async getFeeCollections(query: PaginateFees, adminId: string) {
        const {page, limit, searchTerm, studentId, teacherId, accountId} = query;

        // Always scoped to this institute's students
        const where: any = {student: {adminId}};
        if (studentId) where.studentId = studentId;
        if (teacherId) where.teacherId = teacherId;
        if (accountId) where.accountId = accountId;

        if (searchTerm) {
            where.student = {
                adminId,
                user: {
                    fullname: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
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
                                    phoneNumber: true,
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

    async getFeeFollowups(query: PaginateFees, adminId: string) {
        const {page, limit, searchTerm, studentId, teacherId} = query;

        // Always scoped to this institute's students
        const where: any = {student: {adminId}};
        if (studentId) where.studentId = studentId;
        if (teacherId) where.teacherId = teacherId;

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

export default new FeeService();
