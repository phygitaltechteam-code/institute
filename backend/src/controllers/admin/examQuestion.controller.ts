import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {examValidation} from '@validations/index';
import {examService} from '@services/admin';

const createExamQuestion = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.examId);
    const data = examValidation.examQuestionSchema.parse(req.body);
    const adminId = req.user!.adminId as string;

    const question = await examService.createExamQuestion(examId, adminId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, question, 'Exam question created successfully'),
    );
});

const getExamQuestions = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.examId);
    const adminId = req.user!.adminId as string;

    const result = await examService.getExamQuestions(examId, adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exam questions fetched successfully'),
    );
});

const getExamQuestionById = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.examId);
    const id = examValidation.idSchema.parse(req.params.questionId);
    const adminId = req.user!.adminId as string;

    const question = await examService.getExamQuestionById(id, examId, adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, question, 'Exam question fetched successfully'),
    );
});

const updateExamQuestion = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.examId);
    const id = examValidation.idSchema.parse(req.params.questionId);
    const data = examValidation.examQuestionSchema.partial().parse(req.body);
    const adminId = req.user!.adminId as string;

    const updated = await examService.updateExamQuestion(id, examId, adminId, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Exam question updated successfully'),
    );
});

const deleteExamQuestion = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.examId);
    const id = examValidation.idSchema.parse(req.params.questionId);
    const adminId = req.user!.adminId as string;

    await examService.deleteExamQuestion(id, examId, adminId);

    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Exam question deleted successfully'),
    );
});

export default {
    createExamQuestion,
    getExamQuestions,
    getExamQuestionById,
    updateExamQuestion,
    deleteExamQuestion,
};
