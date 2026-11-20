import {z} from 'zod';
import {commonValidation} from '@validations/index';

const createCourseSchema = z.object({
    name: z.string().min(1, 'Course name is required'),
});

const updateCourseSchema = createCourseSchema.partial();

const paginateCourseSchema = commonValidation.paginationAndSearchSchema;

export default {
    createCourseSchema,
    updateCourseSchema,
    idSchema: commonValidation.idSchema,
    paginateCourseSchema,
};
