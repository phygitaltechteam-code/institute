import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {leadValidation} from '@validations/index';
import {leadService} from '@services/teacher';

const createLead = catchAsync(async (req, res) => {
    const data = leadValidation.createLeadSchema.parse(req.body);
    // const adminId = req.user!.adminId as string;
    const lead = await leadService.createLead(data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, lead, 'Lead created successfully'),
    );
});

const getLeads = catchAsync(async (req, res) => {
    const query = leadValidation.paginateLeadSchema.parse(req.query);
    // const adminId = req.user!.adminId as string;
    const result = await leadService.getLeads(query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Leads fetched successfully'),
    );
});

const getLeadById = catchAsync(async (req, res) => {
    const id = leadValidation.idSchema.parse(req.params.id);
    // const adminId = req.user!.adminId as string;
    const lead = await leadService.getLeadById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, lead, 'Lead fetched successfully'),
    );
});

const updateLead = catchAsync(async (req, res) => {
    const id = leadValidation.idSchema.parse(req.params.id);
    const data = leadValidation.updateLeadSchema.parse(req.body);
    // const adminId = req.user!.adminId as string;
    const updated = await leadService.updateLead(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Lead updated successfully'),
    );
});

const deleteLead = catchAsync(async (req, res) => {
    const id = leadValidation.idSchema.parse(req.params.id);
    // const adminId = req.user!.adminId as string;
    const deleted = await leadService.deleteLead(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, deleted, 'Lead deleted successfully'),
    );
});

const createLeadFollowUp = catchAsync(async (req, res) => {
    const data = leadValidation.createLeadFollowUpSchema.parse(req.body);
    const teacherId = req.user!.teacherId as string;
    // const adminId = req.user!.adminId as string;
    const result = await leadService.createLeadFollowUp(teacherId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result, 'Lead follow up created successfully'),
    );
});

const getLeadFollowUps = catchAsync(async (req, res) => {
    const query = leadValidation.paginateLeadSchema.parse(req.query);
    // const teacherId = req.user!.teacherId as string;
    const result = await leadService.getLeadFollowUps(query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Lead follow ups fetched successfully'),
    );
});

const getLeadFollowUpById = catchAsync(async (req, res) => {
    const id = leadValidation.idSchema.parse(req.params.id);
    // const teacherId = req.user!.teacherId as string;
    const result = await leadService.getLeadFollowUpById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Lead follow up fetched successfully'),
    );
});

const updateLeadFollowUp = catchAsync(async (req, res) => {
    const id = leadValidation.idSchema.parse(req.params.id);
    const data = leadValidation.updateLeadFollowUpSchema.parse(req.body);
    const teacherId = req.user!.teacherId as string;
    const result = await leadService.updateLeadFollowUp(id, teacherId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Lead follow up updated successfully'),
    );
});

const deleteLeadFollowUp = catchAsync(async (req, res) => {
    const id = leadValidation.idSchema.parse(req.params.id);
    const teacherId = req.user!.teacherId as string;
    const result = await leadService.deleteLeadFollowUp(id, teacherId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Lead follow up deleted successfully'),
    );
});

export default {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    createLeadFollowUp,
    getLeadFollowUps,
    getLeadFollowUpById,
    updateLeadFollowUp,
    deleteLeadFollowUp,
};
