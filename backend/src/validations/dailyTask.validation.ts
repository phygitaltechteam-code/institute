import {z} from 'zod';
import {commonValidation} from '@validations/index';

const createDailyTaskSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    task: z.string().min(1, 'Task is required'),
    document: z.string().optional(),
    video: z.string().optional(),
    date: z.preprocess((val) => new Date(val as string), z.date()),
});

const updateDailyTaskSchema = createDailyTaskSchema.partial();

const paginateDailyTasksSchema = commonValidation.paginationAndSearchSchema;

const submitRemarkSchema = z.object({
    remark: z.string().min(1, 'Remark is required'),
});

export default {
    createDailyTaskSchema,
    updateDailyTaskSchema,
    idSchema: commonValidation.idSchema,
    batchIdSchema: commonValidation.idSchema,
    paginateDailyTasksSchema,
    submitRemarkSchema,
};
