import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {examValidation} from '@validations/index';
import {examService, studentService} from '@services/student';

const getExams = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;

    const exams = await examService.getStudentExams(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, exams, 'Exams fetched successfully'),
    );
});

const getExamById = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    const studentId = req.user!.studentId as string;

    const exam = await examService.getStudentExamById(studentId, id);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, exam, 'Exam fetched successfully'),
    );
});

const submitExam = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.id);
    const studentId = req.user!.studentId as string;

    const data = examValidation.submitExamSchema.parse({
        ...req.body,
        examId,
    });

    const result = await examService.submitExam(studentId, examId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result, 'Exam submitted successfully'),
    );
});

const getExamResult = catchAsync(async (req, res) => {
    const examId = examValidation.idSchema.parse(req.params.id);
    const studentId = req.user!.studentId as string;

    const result = await examService.getStudentExamResult(studentId, examId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exam result fetched successfully'),
    );
});
const getStudentExamsResultAnalysis = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const examId = examValidation.idSchema.parse(req.params.id);

    const result = await examService.getStudentExamsResult(studentId, examId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exam result analysis fetched successfully'),
    );
});
const applyPlacement = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const placementId = examValidation.idSchema.parse(req.params.id);
    const result = await studentService.applyPlacement(studentId, placementId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement applied successfully'),
    );
});
export default {
    getExams,
    getExamById,
    submitExam,
    getExamResult,

    getStudentExamsResultAnalysis,
    applyPlacement,
};
