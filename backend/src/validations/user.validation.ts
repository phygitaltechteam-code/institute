import {z} from 'zod';
import {
    password,
    emailSchema,
    usernameSchema,
    fullnameSchema,
    phoneNumberSchema,
} from './custom.validation';

import {commonValidation} from '@validations/index';
import {Role} from '.prisma/client/default';

const registerUserSchema = z.object({
    fullname: fullnameSchema.trim(),
    email: emailSchema.trim(),
    username: usernameSchema.trim(),
    password: password,
    phoneNumber: phoneNumberSchema.trim(),
    secondaryPhoneNumber: phoneNumberSchema.optional(),
    role: z.nativeEnum(Role).optional(),
});

const loginUserSchema = z.object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: password,
});

const changePasswordSchema = z.object({
    currentPassword: password,
    newPassword: password,
});

const requestPasswordResetSchema = z.object({
    email: emailSchema,
});

const resetPasswordSchema = z.object({
    newPassword: password,
});

const updateUserSchema = registerUserSchema
    .omit({
        email: true,
        username: true,
        password: true,
        role: true,
    })
    .partial();

const refreshTokenRequestSchema = z.object({
    refreshToken: commonValidation.refreshTokenSchema,
    cookies: z
        .object({
            refreshToken: commonValidation.refreshTokenSchema,
        })
        .refine((data) => data.refreshToken, {
            message: 'Refresh token is required',
            path: ['refreshToken'],
        }),
});

const verifyVerificationCodeSchema = z.object({
    username: usernameSchema,
    code: z.string().length(6, {
        message: 'Verification code must be 6 digits!',
    }),
});

export default {
    registerUserSchema,
    loginUserSchema,
    changePasswordSchema,
    updateUserSchema,
    requestPasswordResetSchema,
    refreshTokenRequestSchema,
    verifyVerificationCodeSchema,
    resetPasswordSchema,
};
