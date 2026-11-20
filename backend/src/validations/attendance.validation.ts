import {z} from 'zod';
import {commonValidation} from '@validations/index';

const recordAttendanceSchema = z.object({
    batchId: z.string().min(1, 'Batch ID is required'),
    studentIds: z.array(z.string()).min(0),
    totalStudents: z.number().min(0),
    presentStudents: z.number().min(0),
    absentStudents: z.number().min(0),
    date: z.preprocess((val) => new Date(val as string), z.date()).optional(),
});

const getAttendanceQuerySchema = z.object({
    date: z.string().optional(),
});
const getAttendance = z.object({
    from: z.string().min(1, 'From date is required'),
    to: z.string().min(1, 'To date is required'),
});

export default {
    recordAttendanceSchema,
    getAttendanceQuerySchema,
    getAttendance,
    idSchema: commonValidation.idSchema,
};
