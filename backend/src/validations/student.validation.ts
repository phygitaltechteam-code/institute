import {z} from 'zod';
import {userValidation, commonValidation} from '@validations/index';
import {password} from './custom.validation';

const studentFields = z.object({
    city: z.string(),
    state: z.string(),
    logo: z.string().optional().nullable(),
    tagLine: z.string().optional().nullable(),
    pin: z.string().optional().nullable(),
    gst: z.string().optional().nullable(),
    country: z.string(),
    pincode: z.string(),
    address: z.string(),
    adminId: z.string().optional(),
    teacherId: z.string().optional().nullable(),
    qualification: z.string().optional(),
    collegeName: z.string().optional(),
    pinCode: z.string().optional(),

    // Custom tracking fields
    // attendance: z.string().optional().nullable(),
    // totalExams: z.number().int().optional().nullable(),
    // finalExam: z.string().optional().nullable(),
    // placementForm: z.string().optional().nullable(),
    // internship: z.string().optional().nullable(),
    paidFees: z.number().optional().nullable(),
    pendingFees: z.number().optional().nullable(),
    totalFees: z.number().optional().nullable(),

    // followUpDate: z
    //     .preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
    //     .nullable(),
    // interviewsGiven: z.number().int().optional().nullable(),
    // placementReceived: z.string().optional().nullable(),
    batchId: z.string().optional().nullable(),
    courseId: z.string().optional().nullable(),
    feeOptionId: z.string(),
    referId: z.string().optional(),
    discount: z.number().optional(),
});
const registerStudentSchema = userValidation.registerUserSchema.merge(studentFields);

const updateStudentSchema = registerStudentSchema
    .omit({
        email: true,
        username: true,
        password: true,
    })
    .partial()
    // Optional: when given, the student's login password is changed
    .extend({password: password.optional()});

const paginateStudentsSchema = commonValidation.paginationAndSearchSchema.extend({
    placementReceived: z.string().optional(),
    internship: z.string().optional(),
});

const referCollect = z.object({
    accountId: z.string().nullable().optional(),
});

// Bulk import: rows are loose here and validated one by one, so a bad row never blocks the rest
const bulkStudentSchema = z.object({
    batchId: z.string().uuid('Select a batch'),
    feeOptionId: z.string().uuid('Select a fee plan'),
    defaultPassword: password.optional(),
    students: z
        .array(z.record(z.string(), z.unknown()))
        .min(1, 'The sheet has no student rows')
        .max(500, 'Import at most 500 students at a time'),
});

export default {
    registerStudentSchema,
    updateStudentSchema,
    idSchema: commonValidation.idSchema,
    paginateStudentsSchema,
    referCollect,
    bulkStudentSchema,
};
