import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {teacherValidation} from '@validations/index';
import {teacherService} from '@services/admin';
import {uploadFileToHostedServer} from '@utils/s3upload1';

const registerTeacher = catchAsync(async (req, res) => {
    const data = teacherValidation.registerTeacherSchema.parse(req.body);
    const files = (req.files as {[fieldname: string]: Express.Multer.File[]} | undefined) ?? {};

    if (files.adharcard && files.adharcard?.length > 0) {
        const aadharUpload = await uploadFileToHostedServer(files.adharcard[0].path);
        data.adharcard = aadharUpload?.link;
    }

    if (files.panproof && files.panproof?.length > 0) {
        const panUpload = await uploadFileToHostedServer(files.panproof[0].path);
        data.panproof = panUpload?.link;
    }

    if (files.addressProof && files.addressProof?.length > 0) {
        const addressUpload = await uploadFileToHostedServer(files.addressProof[0].path);
        data.addressProof = addressUpload?.link;
    }

    const adminId = req.user!.adminId as string;
    const teacher = await teacherService.registerTeacher(adminId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, teacher, 'Teacher created successfully'),
    );
});

const getTeachers = catchAsync(async (req, res) => {
    const query = teacherValidation.paginateTeachersSchema.parse(req.query);
    const teachers = await teacherService.getTeachers(query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, teachers, 'Teachers fetched successfully'),
    );
});

const getTeacherById = catchAsync(async (req, res) => {
    const id = teacherValidation.idSchema.parse(req.params.id);
    const teacher = await teacherService.getTeacherById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, teacher, 'Teacher fetched successfully'),
    );
});

const updateTeacher = catchAsync(async (req, res) => {
    const id = teacherValidation.idSchema.parse(req.params.id);
    console.log(req.body);
    const data = teacherValidation.updateTeacherSchema.parse(req.body);
    const files = (req.files as {[fieldname: string]: Express.Multer.File[]} | undefined) ?? {};

    if (files.adharcard && files.adharcard?.length > 0) {
        const aadharUpload = await uploadFileToHostedServer(files.adharcard[0].path);
        data.adharcard = aadharUpload?.link;
    }

    if (files.panproof && files.panproof?.length > 0) {
        const panUpload = await uploadFileToHostedServer(files.panproof[0].path);
        data.panproof = panUpload?.link;
    }

    if (files.addressProof && files.addressProof?.length > 0) {
        const addressUpload = await uploadFileToHostedServer(files.addressProof[0].path);
        data.addressProof = addressUpload?.link;
    }

    const updated = await teacherService.updateTeacher(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Teacher updated successfully'),
    );
});

const deleteTeacher = catchAsync(async (req, res) => {
    const id = teacherValidation.idSchema.parse(req.params.id);
    const teacher = await teacherService.deleteTeacher(id as string);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, teacher, 'Teacher deleted successfully'),
    );
});

export default {
    registerTeacher,
    getTeachers,
    getTeacherById,
    updateTeacher,
    deleteTeacher,
};
