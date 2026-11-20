import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {uploadFileToHostedServer} from '@utils/s3upload1';
// import fs from 'fs';
// import {dailyTaskValidation} from '@validations/index';
import {studentService} from '@services/student';
import {leadValidation, placementValidation} from '@validations/index';

const getDailyTasks = catchAsync(async (req, res) => {
    // const batchId = dailyTaskValidation.batchIdSchema.parse(req.params.batchId);
    const studentId = req.user!.studentId as string;

    const tasks = await studentService.getDailyTasks(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, tasks, 'Daily tasks fetched successfully'),
    );
});

const getPlacementTasks = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;

    const tasks = await studentService.getPlacementTasks(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, tasks, 'Placement tasks fetched successfully'),
    );
});
const getInterviews = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;

    const interviews = await studentService.getInterview(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, interviews, 'Interviews fetched successfully'),
    );
});

const getStats = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;

    const stats = await studentService.getStats(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, stats, 'Student stats fetched successfully'),
    );
});

const updateInterviewStatus = catchAsync(async (req, res) => {
    // console.log(req.body);
    const studentId = req.user!.studentId as string;
    const {interviewId} = req.params;
    const {status} = req.body;
    console.log(status);

    const updatedInterview = await studentService.updateInterviewStatus(
        interviewId,
        studentId,
        status,
    );

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updatedInterview, 'Interview status updated successfully'),
    );
});

const savePlacementForm = catchAsync(async (req, res) => {
    // console.log(req.body);
    const studentId = req.user!.studentId as string;
    const data = placementValidation.savePlacementFormSchema.parse(req.body);
    // No entries sent = the student removed them all, so clear the saved ones too
    data.additional_education = data.additional_education ?? [];
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};

    if (files && files.resume && files.resume.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.resume[0].path);
        data.resume = pdfUpload?.link;
    }

    if (files && files.aadharcard && files.aadharcard.length > 0) {
        const videoUpload = await uploadFileToHostedServer(files.aadharcard[0].path);
        data.aadharcard = videoUpload?.link;
    }

    if (files && files.profile_photo && files.profile_photo.length > 0) {
        const videoUpload = await uploadFileToHostedServer(files.profile_photo[0].path);
        data.profile_photo = videoUpload?.link;
    }
    console.log('sss', studentId);
    const form = await studentService.upsertPlacementForm(studentId, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, form, 'Placement form saved successfully'),
    );
});

const getPlacementForm = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const form = await studentService.getPlacementForm(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, form, 'Placement form fetched successfully'),
    );
});

const completeDailyTask = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const taskId = req.params.id as string;
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};
    let documentUrl: string | undefined;

    if (files && files.file && files.file.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.file[0].path);
        documentUrl = pdfUpload?.link;
    }

    const result = await studentService.completeDailyTask(studentId, taskId, documentUrl);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Daily task marked as completed successfully'),
    );
});

const getStudentById = catchAsync(async (req, res) => {
    const studentId = req.user?.studentId as string;
    const student = await studentService.getStudentById(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, student, 'Student fetched successfully'),
    );
});

const createLead = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;

    const data = leadValidation.createLeadSchema.parse(req.body);

    const lead = await studentService.createLead(studentId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, lead, 'Lead created successfully'),
    );
});
const getLead = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;

    const leads = await studentService.getreferedLead(studentId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, leads, 'Leads fetched successfully'),
    );
});
export default {
    getDailyTasks,
    getPlacementTasks,
    getLead,
    getInterviews,
    getStats,
    updateInterviewStatus,
    savePlacementForm,
    getPlacementForm,
    completeDailyTask,
    getStudentById,
    createLead,
};
