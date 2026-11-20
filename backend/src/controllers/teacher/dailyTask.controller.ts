import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {dailyTaskValidation} from '@validations/index';
import {dailyTaskService} from '@services/teacher';
import {uploadFileToHostedServer} from '@utils/s3upload1';

const createDailyTask = catchAsync(async (req, res) => {
    const batchId = dailyTaskValidation.batchIdSchema.parse(req.params.batchId);
    const data = dailyTaskValidation.createDailyTaskSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};

    if (files.pdf && files.pdf?.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.pdf[0].path);
        data.document = pdfUpload?.link;
    }

    if (files.video && files.video?.length > 0) {
        const videoUpload = await uploadFileToHostedServer(files.video[0].path);
        data.video = videoUpload?.link;
    }
    const task = await dailyTaskService.createDailyTask(batchId, adminId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, task, 'Daily task created successfully'),
    );
});

const getDailyTasks = catchAsync(async (req, res) => {
    const batchId = dailyTaskValidation.batchIdSchema.parse(req.params.batchId);
    const query = dailyTaskValidation.paginateDailyTasksSchema.parse(req.query);
    const adminId = req.user!.adminId as string;

    const result = await dailyTaskService.getDailyTasks(batchId, adminId, query);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Daily tasks fetched successfully'),
    );
});

const getDailyTaskById = catchAsync(async (req, res) => {
    const id = dailyTaskValidation.idSchema.parse(req.params.taskId);
    // const adminId = req.user!.adminId as string;

    const task = await dailyTaskService.getDailyTaskById(id);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, task, 'Daily task fetched successfully'),
    );
});

const updateDailyTask = catchAsync(async (req, res) => {
    const id = dailyTaskValidation.idSchema.parse(req.params.taskId);
    const data = dailyTaskValidation.updateDailyTaskSchema.parse(req.body);
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};

    if (files.pdf && files.pdf?.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.pdf[0].path);
        data.document = pdfUpload?.link;
    }

    if (files.video && files.video?.length > 0) {
        const videoUpload = await uploadFileToHostedServer(files.video[0].path);
        data.video = videoUpload?.link;
    }
    const adminId = req.user!.adminId as string;

    const updated = await dailyTaskService.updateDailyTask(id, adminId, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Daily task updated successfully'),
    );
});

const deleteDailyTask = catchAsync(async (req, res) => {
    const id = dailyTaskValidation.idSchema.parse(req.params.taskId);
    // const adminId = req.user!.adminId as string;

    await dailyTaskService.deleteDailyTask(id);

    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Daily task deleted successfully'),
    );
});

const submitRemark = catchAsync(async (req, res) => {
    const id = dailyTaskValidation.idSchema.parse(req.params.id);
    const {remark} = dailyTaskValidation.submitRemarkSchema.parse(req.body);

    const updated = await dailyTaskService.submitRemark(id, remark);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Remark submitted successfully'),
    );
});

const getDataCompliance = catchAsync(async (req, res) => {
    const id = dailyTaskValidation.idSchema.parse(req.params.id);

    const data = await dailyTaskService.getDataCompliance(id);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, data, 'Daily task compliance fetched successfully'),
    );
});

export default {
    createDailyTask,
    getDailyTasks,
    getDailyTaskById,
    updateDailyTask,
    deleteDailyTask,
    submitRemark,
    getDataCompliance,
};
