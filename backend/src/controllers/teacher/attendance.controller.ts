import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {attendanceValidation} from '@validations/index';
import {attendanceService} from '@services/teacher';

const recordAttendance = catchAsync(async (req, res) => {
    const data = attendanceValidation.recordAttendanceSchema.parse(req.body);
    const teacherId = req.user!.teacherId as string;

    const attendance = await attendanceService.recordAttendance(
        teacherId,
        data.batchId,
        data.studentIds,
        data.date,
        data.totalStudents,
        data.presentStudents,
        data.absentStudents,
    );

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, attendance, 'Attendance recorded successfully'),
    );
});

const getAttendance = catchAsync(async (req, res) => {
    const batchId = attendanceValidation.idSchema.parse(req.params.batchId);
    // const query = attendanceValidation.getAttendanceQuerySchema.parse(req.query);
    const {from, to} = attendanceValidation.getAttendance.parse(req.body);
    const adminId = req.user!.adminId as string;

    const result = await attendanceService.getAttendance(
        adminId,
        batchId,
        new Date(from),
        new Date(to),
    );

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Attendance fetched successfully'),
    );
});

export default {
    recordAttendance,
    getAttendance,
};
