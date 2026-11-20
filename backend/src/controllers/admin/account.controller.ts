import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {accountValidation} from '@validations/index';
import {accountService} from '@services/admin';

const createAccount = catchAsync(async (req, res) => {
    const data = accountValidation.createAccountSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const account = await accountService.createAccount(adminId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, account, 'Account created successfully'),
    );
});

const getAccounts = catchAsync(async (req, res) => {
    const query = accountValidation.paginateAccountSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await accountService.getAccounts(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Accounts fetched successfully'),
    );
});

const getAccountById = catchAsync(async (req, res) => {
    const id = accountValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const account = await accountService.getAccountById(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, account, 'Account fetched successfully'),
    );
});

const updateAccount = catchAsync(async (req, res) => {
    const id = accountValidation.idSchema.parse(req.params.id);
    const data = accountValidation.updateAccountSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const updated = await accountService.updateAccount(id, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Account updated successfully'),
    );
});

const deleteAccount = catchAsync(async (req, res) => {
    const id = accountValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const deleted = await accountService.deleteAccount(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, deleted, 'Account deleted successfully'),
    );
});

export default {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
};
