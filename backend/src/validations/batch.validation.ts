import {z} from 'zod';
import {commonValidation} from '@validations/index';
import {BatchType} from '@prisma/client';

const teachingDaysSchema = z.object({
    monday: z.boolean().default(false),
    tuesday: z.boolean().default(false),
    wednesday: z.boolean().default(false),
    thursday: z.boolean().default(false),
    friday: z.boolean().default(false),
    saturday: z.boolean().default(false),
    sunday: z.boolean().default(false),
});

const feeInstallmentSchema = z.object({
    name: z.string().min(1, 'Installment name is required'),
    amount: z.number().min(0, 'Installment amount must be non-negative'),
});

const feeOptionSchema = z.object({
    name: z.string().min(1, 'Fee option name is required'),
    feeInstallments: z.array(feeInstallmentSchema).min(1, 'At least one installment is required'),
});

const createBatchSchema = z.object({
    name: z.string().min(1, 'Batch name is required'),
    courseId: z.string().uuid('Invalid Course ID'),
    batchType: z.nativeEnum(BatchType),
    teacherId: z.string().uuid('Invalid Teacher ID'),
    startDate: z.preprocess((val) => new Date(val as string), z.date()),
    endDate: z.preprocess((val) => new Date(val as string), z.date()),
    startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Invalid start time format')
        .min(1, 'Start time is required'),
    endTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Invalid end time format')
        .min(1, 'End time is required'),
    type: z.nativeEnum(BatchType),
    totalDays: z.number().int().min(1),
    educationalDays: z.number().int().min(1),
    teachingDays: teachingDaysSchema,
    feeOptions: z.array(feeOptionSchema).min(1, 'At least one fee option is required'),
    referalBonus: z.number().int().min(1),
});

const updateBatchSchema = z
    .object({
        name: z.string().min(1).optional(),
        courseId: z.string().uuid().optional(),
        batchType: z.nativeEnum(BatchType).optional(),
        teacherId: z.string().uuid().optional(),
        startDate: z.preprocess((val) => new Date(val as string), z.date()).optional(),
        endDate: z.preprocess((val) => new Date(val as string), z.date()).optional(),
        type: z.nativeEnum(BatchType).optional(),
        totalDays: z.number().int().min(1).optional(),
        educationalDays: z.number().int().min(1).optional(),
        teachingDays: teachingDaysSchema.partial().optional(),
        referalBonus: z.number().int().min(1).optional(),
        feeOptions: z
            .array(
                feeOptionSchema.extend({
                    id: z.string().uuid().optional(),
                    feeInstallments: z
                        .array(
                            feeInstallmentSchema.extend({
                                id: z.string().uuid().optional(),
                            }),
                        )
                        .optional(),
                }),
            )
            .optional(),
    })
    .partial();
const studentCertificate = z.object({
    issueDate: z.string(),
    grade: z.string(),
    duration: z.string(),
});
const paginateBatchesSchema = commonValidation.paginationAndSearchSchema;

export default {
    createBatchSchema,
    updateBatchSchema,
    idSchema: commonValidation.idSchema,
    paginateBatchesSchema,
    studentCertificate,
};
