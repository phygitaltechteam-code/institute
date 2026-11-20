/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {ApiError} from '@utils/index';
import {assignmentValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type CreateAssignmentData = z.infer<typeof assignmentValidation.createAssignmentSchema>;
type UpdateAssignmentData = z.infer<typeof assignmentValidation.updateAssignmentSchema>;
type PaginateAssignments = z.infer<typeof assignmentValidation.paginateAssignmentsSchema>;

class AssignmentService {
    private async handleAssignmentNotFound(assignment: any) {
        if (!assignment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found');
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

    async createAssignment(batchId: string, adminId: string, data: CreateAssignmentData) {
        await this.ensureBatchBelongsToAdmin(batchId, adminId);

        return prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.create({
                data: {
                    ...data,
                    batchId,
                },
            });

            // Get all students in the batch
            const students = await tx.batchStudents.findMany({
                where: {
                    batchId,
                },
            });

            // Create assignment completions for all students in the batch
            if (students.length > 0) {
                await tx.assignmentCompletion.createMany({
                    data: students.map((student) => ({
                        taskId: assignment.id,
                        studentId: student.studentId,
                        completed: false,
                    })),
                });
            }

            return tx.assignment.findUnique({
                where: {id: assignment.id},
                include: {
                    assignmentCompletions: true,
                },
            });
        });
    }

    async getAssignments(batchId: string, adminId: string, query: PaginateAssignments) {
        await this.ensureBatchBelongsToAdmin(batchId, adminId);
        const {page, limit, searchTerm} = query;

        const [assignments, totalItems] = await Promise.all([
            prisma.assignment.findMany({
                where: {
                    batchId,
                    OR: [
                        {
                            name: {
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
                include: {
                    assignmentCompletions: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    deadline: 'desc',
                },
            }),
            prisma.assignment.count({
                where: {
                    batchId,
                    OR: [
                        {
                            name: {
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
            data: assignments,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getAssignmentById(id: string, adminId: string) {
        const assignment = await prisma.assignment.findFirst({
            where: {
                id,
                batch: {
                    adminId,
                },
            },
            include: {
                assignmentCompletions: {
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

        await this.handleAssignmentNotFound(assignment);
        return assignment;
    }

    async updateAssignment(id: string, adminId: string, data: UpdateAssignmentData) {
        const existingAssignment = await prisma.assignment.findFirst({
            where: {
                id,
                batch: {
                    adminId,
                },
            },
        });
        await this.handleAssignmentNotFound(existingAssignment);

        return prisma.assignment.update({
            where: {id},
            data,
            include: {
                assignmentCompletions: true,
            },
        });
    }

    async deleteAssignment(id: string, adminId: string) {
        const existingAssignment = await prisma.assignment.findFirst({
            where: {
                id,
                batch: {
                    adminId,
                },
            },
        });
        await this.handleAssignmentNotFound(existingAssignment);

        return prisma.$transaction(async (tx) => {
            await tx.assignmentCompletion.deleteMany({
                where: {
                    taskId: id,
                },
            });

            return tx.assignment.delete({
                where: {id},
            });
        });
    }
    async getDataCompliance(id: string, adminId: string) {
        await this.handleAssignmentNotFound(id);
        const assignment = await prisma.assignment.findFirst({
            where: {
                id,
                batch: {
                    adminId,
                },
            },
            include: {
                assignmentCompletions: {
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
        await this.handleAssignmentNotFound(assignment);
        return assignment;
    }
    async submitRemark(id: string, remark: string) {
        const completion = await prisma.assignmentCompletion.findUnique({
            where: {id},
        });

        if (!completion) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Assignment completion record not found');
        }

        return prisma.assignmentCompletion.update({
            where: {id},
            data: {remark},
        });
    }
}

export default new AssignmentService();
