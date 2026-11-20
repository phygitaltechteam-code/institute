import httpStatus from 'http-status';
import {catchAsync, ApiResponse} from '@utils/index';
import {placementValidation} from '@validations/index';
import {placementService} from '@services/admin';

const createPlacement = catchAsync(async (req, res) => {
    const data = placementValidation.createPlacementSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const placement = await placementService.createPlacement(adminId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, placement, 'Placement created successfully'),
    );
});

const getPlacements = catchAsync(async (req, res) => {
    const query = placementValidation.paginatePlacementSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await placementService.getPlacements(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placements fetched successfully'),
    );
});

const getPlacementById = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const placement = await placementService.getPlacementById(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, placement, 'Placement fetched successfully'),
    );
});

const updatePlacement = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const data = placementValidation.updatePlacementSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const updated = await placementService.updatePlacement(id, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, updated, 'Placement updated successfully'),
    );
});

const deletePlacement = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const deleted = await placementService.deletePlacement(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, deleted, 'Placement deleted successfully'),
    );
});

const createPlacementStudent = catchAsync(async (req, res) => {
    const data = placementValidation.createPlacementStudentSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const result = await placementService.createPlacementStudent(adminId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(
            httpStatus.CREATED,
            result,
            'Placement student relation created successfully',
        ),
    );
});

const getPlacementStudents = catchAsync(async (req, res) => {
    const query = placementValidation.paginatePlacementSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await placementService.getPlacementStudents(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement student relations fetched successfully'),
    );
});

const getPlacementStudentById = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const result = await placementService.getPlacementStudentById(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement student relation fetched successfully'),
    );
});

const updatePlacementStudent = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const data = placementValidation.updatePlacementStudentSchema.parse(req.body);
    const adminId = req.user!.adminId as string;
    const result = await placementService.updatePlacementStudent(id, adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement student relation updated successfully'),
    );
});

const deletePlacementStudent = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const adminId = req.user!.adminId as string;
    const result = await placementService.deletePlacementStudent(id, adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement student relation deleted successfully'),
    );
});

const getInterviews = catchAsync(async (req, res) => {
    const query = placementValidation.paginateInterviewsSchema.parse(req.query);
    const adminId = req.user!.adminId as string;
    const result = await placementService.getInterviews(adminId, query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Interviews fetched successfully'),
    );
});
const assignStudents = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const data = placementValidation.assignStudentSchema.parse(req.body);
    // const teacherId = req.user!.teacherId as string;`
    const result = await placementService.assignStudents(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement student relation updated successfully'),
    );
});
const getAssignedPlacement = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const result = await placementService.getAssignedPlacement(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement student relation updated successfully'),
    );
});

const scheduleInterview = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    const data = placementValidation.scheduleInterviewSchema.parse(req.body);
    const result = await placementService.scheduleInterview(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Interview scheduled successfully'),
    );
});
const getInterviewStudent = catchAsync(async (req, res) => {
    const id = placementValidation.idSchema.parse(req.params.id);
    // const teacherId = req.user!.teacherId as string;
    const result = await placementService.getInterviewStudent(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Placement interviews fetched successfully'),
    );
});

export default {
    createPlacement,
    getPlacements,
    getPlacementById,
    updatePlacement,
    deletePlacement,
    createPlacementStudent,
    getPlacementStudents,
    getPlacementStudentById,
    updatePlacementStudent,
    assignStudents,
    deletePlacementStudent,
    getInterviews,
    getAssignedPlacement,
    scheduleInterview,
    getInterviewStudent,
};
