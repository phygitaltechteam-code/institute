/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@client';
import {ApiError} from '@utils/index';
import {examValidation} from '@validations/index';
import httpStatus from 'http-status';
import {z} from 'zod';

type CreateExamData = z.infer<typeof examValidation.createExamSchema>;
type UpdateExamData = z.infer<typeof examValidation.updateExamSchema>;
type PaginateExams = z.infer<typeof examValidation.paginateExamsSchema>;
type assignExam = z.infer<typeof examValidation.assignExamSchema>;

type ExamQuestionData = z.infer<typeof examValidation.examQuestionSchema>;

class ExamService {
    private async handleExamNotFound(exam: any) {
        if (!exam) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
        }
    }

    private async handleExamQuestionNotFound(question: any) {
        if (!question) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Exam question not found');
        }
    }

    private async ensureExamBelongsToAdmin(examId: string, adminId: string) {
        const exam = await prisma.exam.findFirst({
            where: {
                id: examId,
                adminId,
            },
        });

        if (!exam) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Exam not found');
        }
    }

    /** Exam names must be unique within an institute (case-insensitive). */
    private async ensureUniqueExamName(adminId: string, name: string, excludeId?: string) {
        const duplicate = await prisma.exam.findFirst({
            where: {
                adminId,
                name: {equals: name.trim(), mode: 'insensitive'},
                ...(excludeId ? {id: {not: excludeId}} : {}),
            },
            select: {id: true},
        });
        if (duplicate) {
            throw new ApiError(httpStatus.CONFLICT, `An exam with the name ${name.trim()} already exists. Please use a different name.`);
        }
    }

    async createExam(batchId: string, adminId: string, data: CreateExamData) {
        const {questions = [], subject, ...examData} = data;
        await this.ensureUniqueExamName(adminId, examData.name);

        return prisma.$transaction(async (tx) => {
            const exam = await tx.exam.create({
                data: {
                    ...examData,
                    subjectId: subject,
                    adminId,
                    examQuestions: {
                        create: questions,
                    },
                },
                include: {
                    course: true,
                    examQuestions: true,
                    examResults: true,
                },
            });

            return exam;
        });
    }

    async getExams(adminId: string, query: PaginateExams) {
        const {page, limit, searchTerm} = query;

        const [exams, totalItems] = await Promise.all([
            prisma.exam.findMany({
                where: {
                    adminId,
                    OR: [
                        {
                            name: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                        // {
                        //     subject: {
                        //         contains: searchTerm,
                        //         mode: 'insensitive',
                        //     },
                        // },
                    ],
                },
                include: {
                    subjectt: true,
                    course: true,
                    examQuestions: true,
                    examResults: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.exam.count({
                where: {
                    adminId,
                    OR: [
                        {
                            name: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                        // {
                        //     subject: {
                        //         contains: searchTerm,
                        //         mode: 'insensitive',
                        //     },
                        // },
                    ],
                },
            }),
        ]);

        return {
            data: exams,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }

    async getExamById(id: string, adminId: string) {
        const exam = await prisma.exam.findFirst({
            where: {
                id,
                adminId,
            },
            include: {
                course: true,
                subjectt: true,
                examQuestions: true,
                examResults: {
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

        await this.handleExamNotFound(exam);
        return exam;
    }

    async createExamQuestion(examId: string, adminId: string, data: ExamQuestionData) {
        await this.ensureExamBelongsToAdmin(examId, adminId);

        return prisma.examQuestions.create({
            data: {
                ...data,
                examId,
            },
        });
    }

    async getExamQuestions(examId: string, adminId: string) {
        await this.ensureExamBelongsToAdmin(examId, adminId);

        return prisma.examQuestions.findMany({
            where: {examId},
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getExamQuestionById(id: string, examId: string, adminId: string) {
        await this.ensureExamBelongsToAdmin(examId, adminId);

        const question = await prisma.examQuestions.findFirst({
            where: {
                id,
                examId,
            },
        });

        await this.handleExamQuestionNotFound(question);
        return question;
    }

    async updateExamQuestion(
        id: string,
        examId: string,
        adminId: string,
        data: Partial<ExamQuestionData>,
    ) {
        await this.ensureExamBelongsToAdmin(examId, adminId);

        const existingQuestion = await prisma.examQuestions.findFirst({
            where: {
                id,
                examId,
            },
        });
        await this.handleExamQuestionNotFound(existingQuestion);

        const examResultCount = await prisma.examResults.count({
            where: {
                examId,
            },
        });

        if (examResultCount > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Exam has already been solved by students and questions cannot be updated',
            );
        }

        return prisma.examQuestions.update({
            where: {id},
            data,
        });
    }

    async deleteExamQuestion(id: string, examId: string, adminId: string) {
        await this.ensureExamBelongsToAdmin(examId, adminId);

        const existingQuestion = await prisma.examQuestions.findFirst({
            where: {
                id,
                examId,
            },
        });
        await this.handleExamQuestionNotFound(existingQuestion);

        const examResultCount = await prisma.examResults.count({
            where: {
                examId,
            },
        });

        if (examResultCount > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Exam has already been solved by students and questions cannot be deleted',
            );
        }

        return prisma.examQuestions.delete({
            where: {id},
        });
    }

    async updateExam(id: string, adminId: string, data: UpdateExamData) {
        const {questions, ...examData} = data;
        if (examData.name) await this.ensureUniqueExamName(adminId, examData.name, id);

        const existingExam = await prisma.exam.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleExamNotFound(existingExam);

        const examResultCount = await prisma.examResults.count({
            where: {
                examId: id,
            },
        });

        if (examResultCount > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Exam has already been solved by students and cannot be updated',
            );
        }

        return prisma.$transaction(async (tx) => {
            if (questions) {
                await tx.examQuestions.deleteMany({
                    where: {
                        examId: id,
                    },
                });
            }

            const exam = await tx.exam.update({
                where: {id},
                data: {
                    ...examData,
                    ...(questions && {
                        examQuestions: {
                            create: questions,
                        },
                    }),
                },
                include: {
                    course: true,
                    examQuestions: true,
                    examResults: true,
                },
            });

            return exam;
        });
    }

    async deleteExam(id: string, adminId: string) {
        const existingExam = await prisma.exam.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleExamNotFound(existingExam);

        const examResultCount = await prisma.examResults.count({
            where: {
                examId: id,
            },
        });

        if (examResultCount > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Exam has already been solved by students and cannot be deleted',
            );
        }

        return prisma.$transaction(async (tx) => {
            await tx.examResults.deleteMany({
                where: {
                    examId: id,
                },
            });

            await tx.examQuestions.deleteMany({
                where: {
                    examId: id,
                },
            });

            return tx.exam.delete({
                where: {id},
            });
        });
    }
    async assignExamToBatch(id: string, adminId: string, data: assignExam) {
        await this.ensureExamBelongsToAdmin(data.examId, adminId);
        return prisma.examBatches.create({
            data: {
                examId: data.examId,
                batchId: id,
            },
            include: {
                batch: true,
                exam: true,
            },
        });
    }
    async getExamsByBatchId(adminId: string, batchId: string, query: PaginateExams) {
        const {page, limit, searchTerm} = query;

        const [exams, totalItems] = await Promise.all([
            prisma.examBatches.findMany({
                where: {
                    // adminId,
                    batchId,
                    // OR: [
                    //     {
                    //         name: {
                    //             contains: searchTerm,
                    //             mode: 'insensitive',
                    //         },
                    //     },
                    //     {
                    //         subject: {
                    //             contains: searchTerm,
                    //             mode: 'insensitive',
                    //         },
                    //     },
                    // ],
                },
                include: {
                    batch: true,
                    exam: {
                        include: {
                            course: true,
                            examQuestions: true,
                            subjectt: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.exam.count({
                where: {
                    adminId,
                    OR: [
                        {
                            name: {
                                contains: searchTerm,
                                mode: 'insensitive',
                            },
                        },
                        // {
                        //     subject: {
                        //         contains: searchTerm,
                        //         mode: 'insensitive',
                        //     },
                        // },
                    ],
                },
            }),
        ]);

        return {
            data: exams,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };
    }
    async getExamData(id: string, adminId: string) {
        const exam = await prisma.exam.findFirst({
            where: {
                id,
                adminId,
            },
        });
        await this.handleExamNotFound(exam);

        return prisma.examResults.findMany({
            where: {
                examId: id,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                fullname: true,
                                username: true,
                                email: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                marks: 'desc',
            },
        });
    }

    async updateRemark(resultId: string, adminId: string, remarks: string) {
        const result = await prisma.examResults.findUnique({
            where: {id: resultId},
            include: {exam: true},
        });
        if (!result || result.exam.adminId !== adminId) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Exam result not found');
        }

        return prisma.examResults.update({
            where: {id: resultId},
            data: {remarks},
        });
    }
    async getStudentExamsResult(studentId: string, examId: string) {
        const results = await prisma.examResults.findMany({
            where: {
                studentId,
                examId,
            },
            include: {
                exam: {
                    include: {
                        course: true,
                        examQuestions: true,
                        _count: {
                            select: {
                                examQuestions: true,
                            },
                        },
                    },
                },
                studentExamSubmitteds: {
                    include: {
                        question: true,
                    },
                },
            },
        });

        return results;
    }
}

export default new ExamService();
