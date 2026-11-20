import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {uploadFileToHostedServer} from '@utils/s3upload1';
// import fs from 'fs';
import {assignmentValidation} from '@validations/index';
import {assignmentService} from '@services/student';

const getAssignments = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const assignments = await assignmentService.getAssignments(studentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, assignments, 'Assignments fetched successfully'),
    );
});

const getAssignmentById = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const assignmentId = assignmentValidation.idSchema.parse(req.params.assignmentId);

    const assignment = await assignmentService.getAssignmentById(studentId, assignmentId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, assignment, 'Assignment details fetched successfully'),
    );
});

const completeAssignment = catchAsync(async (req, res) => {
    const studentId = req.user!.studentId as string;
    const assignmentId = assignmentValidation.idSchema.parse(req.params.id);
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};
    let documentUrl: string | undefined;

    if (files && files.file && files.file.length > 0) {
        const pdfUpload = await uploadFileToHostedServer(files.file[0].path);
        documentUrl = pdfUpload?.link;
    }
    const result = await assignmentService.updateCompletionStatus(
        studentId,
        assignmentId,
        // completed,
        true,
        documentUrl,
    );

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Assignment marked as completed'),
    );
});

export default {
    getAssignments,
    getAssignmentById,
    completeAssignment,
};
