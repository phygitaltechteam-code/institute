/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {ApiError} from '@utils/index';
import {dailyTaskValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type CreateDailyTaskData = z.infer<typeof dailyTaskValidation.createDailyTaskSchema>;
type UpdateDailyTaskData = z.infer<typeof dailyTaskValidation.updateDailyTaskSchema>;
type PaginateDailyTasks = z.infer<typeof dailyTaskValidation.paginateDailyTasksSchema>;

class DailyTaskService {
    private async handleTaskNotFound(task: any) {
        if (!task) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Daily task not found');
        }
    }

    private async ensureBatchBelongsToAdmin(batchId: string, adminId: string) {
        const batch = await prisma.batch.findFirst({
            where: {
                id: batchId,
                adminId,
            },
        });

        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
        }
    }

    async createDailyTask(batchId: string, adminId: string, data: CreateDailyTaskData) {
        await this.ensureBatchBelongsToAdmin(batchId, adminId);

        return prisma.dailyTasks.create({
            data: {
                ...data,
                batchId,
            },
            include: {
                taskCompletions: true,
            },
        });
    }

    async getDailyTasks(batchId: string, adminId: string, query: PaginateDailyTasks) {
        await this.ensureBatchBelongsToAdmin(batchId, adminId);
        const {page, limit, searchTerm} = query;

        const [tasks, totalItems] = await Promise.all([
            prisma.dailyTasks.findMany({
                where: {
                    batchId,
                    OR: [
                        {
                            topic: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                        {
                            task: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
                include: {
                    taskCompletions: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    date: 'desc',
                },
            }),
            prisma.dailyTasks.count({
                where: {
                    batchId,
                    OR: [
                        {
                            topic: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                        {
                            task: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            }),
        ]);

        return {
            data: tasks,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getDailyTaskById(id: string) {
        // await this.ensureBatchBelongsToAdmin(batchId, adminId);

        const task = await prisma.dailyTasks.findFirst({
            where: {
                id,
                // batchId,
            },
            include: {
                taskCompletions: true,
            },
        });

        await this.handleTaskNotFound(task);
        return task;
    }

    async updateDailyTask(id: string, adminId: string, data: UpdateDailyTaskData) {
        // await this.ensureBatchBelongsToAdmin(, adminId);

        const existingTask = await prisma.dailyTasks.findFirst({
            where: {
                id,
            },
        });
        await this.handleTaskNotFound(existingTask);

        return prisma.dailyTasks.update({
            where: {id},
            data,
            include: {
                taskCompletions: true,
            },
        });
    }

    async deleteDailyTask(id: string) {
        // await this.ensureBatchBelongsToAdmin(batchId, adminId);

        const existingTask = await prisma.dailyTasks.findFirst({
            where: {
                id,
                // batchId,
            },
        });
        await this.handleTaskNotFound(existingTask);

        return prisma.$transaction(async (tx) => {
            await tx.taskCompletion.deleteMany({
                where: {
                    taskId: id,
                },
            });

            return tx.dailyTasks.delete({
                where: {id},
            });
        });
    }

    async submitRemark(id: string, remark: string) {
        const completion = await prisma.taskCompletion.findUnique({
            where: {id},
        });

        if (!completion) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Task completion record not found');
        }

        return prisma.taskCompletion.update({
            where: {id},
            data: {remark},
        });
    }

    async getDataCompliance(id: string) {
        await this.handleTaskNotFound(id);
        const task = await prisma.dailyTasks.findFirst({
            where: {
                id,
            },
            include: {
                taskCompletions: {
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
        await this.handleTaskNotFound(task);
        return task;
    }
}

export default new DailyTaskService();
