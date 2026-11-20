import {z} from 'zod';
import {commonValidation} from '@validations/index';

const createSubjectSchema = z.object({
    name: z.string(),
});

const updateSubjectSchema = z.object({
    id: commonValidation.idSchema,
    name: z.string(),
});

const deleteSubjectSchema = z.object({
    id: commonValidation.idSchema,
});

const getSubjectSchema = z.object({
    id: commonValidation.idSchema,
});

const getAllSubjectSchema = z.object({
    page: z.number(),
    limit: z.number(),
    searchTerm: z.string().optional(),
});

export default {
    createSubjectSchema,
    updateSubjectSchema,
    deleteSubjectSchema,
    getSubjectSchema,
    getAllSubjectSchema,
};
