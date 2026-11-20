import {z} from 'zod';
import {userValidation, commonValidation} from '@validations/index';

const teacherFields = z.object({
    subject: z.string().optional().nullable(),
    salary: z.coerce.number().optional().nullable(),
    adharcard: z.string().optional().nullable(),
    addressProof: z.string().optional().nullable(),
    panproof: z.string().optional().nullable(),
    emergencyContact: z.string().optional().nullable(),
    Relationship: z.string().optional().nullable(),
    emergencyContactNumber: z.string().optional().nullable(),
    address: z.string(),
});
const registerTeacherSchema = userValidation.registerUserSchema.merge(teacherFields);

const updateTeacherSchema = registerTeacherSchema
    .omit({
        email: true,
        username: true,
        password: true,
    })
    .partial();

const paginateTeachersSchema = commonValidation.paginationAndSearchSchema;

export default {
    registerTeacherSchema,
    updateTeacherSchema,
    idSchema: commonValidation.idSchema,
    paginateTeachersSchema,
};
