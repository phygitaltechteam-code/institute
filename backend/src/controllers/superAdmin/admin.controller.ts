import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {adminValidation} from '@validations/index';
import {adminService} from '@services/superAdmin/index';

const registerAdmin = catchAsync(async (req, res) => {
    const parsedData = adminValidation.registerAdminSchema.parse(req.body);
    const newAdmin = await adminService.registerAdmin(parsedData);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, newAdmin, 'Admin registered successfully'),
    );
});

const getAdmins = catchAsync(async (req, res) => {
    const {page, limit, searchTerm} = adminValidation.paginateAdminsSchema.parse(req.query);
    const caterors = await adminService.getAdmins({page, limit, searchTerm});
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, caterors, 'Admins retrieved successfully'),
    );
});

const getAdminById = catchAsync(async (req, res) => {
    const id = adminValidation.idSchema.parse(req.params.id);
    const cateror = await adminService.getAdminById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, cateror, 'Admin retrieved successfully'),
    );
});

const updateAdmin = catchAsync(async (req, res) => {
    const id = adminValidation.idSchema.parse(req.params.id);
    const data = adminValidation.editAdminSchema.parse(req.body);
    const updatedAdmin = await adminService.updateAdmin(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updatedAdmin, 'Admin updated successfully'),
    );
});

const deleteAdmin = catchAsync(async (req, res) => {
    const id = adminValidation.idSchema.parse(req.params.id);
    await adminService.deleteAdmin(id);
    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Admin deleted successfully'),
    );
});

const deleteAdminData = catchAsync(async (req, res) => {
    const id = adminValidation.idSchema.parse(req.params.id);
    await adminService.deleteAdmin(id);
    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Admin data deleted successfully'),
    );
});

export default {
    registerAdmin,
    getAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    deleteAdminData,
};
