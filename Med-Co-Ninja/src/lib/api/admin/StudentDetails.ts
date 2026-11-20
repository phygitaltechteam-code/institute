import { api } from "@/utils/axios";
import toast from "react-hot-toast";

export const getStudent = async (role?: string) => {
    try {
        const path = role === 'ADMIN' ? '/admin/students' : '/teacher/students';
        const response = await api.get(path);
        console.log('Fetched student data:', response);
        return response;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch students:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to fetch students: ${message}`);
        throw error;
    }
};

export const getStudentById = async (id: string, role?: string) => {
    try {
        const path = role === 'ADMIN' ? `/admin/students/${id}` : `/teacher/students/${id}`;
        const response = await api.get(path);
        return response.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch student:', { message });
        toast.error(`Failed to fetch student: ${message}`);
        throw error;
    }
};

export const deleteStudent = async (id: string, role?: string) => {
    try {
        const path = role === 'ADMIN' ? `/admin/students/${id}` : `/teacher/students/${id}`;
        const response = await api.delete(path);
        return response.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to delete student:', { message });
        toast.error(`Failed to delete student: ${message}`);
        throw error;
    }
};

export const getUsername = async (): Promise<string> => {
    const response = await api.get('/external/username');
    return response.data.username || response.data;
};