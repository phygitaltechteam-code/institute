import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {courseService} from '@services/admin';
import {leadValidation} from '@validations/index';
import {leadService} from '@services/admin/index';
import studentService from '@services/student/student.service';

const getAllCourses = catchAsync(async (req, res) => {
    const courses = await courseService.getAllCourses();
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, courses, 'Courses fetched successfully'),
    );
});
const createLead = catchAsync(async (req, res) => {
    const data = leadValidation.createLeadSchema.parse(req.body);
    const lead = await leadService.createLead(data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, lead, 'Lead created successfully'),
    );
});
const createuserNameUniwque = catchAsync(async (req, res) => {
    const username = await studentService.createuserNameUniwque();
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, username, 'Username created successfully'),
    );
});
export default {
    getAllCourses,
    createLead,
    createuserNameUniwque,
};
