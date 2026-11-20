import {catchAsync, ApiResponse} from '@utils/index';
import {subjectService} from '@services/teacher';
import httpStatus from 'http-status';
import {subjectValidation} from '@validations/index';

const createSubject = catchAsync(async (req, res) => {
    const data = subjectValidation.createSubjectSchema.parse(req.body);
    // const teacherId = req.user?.teacherId;
    // const subject = await subjectService.createSubject(data, teacherId);
    const teacherId = req.user!.teacherId as string;

    const subject = await subjectService.createSubject(data.name, teacherId);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, subject, 'Subject created successfully'),
    );
});

// const getSubjects = catchAsync(async (req, res) => {
//     const subjects = await subjectService.getSubjects();
//     res.status(httpStatus.OK).json(
//         new ApiResponse(httpStatus.OK, subjects, 'Subjects fetched successfully'),
//     );
// });

const getSubjects = catchAsync(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm as string | undefined;

    const subjects = await subjectService.getSubjects(page, limit, searchTerm);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, subjects, 'Subjects fetched successfully'),
    );
});

const getSubjectById = catchAsync(async (req, res) => {
    const subject = await subjectService.getSubjectById(req.params.id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, subject, 'Subject fetched successfully'),
    );
});

const updateSubject = catchAsync(async (req, res) => {
    const data = subjectValidation.updateSubjectSchema.parse(req.body);
    const subject = await subjectService.updateSubject(req.params.id, data.name);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, subject, 'Subject updated successfully'),
    );
});

const deleteSubject = catchAsync(async (req, res) => {
    const subject = await subjectService.deleteSubject(req.params.id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, subject, 'Subject deleted successfully'),
    );
});

export default {
    createSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
};
