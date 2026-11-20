import {z} from 'zod';

/** Empty strings from forms become undefined/null so optional fields really are optional. */
const optText = z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const optId = optText;
const optNumber = z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))
    .refine((v) => v === null || !Number.isNaN(v), 'Must be a number');
const optDate = z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null))
    .refine((v) => v === null || !Number.isNaN(v.getTime()), 'Invalid date');
const money = z.coerce.number().min(0, 'Cannot be negative');

export const categorySchema = z.object({name: z.string().trim().min(1, 'Name is required').max(80)});

export const courseSchema = z
    .object({
        name: z.string().trim().min(2, 'Course name is required').max(150),
        categoryId: optId,
        shortDescription: optText,
        description: optText,
        thumbnail: optText,
        price: money,
        discountPrice: optNumber,
        level: optText,
        language: optText,
        validityDays: optNumber,
        status: z.enum(['DRAFT', 'PUBLIC', 'PRIVATE']).default('DRAFT'),
        allowDownload: z.boolean().default(false),
        faqs: z
            .array(z.object({question: z.string().trim().min(1), answer: z.string().trim().min(1)}))
            .default([]),
    })
    .refine((d) => d.discountPrice === null || d.discountPrice <= d.price, {
        message: 'Offer price cannot be more than the price',
        path: ['discountPrice'],
    });

export const sectionSchema = z.object({
    courseId: z.string().min(1),
    title: z.string().trim().min(1, 'Section title is required').max(150),
});
export const sectionUpdateSchema = z.object({title: z.string().trim().min(1).max(150)});

export const lessonSchema = z.object({
    sectionId: z.string().min(1),
    title: z.string().trim().min(1, 'Lesson title is required').max(150),
    description: optText,
    videoUrl: optText,
    durationMinutes: optNumber,
    isPreview: z.boolean().default(false),
});
export const lessonUpdateSchema = lessonSchema.omit({sectionId: true}).partial();

export const reorderSchema = z.object({ids: z.array(z.string()).min(1)});

export const resourceSchema = z.object({
    name: z.string().trim().min(1).max(150),
    fileUrl: z.string().min(1),
    fileType: z.string().default('file'),
    sizeBytes: z.coerce.number().int().min(0).default(0),
});

export const replySchema = z.object({message: z.string().trim().min(1, 'Reply cannot be empty')});

export const popularSchema = z.object({courseIds: z.array(z.string()).max(20)});

export const bundleSchema = z
    .object({
        name: z.string().trim().min(2).max(150),
        description: optText,
        thumbnail: optText,
        price: money,
        discountPrice: optNumber,
        isActive: z.boolean().default(true),
        courseIds: z.array(z.string()).min(1, 'Pick at least one course'),
        faqs: z
            .array(z.object({question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(3000)}))
            .max(30)
            .default([]),
    })
    .refine((d) => d.discountPrice === null || d.discountPrice <= d.price, {
        message: 'Offer price cannot be more than the price',
        path: ['discountPrice'],
    });

export const liveClassSchema = z.object({
    title: z.string().trim().min(2).max(150),
    courseId: optId,
    description: optText,
    meetingUrl: z.string().trim().url('Enter a valid meeting link'),
    scheduledAt: z.coerce.date(),
    durationMinutes: z.coerce.number().int().min(5).max(600).default(60),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
    recordingUrl: optText,
});

export const enrollmentSchema = z
    .object({
        studentIds: z.array(z.string()).min(1, 'Select at least one student'),
        courseId: optId,
        bundleId: optId,
        paymentMode: z.enum(['FREE', 'CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE']),
        amountPaid: optNumber,
        couponCode: optText,
        partnerId: optId,
        paymentRef: optText,
        note: optText,
        expiresAt: optDate,
    })
    .refine((d) => !!d.courseId !== !!d.bundleId, {
        message: 'Choose either a course or a bundle',
        path: ['courseId'],
    });

export const enrollmentStatusSchema = z.object({status: z.enum(['ACTIVE', 'REVOKED'])});

export const couponSchema = z
    .object({
        code: z
            .string()
            .trim()
            .min(3, 'At least 3 characters')
            .max(30)
            .regex(/^[A-Za-z0-9_-]+$/, 'Only letters, numbers, - and _')
            .transform((v) => v.toUpperCase()),
        description: optText,
        discountType: z.enum(['PERCENT', 'FLAT']),
        value: z.coerce.number().positive('Must be more than 0'),
        maxUses: optNumber,
        minAmount: optNumber,
        validFrom: optDate,
        validTo: optDate,
        isActive: z.boolean().default(true),
        courseId: optId,
        partnerId: optId,
    })
    .refine((d) => d.discountType !== 'PERCENT' || d.value <= 100, {
        message: 'Percentage cannot exceed 100',
        path: ['value'],
    })
    .refine((d) => !d.validFrom || !d.validTo || d.validFrom <= d.validTo, {
        message: 'End date must be after start date',
        path: ['validTo'],
    });

