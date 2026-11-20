import {z} from 'zod';
import {commonValidation} from '@validations/index';
import {Gender, graduation_type} from '@prisma/client';

// Multipart sends booleans as the strings "true"/"false"; z.coerce.boolean() would turn "false" into true
const formBool = z.preprocess((v) => v === true || v === 'true' || v === 'Yes', z.boolean());
const emptyToNull = (v: unknown) => (v === '' ? null : v);

const degreeSchema = z.object({
    score: z.string().optional().nullable(),
    course: z.string().optional().nullable(),
    passingyear: z.string().optional().nullable(),
    graduation_type: z.nativeEnum(graduation_type),
});

const savePlacementFormSchema = z.object({
    name: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone1: z.string().optional().nullable(),
    phone2: z.string().optional().nullable(),
    gender: z.preprocess(emptyToNull, z.nativeEnum(Gender).optional().nullable()),
    ssc: z.string().optional().nullable(),
    ssc_year: z.string().optional().nullable(),
    hsc: z.string().optional().nullable(),
    hsc_year: z.string().optional().nullable(),
    diploma: z.string().optional().nullable(),
    diploma_year: z.string().optional().nullable(),
    diploma_course: z.string().optional().nullable(),
    post_graduation: z.string().optional().nullable(),
    post_graduation_year: z.string().optional().nullable(),
    post_course: z.string().optional().nullable(),
    exprience: z.string().optional().nullable(),
    current_working: z.string().optional().nullable(),
    Preferred_Profiles: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    preferredLocation: z.string().optional().nullable(),
    aadharcard: z.string().optional().nullable(),
    passport: z.string().optional().nullable(),
    profile_photo: z.string().optional().nullable(),
    resume: z.string().optional().nullable(),
    isExperience: formBool.optional().default(false),
    experience_years: z.preprocess(emptyToNull, z.coerce.number().int().optional().nullable()),
    workProfile: z.string().optional().nullable(),
    companies: z.string().optional().nullable(),
    isCurrentlyWorking: formBool.optional().default(false),
    currentProfile: z.string().optional().nullable(),
    currentCompany: z.string().optional().nullable(),
    additional_education: z.array(degreeSchema).optional().nullable(),
});

const createPlacementSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    jobRole: z.string().min(1, 'Job role is required'),
    qualification: z.string().min(1, 'Qualification is required'),
    experience: z.string().min(1, 'Experience is required'),
    interviewDate: z.preprocess((val) => new Date(val as string), z.date()),
    interviewMode: z.string().min(1, 'Interview mode is required'),
    workSchedule: z.string().min(1, 'Work schedule is required'),
    salary: z.string().min(1, 'Salary is required'),
    jobDescription: z.string().optional(),
    requiredSkills: z.string().optional(),
    otherDetails: z.string().optional(),
    deadLine: z.coerce.date().optional(),
    location: z.string().optional(),
});

const updatePlacementSchema = createPlacementSchema.partial();

const paginatePlacementSchema = commonValidation.paginationAndSearchSchema.extend({
    batchId: z.string().optional(),
});

const createPlacementStudentSchema = z.object({
    placementId: z.string().min(1, 'Placement ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    teacherId: z.string().optional().nullable(),
});

const updatePlacementStudentSchema = createPlacementStudentSchema.partial();

const paginateInterviewsSchema = commonValidation.paginationAndSearchSchema.extend({
    batchId: z.string().optional(),
});
const students = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
});
const assignStudentSchema = z.object({
    students: z.array(students),
});

const scheduleInterviewSchema = z.object({
    interviewMode: z.string().min(1, 'Interview mode is required'),
    interviewDate: z.coerce.date(),
    location: z.string().optional().nullable(),
    student: z
        .array(
            z.object({
                studentId: z.string().min(1, 'Student ID is required'),
            }),
        )
        .min(1, 'At least one student is required'),
});

export default {
    createPlacementSchema,
    updatePlacementSchema,
    idSchema: commonValidation.idSchema,
    paginatePlacementSchema,
    createPlacementStudentSchema,
    updatePlacementStudentSchema,
    paginateInterviewsSchema,
    assignStudentSchema,
    scheduleInterviewSchema,
    savePlacementFormSchema,
};
