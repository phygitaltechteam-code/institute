import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {courseValidation} from '@validations/index';
import {courseService} from '@services/admin';

const createCourse = catchAsync(async (req, res) => {
    const data = courseValidation.createCourseSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const course = await courseService.createCourse(adminId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, course, 'Course created successfully'),
    );
});

const getCourses = catchAsync(async (req, res) => {
    const query = courseValidation.paginateCourseSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await courseService.getCourses(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Courses fetched successfully'),
    );
});

const getCourseById = catchAsync(async (req, res) => {
    const id = courseValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const course = await courseService.getCourseById(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, course, 'Course fetched successfully'),
    );
});

const updateCourse = catchAsync(async (req, res) => {
    const id = courseValidation.idSchema.parse(req.params.id);
    const data = courseValidation.updateCourseSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const updated = await courseService.updateCourse(id, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Course updated successfully'),
    );
});

const deleteCourse = catchAsync(async (req, res) => {
    const id = courseValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    await courseService.deleteCourse(id, adminId);
    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Course deleted successfully'),
    );
});

export default {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
};