export const couponValidateSchema = z.object({
    code: z.string().trim().min(1),
    courseId: optId,
    bundleId: optId,
});

export const partnerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z
        .string()
        .trim()
        .email('Invalid email')
        .optional()
        .nullable()
        .or(z.literal(''))
        .transform((v) => (v ? v : null)),
    phone: optText,
    code: z
        .string()
        .trim()
        .min(3)
        .max(30)
        .regex(/^[A-Za-z0-9_-]+$/, 'Only letters, numbers, - and _')
        .transform((v) => v.toUpperCase()),
    commissionPercent: z.coerce.number().min(0).max(100),
    upiId: optText,
    bankDetails: optText,
    isActive: z.boolean().default(true),
});

export const payoutSchema = z.object({
    partnerId: z.string().min(1, 'Select a partner'),
    amount: z.coerce.number().positive('Amount must be more than 0'),
    status: z.enum(['PENDING', 'PAID', 'CANCELLED']).default('PENDING'),
    reference: optText,
    note: optText,
});
export const payoutUpdateSchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
    reference: optText,
    note: optText,
});

export const educationalFileSchema = z.object({
    title: z.string().trim().min(2).max(150),
    description: optText,
    category: optText,
    courseId: optId,
    fileUrl: z.string().min(1, 'Upload a file'),
    fileType: z.string().default('file'),
    sizeBytes: z.coerce.number().int().min(0).default(0),
    isPublic: z.boolean().default(false),
});
export const educationalFileUpdateSchema = educationalFileSchema
    .omit({fileUrl: true, fileType: true, sizeBytes: true})
    .partial();

export const blogSchema = z.object({
    title: z.string().trim().min(3).max(200),
    slug: z
        .string()
        .trim()
        .max(200)
        .optional()
        .nullable()
        .transform((v) => v || null),
    excerpt: optText,
    content: z.string().min(1, 'Write some content'),
    coverImage: optText,
    author: optText,
    tags: z.array(z.string().trim().min(1)).default([]),
    isPublished: z.boolean().default(false),
});

export const SETTING_KEYS = ['website', 'business'] as const;
export const settingKeySchema = z.enum(SETTING_KEYS);

export const learnerSchema = z.object({
    fullname: z.string().trim().min(2, 'Name is required'),
    phoneNumber: z
        .string()
        .trim()
        .regex(/^[0-9]{10}$/, 'Enter a 10-digit phone number'),
    email: z.string().trim().email('Invalid email'),
    password: z.string().min(6, 'At least 6 characters'),
    city: optText,
    state: optText,
    pincode: optText,
    address: optText,
    qualification: optText,
    collegeName: optText,
});
export const learnerUpdateSchema = learnerSchema
    .omit({password: true})
    .partial()
    .extend({
        // Existing institute students may have numbers like "+91 98xxxxxxx"
        phoneNumber: z
            .string()
            .trim()
            .regex(/^[0-9+\- ]{7,16}$/, 'Enter a valid phone number')
            .optional(),
        password: z
            .string()
            .optional()
            .nullable()
            .transform((v) => v || null)
            .refine((v) => v === null || v.length >= 6, 'At least 6 characters'),
        isActive: z.boolean().optional(),
    });

/** Public website contact form. */
export const contactMessageSchema = z.object({
    name: z.string().trim().min(2, 'Enter your name').max(100),
    email: z.string().trim().email('Enter a valid email').max(150),
    phone: z
        .string()
        .trim()
        .max(20)
        .optional()
        .nullable()
        .transform((v) => (v ? v : null))
        .refine((v) => v === null || /^[0-9+ -]{7,20}$/.test(v), 'Enter a valid phone number'),
    subject: z.string().trim().min(2, 'Enter a subject').max(150),
    message: z.string().trim().min(5, 'Write a short message').max(3000),
    // Honeypot: real visitors never fill this hidden field
    website: z.string().optional(),
});
export const contactReadSchema = z.object({isRead: z.boolean()});

export const studentQuestionSchema = z.object({
    courseId: z.string().min(1),
    lessonId: optId,
    question: z.string().trim().min(5, 'Please describe your question'),
});
