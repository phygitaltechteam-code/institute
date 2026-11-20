import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {feeValidation} from '@validations/index';
import {feeService} from '@services/teacher';

const collectFee = catchAsync(async (req, res) => {
    const teacherId = req.user!.teacherId as string;
    const data = feeValidation.collectFeeSchema.parse(req.body);
    const collection = await feeService.collectFee(teacherId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, collection, 'Fee collected successfully'),
    );
});

const createFeeFollowup = catchAsync(async (req, res) => {
    const teacherId = req.user!.teacherId as string;
    const data = feeValidation.createFeeFollowupSchema.parse(req.body);
    const followup = await feeService.createFeeFollowup(teacherId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, followup, 'Fee follow-up created successfully'),
    );
});

const getFeeCollections = catchAsync(async (req, res) => {
    const teacherId = req.user!.teacherId as string;
    const query = feeValidation.paginateFeesSchema.parse(req.query);
    const result = await feeService.getFeeCollections(teacherId, query);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Fee collections fetched successfully'),
    );
});

const getFeeFollowups = catchAsync(async (req, res) => {
    const teacherId = req.user!.teacherId as string;
    const query = feeValidation.paginateFeesSchema.parse(req.query);
    const result = await feeService.getFeeFollowups(teacherId, query);

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
