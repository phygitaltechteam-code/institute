import {Request, Response} from 'express';
import httpStatus from 'http-status';
// import subjectService from './subject.service';
import subjectService from '../../services/admin/subject.service';

class SubjectController {
    async createSubject(req: Request, res: Response) {
        const subject = await subjectService.createSubject(req.body.name);

        res.status(httpStatus.CREATED).json({
            success: true,
            data: subject,
        });
    }

    async getSubjects(req: Request, res: Response) {
        // const page = Number(req.query.page) || 1;
        // const limit = Number(req.query.limit) || 10;
        // const searchTerm = req.query.searchTerm as string;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchTerm = req.query.searchTerm as string | undefined;

        // const subjects = await subjectService.getSubjects(page, limit, searchTerm);
        const subjects = await subjectService.getSubjects(page, limit, searchTerm);
        res.status(httpStatus.OK).json({
            success: true,
            ...subjects,
        });
    }

    async getSubjectById(req: Request, res: Response) {
        const subject = await subjectService.getSubjectById(req.params.id);

        res.status(httpStatus.OK).json({
            success: true,
            data: subject,
        });
    }

    async updateSubject(req: Request, res: Response) {
        const subject = await subjectService.updateSubject(req.params.id, req.body.name);

        res.status(httpStatus.OK).json({
            success: true,
            data: subject,
        });
    }

    async deleteSubject(req: Request, res: Response) {
        await subjectService.deleteSubject(req.params.id);

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Subject deleted successfully',
        });
    }
}

export default new SubjectController();
