import {z} from 'zod';
import {commonValidation} from '@validations/index';
import {BatchType, Interested} from '@prisma/client';

const createLeadSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phoneNumber: commonValidation.phoneNumberSchema,
    source: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    courseId: z.string().min(1, 'Course is required'),
    pursing: z.string().optional().nullable(),
    mode: z.nativeEnum(BatchType).optional().nullable(),
    interested: z.nativeEnum(Interested).optional().nullable(),
    teacherId: z.string().optional().nullable(),
    // batchType: z.enum(['ONLINE', 'OFFLINE']).optional().nullable(),
    qualification: z.string().optional().nullable(),
    batchId: z.string().optional().nullable(),
    collegeName: z.string().optional().nullable(),
    referId: z.string().optional().nullable(),
});

const updateLeadSchema = createLeadSchema.partial();

const paginateLeadSchema = commonValidation.paginationAndSearchSchema.extend({
    status: z.enum(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'LOST']).optional(),
    courseId: z.string().optional(),
    batchId: z.string().optional(),
    teacherId: z.string().optional(),
    batchType: z.enum(['ONLINE', 'OFFLINE']).optional(),
});

const createLeadFollowUpSchema = z.object({
    leadId: z.string().min(1, 'Lead ID is required'),
    note: z.string().min(1, 'Follow up notes are required'),
    nextFollowUpDate: z
        .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
        .nullable(),
    date: z
        .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
        .nullable(),
    teacherId: z.string().optional().nullable(),
});

const updateLeadFollowUpSchema = createLeadFollowUpSchema.partial();

export default {
    createLeadSchema,
    updateLeadSchema,
    idSchema: commonValidation.idSchema,
    paginateLeadSchema,
    createLeadFollowUpSchema,
    updateLeadFollowUpSchema,
};
