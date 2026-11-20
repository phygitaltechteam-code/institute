import prisma from '@client';
import {ApiError} from '@utils/index';
import {accountValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {Prisma, Accounts} from '@prisma/client';

type CreateAccountData = z.infer<typeof accountValidation.createAccountSchema>;
type UpdateAccountData = z.infer<typeof accountValidation.updateAccountSchema>;
type PaginateAccounts = z.infer<typeof accountValidation.paginateAccountSchema>;

class AccountService {
    private async handleAccountNotFound(account: Accounts | null) {
        if (!account) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
        }
    }

    async createAccount(adminId: string, data: CreateAccountData) {
        return prisma.accounts.create({
            data: {
                ...data,
                adminId,
            },
        });
    }

    async getAccounts(adminId: string, query: PaginateAccounts) {
        const {page, limit, searchTerm} = query;

        const where: Prisma.AccountsWhereInput = {
            adminId,
        };

        if (searchTerm) {
            where.name = {contains: searchTerm, mode: 'insensitive'};
        }

        const [accounts, totalItems] = await Promise.all([
            prisma.accounts.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.accounts.count({
                where,
            }),
        ]);

        return {
            data: accounts,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getAccountById(id: string, adminId: string) {
        const account = await prisma.accounts.findFirst({
            where: {
                id,
                adminId,
            },
            include: {
                accountHistories: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        await this.handleAccountNotFound(account);
        return account;
    }

    async updateAccount(id: string, adminId: string, data: UpdateAccountData) {
        const account = await prisma.accounts.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleAccountNotFound(account);

        return prisma.accounts.update({
            where: {id},
            data,
        });
    }

    async deleteAccount(id: string, adminId: string) {
        const account = await prisma.accounts.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleAccountNotFound(account);

        return prisma.accounts.delete({
            where: {id},
        });
    }
}

export default new AccountService();
