import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {feeValidation} from '@validations/index';
import {feeService} from '@services/admin';

const collectFee = catchAsync(async (req, res) => {
    const data = feeValidation.collectFeeSchema.parse(req.body);
    const collection = await feeService.collectFee(data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, collection, 'Fee collected successfully'),
    );
});

const createFeeFollowup = catchAsync(async (req, res) => {
    const data = feeValidation.createFeeFollowupSchema.parse(req.body);
    console.log(data);
    const followup = await feeService.createFeeFollowup(data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, followup, 'Fee follow-up created successfully'),
    );
});

const getFeeCollections = catchAsync(async (req, res) => {
    const query = feeValidation.paginateFeesSchema.parse(req.query);
    const result = await feeService.getFeeCollections(query, req.user!.adminId as string);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Fee collections fetched successfully'),
    );
});

const getFeeFollowups = catchAsync(async (req, res) => {
    const query = feeValidation.paginateFeesSchema.parse(req.query);
    const result = await feeService.getFeeFollowups(query, req.user!.adminId as string);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Fee follow-ups fetched successfully'),
    );
});

export default {
    collectFee,
    createFeeFollowup,
    getFeeCollections,
    getFeeFollowups,
};
