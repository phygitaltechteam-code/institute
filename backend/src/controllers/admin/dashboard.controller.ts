import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {dashboardService} from '@services/admin';

const getDashboard = catchAsync(async (req, res) => {
    const adminId = req.user!.adminId as string;
    const data = await dashboardService.getDashboard(adminId);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, data, 'Dashboard fetched successfully'));
});

export default {getDashboard};
