import {z} from 'zod';
import {commonValidation} from '@validations/index';

const createAccountSchema = z.object({
    name: z.string().min(1, 'Account name is required'),
    balance: z.number().nonnegative('Balance must be a positive number or zero').default(0),
});

const updateAccountSchema = createAccountSchema.partial();

const paginateAccountSchema = commonValidation.paginationAndSearchSchema;

export default {
    createAccountSchema,
    updateAccountSchema,
    idSchema: commonValidation.idSchema,
    paginateAccountSchema,
};
