import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {accountValidation} from '@validations/index';
import {accountService} from '@services/teacher';

const getAccounts = catchAsync(async (req, res) => {
    const query = accountValidation.paginateAccountSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await accountService.getAccounts(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Accounts fetched successfully'),
    );
});

export default {
    getAccounts,
};
