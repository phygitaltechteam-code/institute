import {z} from 'zod';
import {commonValidation} from '@validations/index';

const collectFeeSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    amount: z.number().positive('Amount must be positive'),
    accountId: z.string().optional().nullable(),
    // teacherId: z.string().optional().nullable(),
    pendingAmount: z.number().optional().nullable(),
});

const createFeeFollowupSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    amount: z.number().positive('Amount must be positive'),
    pendingAmount: z.number().optional().nullable(),
    notes: z.string().min(1, 'Notes are required'),
    followUpDate: z.coerce.date(),
    // teacherId: z.string().optional().nullable(),
});

const paginateFeesSchema = commonValidation.paginationAndSearchSchema.extend({
    studentId: z.string().optional(),
    teacherId: z.string().optional(),
    accountId: z.string().optional(),
});

export default {
    collectFeeSchema,
    createFeeFollowupSchema,
    paginateFeesSchema,
    idSchema: commonValidation.idSchema,
};
