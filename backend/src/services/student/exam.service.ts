import prisma from '@client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import {examValidation} from '@validations/index';
type SubmitExamData = z.infer<typeof examValidation.submitExamSchema>;

class ExamService {
    async getStudentExams(studentId: string) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {
                batchStudents: {
                    include: {
                        batch: true,
                    },
                },
            },
        });
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        const courseIds = student.batchStudents.map((bs) => bs.batch.courseId);

        if (courseIds.length === 0) {
            return [];
        }

        const exams = await prisma.exam.findMany({
            where: {
                examBatches: {
                    some: {
                        batchId: {
                            in: student.batchStudents.map((bs) => bs.batchId),
                        },
                    },
                },
            },
            include: {
                course: true,
                examQuestions: true,
                examResults: {
                    where: {
                        studentId,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return exams.map((exam) => ({
            ...exam,
            isSubmitted: exam.examResults.length > 0,
        }));
    }

    async getStudentExamById(studentId: string, examId: string) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {
                batchStudents: {
                    include: {
                        batch: true,
                    },
                },
            },
        });
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        // const courseIds = student.batchStudents.map((bs) => bs.batch.courseId);

        const exam = await prisma.exam.findFirst({
            where: {
                id: examId,
                examBatches: {
                    some: {
                        batchId: {
                            in: student.batchStudents.map((bs) => bs.batchId),
                        },
                    },
                },
            },
            include: {
                course: true,
                examQuestions: true,
                examResults: {
                    where: {
                        studentId,
                    },
                },
            },
        });

        if (!exam) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Exam not found or you are not authorized to view it',
            );
        }

        const isSubmitted = exam.examResults.length > 0;

        return {
            exam,
            isSubmitted,
        };
    }
    async submitExam(studentId: string, examId: string, data: SubmitExamData) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {
                batchStudents: {
                    include: {
                        batch: true,
                    },
                },
            },
        });
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        const exam = await prisma.exam.findFirst({
            where: {
                id: examId,
                examBatches: {
                    some: {
                        batchId: {
                            in: student.batchStudents.map((bs) => bs.batchId),
                        },
                    },
                },
            },
            include: {
                course: true,
                examQuestions: true,
                examResults: {
                    where: {
                        studentId,
                    },
                },
            },
        });

        if (!exam) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Exam not found or you are not authorized to view it',
            );
        }

        if (exam.examResults.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'You have already submitted this exam');
        }

        let totalAnswer = 0;
        let correctAnswer = 0;
        let wrongAnswer = 0;
        let totalMarksObtained = 0;

        const submissions: {
            questionId: string;
            answer: string;
            isCorrect: boolean;
        }[] = [];

        for (const question of exam.examQuestions) {
            const studentAns = data.answers.find((ans) => ans.questionId === question.id);
            if (studentAns) {
                totalAnswer++;
                const answerKey = question.answer.trim().toLowerCase();
                let correctAnswerText = '';
                if (answerKey === 'optiona') correctAnswerText = question.optionA;
                else if (answerKey === 'optionb') correctAnswerText = question.optionB;
                else if (answerKey === 'optionc') correctAnswerText = question.optionC;
                else if (answerKey === 'optiond') correctAnswerText = question.optionD;
                else correctAnswerText = question.answer;

                const isCorrect =
                    studentAns.answer.trim().toLowerCase() ===
                    correctAnswerText.trim().toLowerCase();
                if (isCorrect) {
                    correctAnswer++;
                    totalMarksObtained += question.marks;
                } else {
                    wrongAnswer++;
                }
                submissions.push({
                    questionId: question.id,
                    answer: studentAns.answer,
                    isCorrect,
                });
            } else {
                submissions.push({
                    questionId: question.id,
                    answer: '',
                    isCorrect: false,
                });
            }
        }

        const totalExamMarks = exam.examQuestions.reduce((acc, q) => acc + q.marks, 0);
        const percentage = totalExamMarks > 0 ? (totalMarksObtained / totalExamMarks) * 100 : 0;

        const result = await prisma.$transaction(async (tx) => {
            const examResult = await tx.examResults.create({
                data: {
                    studentId,
                    examId,
                    marks: totalMarksObtained,
                    totalAnswer,
                    correctAnswer,
                    wrongAnswer,
                    percentage,
                    studentExamSubmitteds: {
                        create: submissions,
                    },
                },
            });

            await tx.student.update({
                where: {id: studentId},
                data: {
                    totalExams: {
                        increment: 1,
                    },
                },
            });

            return examResult;
        });

        return result;
    }

    async getStudentExamResult(studentId: string, examId: string) {
        const result = await prisma.examResults.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId,
                },
            },
            include: {
                exam: {
                    include: {
                        _count: {
                            select: {
                                examQuestions: true,
                            },
                        },
                    },
                },
            },
        });

        if (!result) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Exam result not found');
        }

        return result;
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

    // async getStudentExamsResultAnalysis(studentId: string,) {
    //     const results = await prisma.examResults.findMany({
    //         where: {
    //             studentId,
    //             // examId,
    //         },
    //         include: {
    //             exam: {
    //                 include: {
    //                     course: true,
    //                 },
    //             },
    //             studentExamSubmitteds: {
    //                 include: {
    //                     question: true,
    //                 },
    //             },
    //         },
    //     });

    //     return results;
    // }
}

export default new ExamService();
