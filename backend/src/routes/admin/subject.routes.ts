import {Router} from 'express';
// import subjectController from './subject.controller';
// import subjectController from '../../controllers/admin/subject.controller';
import subjectController from '@controllers/admin/subject.controller';
const router = Router();

router.post('/', subjectController.createSubject);

router.get('/', subjectController.getSubjects);

router.get('/:id', subjectController.getSubjectById);

router.put('/:id', subjectController.updateSubject);

router.delete('/:id', subjectController.deleteSubject);

export default router;
