import prisma from '@client';
import {ApiError} from '@utils/index';
import {placementValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {Prisma, placement} from '@prisma/client';

type CreatePlacementData = z.infer<typeof placementValidation.createPlacementSchema>;
type UpdatePlacementData = z.infer<typeof placementValidation.updatePlacementSchema>;
type PaginatePlacements = z.infer<typeof placementValidation.paginatePlacementSchema>;
type placementaAssign = z.infer<typeof placementValidation.assignStudentSchema>;
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
        adminId: string,
        data: z.infer<typeof placementValidation.createPlacementStudentSchema>,
    ) {
        const placement = await prisma.placement.findFirst({
            where: {id: data.placementId, adminId},
        });
        if (!placement) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Placement not found or does not belong to this admin',
            );
        }

        const student = await prisma.student.findFirst({
            where: {id: data.studentId, adminId},
        });
        if (!student) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Student not found or does not belong to this admin',
            );
        }

        return prisma.placementStudent.create({
            data: {
                placementId: data.placementId,
                studentId: data.studentId,
                teacherId: data.teacherId || null,
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
        adminId: string,
        query: z.infer<typeof placementValidation.paginatePlacementSchema>,
    ) {
        const {page, limit, searchTerm, batchId} = query;

        const where: Prisma.placementStudentWhereInput = {
            placement: {
                adminId,
            },
        };

        if (batchId) {
            where.student = {
                batchStudents: {
                    some: {
                        batchId,
                    },
                },
            };
        }

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
                            placementForms: {
                                include: {
                                    degrees: true,
                                },
                            },
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
        console.log('placementStudents', placementStudents);
        console.log('where', where);
        return {
            data: placementStudents,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getPlacementStudentById(id: string, adminId: string) {
        const record = await prisma.placementStudent.findFirst({
            where: {
                id,
                placement: {
                    adminId,
                },
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
        adminId: string,
        data: z.infer<typeof placementValidation.updatePlacementStudentSchema>,
    ) {
        const record = await prisma.placementStudent.findFirst({
            where: {
                id,
                placement: {
                    adminId,
                },
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement student record not found');
        }

        // Validate placementId if provided
        if (data.placementId) {
            const placement = await prisma.placement.findFirst({
                where: {id: data.placementId, adminId},
            });
            if (!placement) {
                throw new ApiError(
                    httpStatus.NOT_FOUND,
                    'Placement not found or does not belong to this admin',
                );
            }
        }

        // Validate studentId if provided
        if (data.studentId) {
            const student = await prisma.student.findFirst({
                where: {id: data.studentId, adminId},
            });
            if (!student) {
                throw new ApiError(
                    httpStatus.NOT_FOUND,
                    'Student not found or does not belong to this admin',
                );
            }
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

    async deletePlacementStudent(id: string, adminId: string) {
        const record = await prisma.placementStudent.findFirst({
            where: {
                id,
                placement: {
                    adminId,
                },
            },
        });
        if (!record) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Placement student record not found');
        }

        return prisma.placementStudent.delete({
            where: {id},
        });
    }

    async getInterviews(
        adminId: string,
        query: z.infer<typeof placementValidation.paginateInterviewsSchema>,
    ) {
        const {page, limit, searchTerm, batchId} = query;

        const where: Prisma.placementWhereInput = {
            adminId,
        };

        if (batchId) {
            where.placementStudents = {
                some: {
                    student: {
                        batchStudents: {
                            some: {
                                batchId,
                            },
                        },
                    },
                },
            };
        }

        if (searchTerm) {
            where.OR = [
                {companyName: {contains: searchTerm, mode: 'insensitive'}},
                {jobRole: {contains: searchTerm, mode: 'insensitive'}},
                {qualification: {contains: searchTerm, mode: 'insensitive'}},
            ];
        }

        const [interviews, totalItems] = await Promise.all([
            prisma.placement.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    interviewDate: 'desc',
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
            }),
            prisma.placement.count({
                where,
            }),
        ]);

        return {
            data: interviews,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }
    async assignStudents(placementId: string, data: placementaAssign) {
        for (const {studentId} of data.students) {
            const student = await prisma.student.findFirst({
                where: {id: studentId},
            });
            if (!student) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
            }
            const placementStudent = await prisma.placementStudent.findFirst({
                where: {placementId, studentId},
            });
            if (placementStudent) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Placement student already exists');
            }
            await prisma.placementStudent.create({
                data: {placementId, studentId},
            });
        }
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

    async scheduleInterview(placementId: string, data: ScheduleInterviewData) {
        const placement = await prisma.placement.findFirst({
            where: {id: placementId},
        });

        await this.handlePlacementNotFound(placement);

        return await prisma.$transaction(async (tx) => {
            const scheduled = [];
            const skipped = [];

            for (const {studentId} of data.student) {
                // Check student exists
                const student = await tx.student.findUnique({
                    where: {id: studentId},
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                });

                if (!student) {
                    skipped.push({
                        studentId,
                        reason: 'Student not found',
                    });
                    continue;
                }

                // Check if student is already mapped to placement
                const placementStudent = await tx.placementStudent.findUnique({
                    where: {
                        placementId_studentId: {
                            placementId,
                            studentId,
                        },
                    },
                });

                // Skip if interview already scheduled
                if (placementStudent?.isInterview) {
                    skipped.push({
                        studentId,
                        studentName: student.user.fullname,
                        reason: 'Interview already scheduled',
                    });
                    continue;
                }

                // Create or update placementStudent
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

                // Create interview
                const interview = await tx.placementInterview.create({
                    data: {
                        placementId,
                        studentId,
                        interviewDate: data.interviewDate,
                        interviewMode: data.interviewMode,
                        location: data.location ?? null,
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

                scheduled.push(interview);
            }

            return {
                success: true,
                message: `${scheduled.length} interview(s) scheduled successfully.`,
                scheduled,
                skipped,
            };
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
}

export default new PlacementService();
