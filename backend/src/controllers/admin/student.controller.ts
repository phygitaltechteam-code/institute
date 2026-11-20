import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {studentValidation} from '@validations/index';
import {studentService} from '@services/admin';

const registerStudent = catchAsync(async (req, res) => {
    const data = studentValidation.registerStudentSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const teacherId = data.teacherId;
    const student = await studentService.registerStudent(adminId, data, teacherId);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, student, 'Student registered successfully'),
    );
});

const getStudents = catchAsync(async (req, res) => {
    const query = studentValidation.paginateStudentsSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await studentService.getStudents(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Students fetched successfully'),
    );
});

const getStudentById = catchAsync(async (req, res) => {
    const id = studentValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const student = await studentService.getStudentById(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, student, 'Student fetched successfully'),
    );
});

const updateStudent = catchAsync(async (req, res) => {
    const id = studentValidation.idSchema.parse(req.params.id);
    const data = studentValidation.updateStudentSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const updated = await studentService.updateStudent(id, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Student updated successfully'),
    );
});

const deleteStudent = catchAsync(async (req, res) => {
    const id = studentValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const deleted = await studentService.deleteStudent(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, deleted, 'Student deleted successfully'),
    );
});

const collectReferal = catchAsync(async (req, res) => {
    console.log(req.body);
    const id = studentValidation.idSchema.parse(req.params.id);
    // const data = studentValidation.collectReferal.parse(req.body);
    const data = studentValidation.referCollect.parse(req.body);
    const result = await studentService.collectReferal(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Referal collected successfully'),
    );
});

const bulkRegisterStudents = catchAsync(async (req, res) => {
    const data = studentValidation.bulkStudentSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const result = await studentService.bulkRegisterStudents(adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            result,
            `${result.created.length} of ${result.total} students imported`,
        ),
    );
});

// const getStudentsPlacementForm = catchAsync(async (req, res) => {

export default {
    registerStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    collectReferal,
    bulkRegisterStudents,
};
