import dayjs from 'dayjs';
import {z} from 'zod';

const idSchema = z.string();
const nameSchema = z.string().min(1, 'Name is required.');
const tokenSchema = z.string().min(1, 'Token is required for authentication');
const refreshTokenSchema = z.string().optional();
const phoneNumberSchema = z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number format')
    .length(10, 'Phone number must be exactly 10 digits');
const paginationSchema = z.object({
    page: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1, {message: 'Page must be greater than 0'})
        .default('1'),
    limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1, {message: 'Limit must be greater than 0'})
        .default('1000'),
});

const searchSchema = z.object({
    searchTerm: z.string().optional().default(''),
});

const paginationAndSearchSchema = paginationSchema.merge(searchSchema);
const adminIdSchema = z.object({
    adminId: idSchema,
});
const shopIdAndAdminIdSchema = z.object({
    shopId: idSchema,
    adminId: idSchema,
});
const workerIdSchema = z.object({
    workerId: idSchema,
});

const qrDesignSchema = z.object({
    image: z.string().optional(),
    color: z.string(),
    textColour: z.string(),
    fontFamily: z.string(),
});

const dateValidation = z.object({
    date: z.string().default(() => dayjs().format('YYYY-MM-DD')),
});

const dateRangeValidation = z.object({
    startDate: z.string().default(() => dayjs().startOf('month').format('YYYY-MM-DD')),
    endDate: z.string().default(() => dayjs().endOf('month').format('YYYY-MM-DD')),
    metalType: z.string().optional().default('ALL'),
    searchTerm: z.string().optional(),
});

const fromToDateValidation = z.object({
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
});

export default {
    idSchema,
    nameSchema,
    tokenSchema,
    paginationSchema,
    phoneNumberSchema,
    searchSchema,
    paginationAndSearchSchema,
    refreshTokenSchema,
    adminIdSchema,
    shopIdAndAdminIdSchema,
    workerIdSchema,
    qrDesignSchema,
    dateValidation,
    dateRangeValidation,
    fromToDateValidation,
};
