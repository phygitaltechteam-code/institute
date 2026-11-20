import {z} from 'zod';
import {commonValidation} from '@validations/index';

const createAssignmentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    remark: z.string().optional(),
    document: z.string().optional(),
    video: z.string().optional(),
    deadline: z.preprocess((val) => new Date(val as string), z.date()),
});

const updateAssignmentSchema = createAssignmentSchema.partial();

const paginateAssignmentsSchema = commonValidation.paginationAndSearchSchema;

const submitRemarkSchema = z.object({
    remark: z.string().min(1, 'Remark is required'),
});

export default {
    createAssignmentSchema,
    updateAssignmentSchema,
    idSchema: commonValidation.idSchema,
    batchIdSchema: commonValidation.idSchema,
    paginateAssignmentsSchema,
    submitRemarkSchema,
};
