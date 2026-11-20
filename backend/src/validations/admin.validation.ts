import {z} from 'zod';
import {userValidation, commonValidation} from '@validations/index';

const adminFields = z.object({
    city: z.string(),
    state: z.string(),
    logo: z.string().optional().nullable(),
    tagLine: z.string().optional().nullable(),
    pin: z.string().optional().nullable(),
    gst: z.string().optional().nullable(),
    country: z.string(),
    pincode: z.string(),
    address: z.string(),
    adminId: z.string(),
});
const registerAdminSchema = userValidation.registerUserSchema.merge(adminFields);

const updateAdminSchema = registerAdminSchema
    .omit({
        email: true,
        username: true,
        password: true,
    })
    .partial();

/** Super-admin "Edit admin": every field optional; empty password keeps the current one. */
const optTrim = z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const editAdminSchema = z.object({
    fullname: z.string().trim().min(2, 'Name is required').optional(),
    username: z.string().trim().min(3, 'At least 3 characters').optional(),
    email: z.string().trim().email('Invalid email').optional(),
    phoneNumber: z
        .string()
        .trim()
        .regex(/^[0-9+ -]{7,16}$/, 'Enter a valid phone number')
        .optional(),
    password: z
        .string()
        .optional()
        .nullable()
        .transform((v) => v || null)
        .refine((v) => v === null || v.length >= 6, 'At least 6 characters'),
    isActive: z.boolean().optional(),
    adminId: z.string().trim().min(1, 'Institute ID is required').optional(),
    address: z.string().trim().min(1, 'Address is required').optional(),
    city: z.string().trim().min(1, 'City is required').optional(),
    state: z.string().trim().min(1, 'State is required').optional(),
    country: z.string().trim().min(1, 'Country is required').optional(),
    pincode: z.string().trim().min(1, 'Pincode is required').optional(),
    gst: optTrim,
    tagLine: optTrim,
});

const paginateAdminsSchema = commonValidation.paginationAndSearchSchema;
const quotationDesignSchema = z.object({
    color: z.string(),
    image: z.string().optional(),
});
export const reviewSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    role: z.string().optional(),
});

export const addWebdata = z.object({
    description: z.string().optional(),
    ExperienceDescription: z.string().optional(),
    color: z.string().optional(),
    reviews: z.array(reviewSchema).optional(),
});

export default {
    registerAdminSchema,
    updateAdminSchema,
    editAdminSchema,
    idSchema: commonValidation.idSchema,
    paginateAdminsSchema,
    quotationDesignSchema,
    addWebdata,
};
