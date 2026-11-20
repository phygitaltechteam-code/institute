import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {examValidation} from '@validations/index';
import {examService} from '@services/teacher';

const createExam = catchAsync(async (req, res) => {
    const data = examValidation.createExamSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const exam = await examService.createExam(req.params.id, adminId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, exam, 'Exam created successfully'),
    );
});

const getExams = catchAsync(async (req, res) => {
    const query = examValidation.paginateExamsSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await examService.getExams(adminId, query);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exams fetched successfully'),
    );
});

const getExamById = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const exam = await examService.getExamById(id, adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, exam, 'Exam fetched successfully'),
    );
});

const updateExam = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    const data = examValidation.updateExamSchema.parse(req.body);
    const adminId = req.user!.adminId as string;

    const updated = await examService.updateExam(id, adminId, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Exam updated successfully'),
    );
});

const deleteExam = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;

    await examService.deleteExam(id, adminId);

    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Exam deleted successfully'),
    );
});
const assignBatch = catchAsync(async (req, res) => {
    const data = examValidation.assignExamSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const exam = await examService.assignExamToBatch(req.params.batchId, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, exam, 'Exam assigned successfully'),
    );
});
const getExamsByBatchId = catchAsync(async (req, res) => {
    const {batchId} = req.params;
    const query = examValidation.paginateExamsSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await examService.getExamsByBatchId(adminId, batchId, query);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exams fetched successfully'),
    );
});
const getExamData = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const result = await examService.getExamData(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exam data fetched successfully'),
    );
});
const updateRemark = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    const {remarks} = examValidation.updateRemarkSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const result = await examService.updateRemark(id, adminId, remarks);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exam remark updated successfully'),
    );
});
const resultAnalysis = catchAsync(async (req, res) => {
    const id = examValidation.idSchema.parse(req.params.id);
    // const adminId = req.user!.adminId as string;
    const studentId = examValidation.idSchema.parse(req.params.studentId);
    const result = await examService.getStudentExamsResult(studentId, id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Exam result analysis fetched successfully'),
    );
});

export default {
    createExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam,
    assignBatch,
    getExamsByBatchId,
    getExamData,
    resultAnalysis,
    updateRemark,
};
