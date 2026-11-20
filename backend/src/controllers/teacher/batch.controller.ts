import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {batchValidation} from '@validations/index';
import {batchService} from '@services/teacher';
import {uploadFileToHostedServer} from '@utils/s3upload1';

const createBatch = catchAsync(async (req, res) => {
    // console.log('Batch Creation issue.', req.body);
    const data = batchValidation.createBatchSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const teacherId = req.user?.teacherId as string;
    const batch = await batchService.createBatch(adminId, data, teacherId);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, batch, 'Batch created successfully'),
    );
});

const getBatches = catchAsync(async (req, res) => {
    const query = batchValidation.paginateBatchesSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const teacherId = req.user?.teacherId as string;
    const result = await batchService.getBatches(adminId, query, teacherId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Batches fetched successfully'),
    );
});

const getBatchById = catchAsync(async (req, res) => {
    const id = batchValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const batch = await batchService.getBatchById(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, batch, 'Batch fetched successfully'),
    );
});
const getStudents = catchAsync(async (req, res) => {
    const id = batchValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const batch = await batchService.getStudents(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, batch, 'Batch fetched successfully'),
    );
});
const updateBatch = catchAsync(async (req, res) => {
    const id = batchValidation.idSchema.parse(req.params.id);
    const data = batchValidation.updateBatchSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const updated = await batchService.updateBatch(id, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Batch updated successfully'),
    );
});

const deleteBatch = catchAsync(async (req, res) => {
    const id = batchValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const deleted = await batchService.deleteBatch(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, deleted, 'Batch deleted successfully'),
    );
});

const getReferedStudent = catchAsync(async (req, res) => {
    const id = batchValidation.idSchema.parse(req.params.id);
    const result = await batchService.getReferedStudent(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Referred students fetched successfully'),
    );
});
const updateStudentCertificate = catchAsync(async (req, res) => {
    const id = batchValidation.idSchema.parse(req.params.id);
    console.log(req.file);
    const data = batchValidation.studentCertificate.parse(req.body);
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};
    let url = '';
    const uploadedFile = files?.pdf?.[0] || files?.file?.[0];
    if (uploadedFile) {
        const pdfUpload = await uploadFileToHostedServer(uploadedFile.path);
        url = pdfUpload?.link || '';
    }

    const updated = await batchService.updateStudentCertificate(id, data, url);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Batch updated successfully'),
    );
});

export default {
    createBatch,
    getBatches,
    getBatchById,
    updateBatch,
    deleteBatch,
    getStudents,
    getReferedStudent,
    updateStudentCertificate,
};
