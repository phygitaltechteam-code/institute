import prisma from '@client';
import {ApiError} from '@utils/index';
import {placementValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {Prisma, placement} from '@prisma/client';
type CreatePlacementData = z.infer<typeof placementValidation.createPlacementSchema>;
type UpdatePlacementData = z.infer<typeof placementValidation.updatePlacementSchema>;
type PaginatePlacements = z.infer<typeof placementValidation.paginatePlacementSchema>;
type ScheduleInterviewData = z.infer<typeof placementValidation.scheduleInterviewSchema>;

class PlacementService {
    private async handlePlacementNotFound(placement: placement | null) {
        if (!placement) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement not found');
        }
    }

    async createPlacement(adminId: string, data: CreatePlacementData) {
        return prisma.placement.create({
            data: {
                ...data,
                adminId,
            },
        });
    }

    async getPlacements(adminId: string, query: PaginatePlacements) {
        const {page, limit, searchTerm} = query;

        const where: Prisma.placementWhereInput = {
            adminId,
        };

        if (searchTerm) {
            where.OR = [
                {companyName: {contains: searchTerm, mode: 'insensitive'}},
                {jobRole: {contains: searchTerm, mode: 'insensitive'}},
                {qualification: {contains: searchTerm, mode: 'insensitive'}},
            ];
        }

        const [placements, totalItems] = await Promise.all([
            prisma.placement.findMany({
                where,
                include: {
                    placementStudents: {
                        where: {
                            isApplied: true,
                            isInterview: false,
                        },
                        select: {
                            student: {
                                select: {
                                    placementForms: {
                                        include: {
                                            degrees: true,
                                        },
                                    },
                                    id: true,
                                    user: {
                                        select: {
                                            fullname: true,
                                            email: true,
                                            phoneNumber: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    interviewDate: 'desc',
                },
            }),
            prisma.placement.count({
                where,
            }),
        ]);

        return {
            data: placements,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getPlacementById(id: string, adminId: string) {
        const placement = await prisma.placement.findFirst({
            where: {
                id,
                adminId,
            },
            include: {
                placementStudents: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullname: true,
                                        email: true,
                                        phoneNumber: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        await this.handlePlacementNotFound(placement);
        return placement;
    }

    async updatePlacement(id: string, adminId: string, data: UpdatePlacementData) {
        const placement = await prisma.placement.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handlePlacementNotFound(placement);

        return prisma.placement.update({
            where: {id},
            data,
        });
    }

    async deletePlacement(id: string, adminId: string) {
        const placement = await prisma.placement.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handlePlacementNotFound(placement);

        return prisma.placement.delete({
            where: {id},
        });
    }

    async createPlacementStudent(
        teacherId: string,
        data: z.infer<typeof placementValidation.createPlacementStudentSchema>,
    ) {
        const placement = await prisma.placement.findUnique({where: {id: data.placementId}});
        if (!placement) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement not found');
        }

        const student = await prisma.student.findUnique({where: {id: data.studentId}});
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        return prisma.placementStudent.create({
            data: {
                ...data,
                teacherId,
            },
            include: {
                placement: true,
                student: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async getPlacementStudents(
        teacherId: string,
        query: z.infer<typeof placementValidation.paginatePlacementSchema>,
    ) {
        const {page, limit, searchTerm} = query;

        const where: Prisma.placementStudentWhereInput = {
            teacherId,
        };

        if (searchTerm) {
            where.OR = [
                {
                    student: {
                        user: {
                            fullname: {contains: searchTerm, mode: 'insensitive'},
                        },
                    },
                },
                {
                    placement: {
                        companyName: {contains: searchTerm, mode: 'insensitive'},
                    },
                },
            ];
        }

        const [placementStudents, totalItems] = await Promise.all([
            prisma.placementStudent.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    placement: true,
                    student: {
                        include: {
                            user: {
                                select: {
                                    fullname: true,
                                    email: true,
                                    phoneNumber: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.placementStudent.count({
                where,
            }),
        ]);

        return {
            data: placementStudents,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getPlacementStudentById(id: string, teacherId: string) {
        const record = await prisma.placementStudent.findFirst({
            where: {
                id,
                teacherId,
            },
            include: {
                placement: true,
                student: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement student record not found');
        }
        return record;
    }

    async updatePlacementStudent(
        id: string,
        teacherId: string,
        data: z.infer<typeof placementValidation.updatePlacementStudentSchema>,
    ) {
        const record = await prisma.placementStudent.findFirst({
            where: {
                id,
                teacherId,
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement student record not found');
        }

        return prisma.placementStudent.update({
            where: {id},
            data,
            include: {
                placement: true,
                student: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async deletePlacementStudent(id: string, teacherId: string) {
        const record = await prisma.placementStudent.findFirst({
            where: {
                id,
                teacherId,
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement student record not found');
        }

        return prisma.placementStudent.delete({
            where: {id},
        });
    }

    async scheduleInterview(placementId: string, data: ScheduleInterviewData) {
        const placement = await prisma.placement.findFirst({
            where: {id: placementId},
        });
        await this.handlePlacementNotFound(placement);

        return await prisma.$transaction(async (tx) => {
            const results = [];
            for (const {studentId} of data.student) {
                const student = await tx.student.findFirst({
                    where: {id: studentId},
                });
                if (!student) {
                    throw new ApiError(
                        httpStatus.NOT_FOUND,
                        `Student with ID ${studentId} not found`,
                    );
                }

                await tx.placementStudent.upsert({
                    where: {
                        placementId_studentId: {
                            placementId,
                            studentId,
                        },
                    },
                    update: {
                        isInterview: true,
                    },
                    create: {
                        placementId,
                        studentId,
                        isApplied: true,
                        isInterview: true,
                    },
                });

                const interview = await tx.placementInterview.create({
                    data: {
                        placementId,
                        studentId,
                        interviewDate: data.interviewDate,
                        interviewMode: data.interviewMode,
                        location: data.location || null,
                    },
                });
                results.push(interview);
            }
            return results;
        });
    }
    async getInterviewStudent(placementId: string) {
        const interviews = await prisma.placementInterview.findMany({
            where: {
                placementId,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });
        return interviews;
    }
    async getAssignedPlacement(placementId: string) {
        const data = await prisma.placementStudent.findMany({
            where: {placementId},
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        });

        return data;
    }
}

export default new PlacementService();
