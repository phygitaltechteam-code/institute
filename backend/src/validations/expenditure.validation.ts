import {z} from 'zod';
import {commonValidation} from '@validations/index';

const createExpenditureSchema = z.object({
    title: z.string().min(1, 'Expenditure title is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    // category: z.string().min(1, 'Category is required'),
    date: z.coerce.date(),
    description: z.string().optional(),
    accountId: z.string().optional(),
});

const updateExpenditureSchema = createExpenditureSchema.partial();

const paginateExpenditureSchema = commonValidation.paginationAndSearchSchema;

export default {
    createExpenditureSchema,
    updateExpenditureSchema,
    idSchema: commonValidation.idSchema,
    paginateExpenditureSchema,
};
