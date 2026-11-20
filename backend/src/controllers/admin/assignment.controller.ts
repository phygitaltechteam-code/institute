import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {assignmentValidation} from '@validations/index';
import {assignmentService} from '@services/admin';
import {uploadFileToHostedServer} from '@utils/s3upload1';

const createAssignment = catchAsync(async (req, res) => {
    const batchId = assignmentValidation.batchIdSchema.parse(req.params.batchId);
    console.log(req.files);
    const data = assignmentValidation.createAssignmentSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};

    if (files && files.pdf && files.pdf.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.pdf[0].path);
        data.document = pdfUpload?.link;
    }

    if (files && files.video && files.video.length > 0) {
        const videoUpload = await uploadFileToHostedServer(files.video[0].path);
        data.video = videoUpload?.link;
    }

    const assignment = await assignmentService.createAssignment(batchId, adminId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, assignment, 'Assignment created successfully'),
    );
});

const getAssignments = catchAsync(async (req, res) => {
    const batchId = assignmentValidation.batchIdSchema.parse(req.params.batchId);
    const query = assignmentValidation.paginateAssignmentsSchema.parse(req.query);
    const adminId = req.user!.adminId as string;

    const result = await assignmentService.getAssignments(batchId, adminId, query);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Assignments fetched successfully'),
    );
});

const getAssignmentById = catchAsync(async (req, res) => {
    const id = assignmentValidation.idSchema.parse(req.params.assignmentId);
    const adminId = req.user!.adminId as string;

    const assignment = await assignmentService.getAssignmentById(id, adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, assignment, 'Assignment fetched successfully'),
    );
});

const updateAssignment = catchAsync(async (req, res) => {
    const id = assignmentValidation.idSchema.parse(req.params.assignmentId);
    const data = assignmentValidation.updateAssignmentSchema.parse(req.body);
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};

    if (files && files.pdf && files.pdf.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.pdf[0].path);
        data.document = pdfUpload?.link;
    }

    if (files && files.video && files.video.length > 0) {
        const videoUpload = await uploadFileToHostedServer(files.video[0].path);
        data.video = videoUpload?.link;
    }
    const adminId = req.user!.adminId as string;

    const updated = await assignmentService.updateAssignment(id, adminId, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Assignment updated successfully'),
    );
});

const deleteAssignment = catchAsync(async (req, res) => {
    const id = assignmentValidation.idSchema.parse(req.params.assignmentId);
    const adminId = req.user!.adminId as string;

    await assignmentService.deleteAssignment(id, adminId);

    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Assignment deleted successfully'),
    );
});

const submitRemark = catchAsync(async (req, res) => {
    const id = assignmentValidation.idSchema.parse(req.params.id);
    const {remark} = assignmentValidation.submitRemarkSchema.parse(req.body);

    const updated = await assignmentService.submitRemark(id, remark);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Remark submitted successfully'),
    );
});

const getDataCompliance = catchAsync(async (req, res) => {
    const id = assignmentValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;

    const data = await assignmentService.getDataCompliance(id, adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, data, 'Assignment compliance fetched successfully'),
    );
});

export default {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    submitRemark,
    getDataCompliance,
};
