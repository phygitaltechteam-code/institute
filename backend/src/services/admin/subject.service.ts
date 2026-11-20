import prisma from '@client';
// import {Student} from '@prisma/client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';

class SubjectService {
    private async handleSubjectNotFound(subject: {id: string} | null) {
        if (!subject) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
        }
    }

    async createSubject(name: string) {
        return prisma.subject.create({
            data: {
                name,
            },
        });
    }

    async getSubjects(page: number, limit: number, searchTerm?: string) {
        const where = searchTerm
            ? {
                  name: {
                      contains: searchTerm,
                      mode: 'insensitive' as const,
                  },
              }
            : {};

        const [subjects, totalItems] = await Promise.all([
            prisma.subject.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    name: 'asc',
                },
            }),
            prisma.subject.count({where}),
        ]);

        return {
            data: subjects,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getSubjectById(id: string) {
        const subject = await prisma.subject.findUnique({
            where: {id},
        });

        await this.handleSubjectNotFound(subject);

        return subject;
    }

    async updateSubject(id: string, name: string) {
        const subject = await prisma.subject.findUnique({
            where: {id},
        });

        await this.handleSubjectNotFound(subject);

        return prisma.subject.update({
            where: {id},
            data: {
                name,
            },
        });
    }

    async deleteSubject(id: string) {
        const subject = await prisma.subject.findUnique({
            where: {id},
        });

        await this.handleSubjectNotFound(subject);

        return prisma.subject.delete({
            where: {id},
        });
    }
}

export default new SubjectService();
