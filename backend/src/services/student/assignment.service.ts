import prisma from '@client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';

class StudentAssignmentService {
    private async ensureStudentEnrolledInBatch(studentId: string, batchId: string) {
        const enrollment = await prisma.batchStudents.findFirst({
            where: {
                studentId,
                batchId,
            },
        });

        if (!enrollment) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'Student is not enrolled in the batch for this assignment',
            );
        }
    }

    async getAssignments(studentId: string) {
        const student = await prisma.student.findUnique({
            where: {id: studentId},
            include: {batchStudents: true},
        });
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
        }

        const batchIds = student.batchStudents.map((bs) => bs.batchId);
        if (batchIds.length === 0) {
            return [];
        }

        const assignments = await prisma.assignment.findMany({
            where: {
                batchId: {
                    in: batchIds,
                },
            },
            include: {
                assignmentCompletions: {
                    where: {
                        studentId,
                    },
                },
            },
            orderBy: {
                deadline: 'desc',
            },
        });

        return assignments;
    }

    async getAssignmentById(studentId: string, assignmentId: string) {
        const assignment = await prisma.assignment.findUnique({
            where: {id: assignmentId},
        });

        if (!assignment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found');
        }

        await this.ensureStudentEnrolledInBatch(studentId, assignment.batchId);

        const assignmentDetails = await prisma.assignment.findUnique({
            where: {id: assignmentId},
            include: {
                assignmentCompletions: {
                    where: {
                        studentId,
                    },
                },
            },
        });

        return assignmentDetails;
    }

    async updateCompletionStatus(
        studentId: string,
        assignmentId: string,
        completed: boolean,
        documentUrl?: string,
    ) {
        const assignment = await prisma.assignment.findUnique({
            where: {id: assignmentId},
        });

        if (!assignment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found');
        }

        await this.ensureStudentEnrolledInBatch(studentId, assignment.batchId);

        // Find existing completion or create one if it doesn't exist
        const completion = await prisma.assignmentCompletion.findFirst({
            where: {
                taskId: assignmentId,
                studentId,
            },
        });

        if (completion) {
            return prisma.assignmentCompletion.update({
                where: {id: completion.id},
                data: {completed, documentUrl},
            });
        } else {
            return prisma.assignmentCompletion.create({
                data: {
                    taskId: assignmentId,
                    studentId,
                    completed,
                    documentUrl,
                },
            });
        }
    }
}

export default new StudentAssignmentService();
