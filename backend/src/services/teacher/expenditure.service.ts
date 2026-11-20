/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {ApiError} from '@utils/index';
import {expenditureValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {paymentType} from '@prisma/client';

type CreateExpenditureData = z.infer<typeof expenditureValidation.createExpenditureSchema>;
type UpdateExpenditureData = z.infer<typeof expenditureValidation.updateExpenditureSchema>;
type PaginateExpenditures = z.infer<typeof expenditureValidation.paginateExpenditureSchema>;

class ExpenditureService {
    private async handleExpenditureNotFound(expenditure: any) {
        if (!expenditure) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Expenditure not found');
        }
    }

    async createExpenditure(adminId: string, data: CreateExpenditureData) {
        const {accountId, amount, ...rest} = data;

        return prisma.$transaction(async (tx) => {
            if (accountId) {
                const account = await tx.accounts.findUnique({
                    where: {id: accountId},
                });
                if (!account) {
                    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
                }

                const updatedAccount = await tx.accounts.update({
                    where: {id: accountId},
                    data: {
                        balance: {
                            decrement: amount,
                        },
                    },
                });

                await tx.accountHistory.create({
                    data: {
                        accountId,
                        amount,
                        notes: `Expenditure: ${data.title}`,
                        type: paymentType.DEBIT,
                        afterWalletBalance: updatedAccount.balance,
                    },
                });
            }

            return tx.expenditure.create({
                data: {
                    ...rest,
                    amount,
                    adminId,
                    ...(accountId && {accountId}),
                },
            });
        });
    }

    async getExpenditures(adminId: string, query: PaginateExpenditures) {
        const {page, limit, searchTerm} = query;

        const [expenditures, totalItems] = await Promise.all([
            prisma.expenditure.findMany({
                where: {
                    adminId,
                    OR: [
                        {
                            title: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },

                        {
                            description: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    updatedAt: 'desc',
                },
            }),
            prisma.expenditure.count({
                where: {
                    adminId,
                    OR: [
                        {
                            title: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },

                        {
                            description: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            }),
        ]);

        return {
            data: expenditures,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getExpenditureById(id: string, adminId: string) {
        const expenditure = await prisma.expenditure.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleExpenditureNotFound(expenditure);
        return expenditure;
    }

    async updateExpenditure(id: string, adminId: string, data: UpdateExpenditureData) {
        const expenditure = await prisma.expenditure.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleExpenditureNotFound(expenditure);

        return prisma.expenditure.update({
            where: {id},
            data,
        });
    }

    async deleteExpenditure(id: string, adminId: string) {
        const expenditure = await prisma.expenditure.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleExpenditureNotFound(expenditure);

        return prisma.expenditure.delete({
            where: {id},
        });
    }
}

export default new ExpenditureService();
