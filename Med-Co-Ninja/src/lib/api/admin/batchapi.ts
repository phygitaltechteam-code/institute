import { api } from "@/utils/axios";
import toast from "react-hot-toast";

export const createBatch = async (batchData: any, role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.post('/admin/batches', batchData);
            console.log('Batch created successfully:', response.data);
            return response.data;
        } else if (role === 'TEACHER') {
            const response = await api.post('/teacher/batches', batchData);
            console.log('Batch created successfully:', response.data);
            return response.data;
        }
        throw new Error('Invalid role');
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to create batch:', { message, details, payload: batchData });
        toast.error(`Failed to create batch: ${message}`);
        throw error;
    }
}

export const updateBatch = async (id: string, batchData: any, role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.patch(`/admin/batches/${id}`, batchData);
            return response.data;
        } else if (role === 'TEACHER') {
            const response = await api.patch(`/teacher/batches/${id}`, batchData);
            return response.data;
        }
        throw new Error('Invalid role');
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to update batch:', { message, details, payload: batchData });
        toast.error(`Failed to update batch: ${message}`);
        throw error;
    }
}

export const getBatches = async (role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.get('/admin/batches');
            return response.data;
        } else if (role === 'TEACHER') {
            const response = await api.get('/teacher/batches');
            return response.data;
        }
        throw new Error('Invalid role');
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch batches:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to fetch batches: ${message}`);
        throw error;
    }
}

export const deleteBatch = async (id: string, role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.delete(`/admin/batches/${id}`);
            return response.data;
        } else if (role === 'TEACHER') {
            const response = await api.delete(`/teacher/batches/${id}`);
            return response.data;
        }
        throw new Error('Invalid role');
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to delete batch:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to delete batch: ${message}`);
        throw error;
    }
}

export const getBatchById = async (id: string, role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.get(`/admin/batches/${id}`);
            return response.data;
        } else if (role === 'TEACHER') {
            const response = await api.get(`/teacher/batches/${id}`);
            return response.data;
        }
        throw new Error('Invalid role');
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch batch:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to fetch batch: ${message}`);
        throw error;
    }
}