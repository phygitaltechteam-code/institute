import {z} from 'zod';
import {commonValidation} from '@validations/index';
import {ExamType} from '@prisma/client';

const examQuestionSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    optionA: z.string().min(1, 'Option A is required'),
    optionB: z.string().min(1, 'Option B is required'),
    optionC: z.string().min(1, 'Option C is required'),
    optionD: z.string().min(1, 'Option D is required'),
    answer: z.string().min(1, 'Answer is required'),
    marks: z.number().int().min(1, 'Marks must be greater than 0'),
    explanation: z.string().optional(),
});

const createExamSchema = z.object({
    name: z.string().min(1, 'Exam name is required'),
    subject: z.string().min(1, 'Subject is required'),
    courseId: z.string().uuid('Invalid course ID').optional(),
    marks: z.number().int().min(1, 'Marks must be greater than 0'),
    hours: z.number().int().optional(),
    minutes: z.number().int().min(0, 'Minutes must be 0 or more'),
    questions: z.array(examQuestionSchema).optional(),
    type: z.nativeEnum(ExamType),
    title: z.string().optional(),

    // batchId: z.string(),
});
const submitExamSchema = z.object({
    examId: z.string().uuid('Invalid exam ID'),
    answers: z.array(
        z.object({
            questionId: z.string().uuid('Invalid question ID'),
            answer: z.string().min(1, 'Answer is required'),
        }),
    ),
});
const assignExamSchema = z.object({
    examId: z.string().uuid('Invalid exam ID'),
    // batchId: z.string().uuid('Invalid batch ID'),
});
const updateExamSchema = createExamSchema.partial();

const paginateExamsSchema = commonValidation.paginationAndSearchSchema;

const updateRemarkSchema = z.object({
    remarks: z.string().min(1, 'Remark is required'),
});

export default {
    createExamSchema,
    updateExamSchema,
    idSchema: commonValidation.idSchema,
    paginateExamsSchema,
    examQuestionSchema,
    assignExamSchema,
    submitExamSchema,
    updateRemarkSchema,
};
