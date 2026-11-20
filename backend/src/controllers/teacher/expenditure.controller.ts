import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {expenditureValidation} from '@validations/index';
import {expenditureService} from '@services/teacher';

const createExpenditure = catchAsync(async (req, res) => {
    const data = expenditureValidation.createExpenditureSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const expenditure = await expenditureService.createExpenditure(adminId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, expenditure, 'Expenditure created successfully'),
    );
});

const getExpenditures = catchAsync(async (req, res) => {
    const query = expenditureValidation.paginateExpenditureSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await expenditureService.getExpenditures(adminId, query);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Expenditures fetched successfully'),
    );
});

const getExpenditureById = catchAsync(async (req, res) => {
    const id = expenditureValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const expenditure = await expenditureService.getExpenditureById(id, adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, expenditure, 'Expenditure fetched successfully'),
    );
});

const updateExpenditure = catchAsync(async (req, res) => {
    const id = expenditureValidation.idSchema.parse(req.params.id);
    const data = expenditureValidation.updateExpenditureSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const updated = await expenditureService.updateExpenditure(id, adminId, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Expenditure updated successfully'),
    );
});

const deleteExpenditure = catchAsync(async (req, res) => {
    const id = expenditureValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    await expenditureService.deleteExpenditure(id, adminId);

    res.status(httpStatus.NO_CONTENT).json(
        new ApiResponse(httpStatus.NO_CONTENT, undefined, 'Expenditure deleted successfully'),
    );
});

export default {
    createExpenditure,
    getExpenditures,
    getExpenditureById,
    updateExpenditure,
    deleteExpenditure,
};
