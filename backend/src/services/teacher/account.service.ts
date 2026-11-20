import prisma from '@client';
import {accountValidation} from '@validations/index';
import {z} from 'zod';
import { Prisma } from '@prisma/client';

type PaginateAccounts = z.infer<typeof accountValidation.paginateAccountSchema>;

class TeacherAccountService {
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
}

export default new TeacherAccountService();
