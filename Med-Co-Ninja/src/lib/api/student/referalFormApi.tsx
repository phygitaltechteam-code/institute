import { api } from "@/utils/axios";
import toast from "react-hot-toast";


export const getCourse=()=>{
    try{
        const response = api.get('/external/courses')
        return response;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch batches:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to fetch batches: ${message}`);
        throw error;
    }
}

export const referalForm = async (data: any) => {  // Add 'async'
    try {
        const response = await api.post('/student/daily-tasks/referal', data);  // Add 'await'
        return response.data;  // Return data directly
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to enroll:', { message, details: error?.response?.data?.errors });
        // toast.error(`Failed to enroll: ${message}`);
        throw error;
    }
}

export const getStudentReferal=async()=>{
    try {
        const response = await api.get('/student/daily-tasks/referal');  // Add 'await'
        return response.data;  // Return data directly
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to enroll:', { message, details: error?.response?.data?.errors });
        // toast.error(`Failed to enroll: ${message}`);
        throw error;
    }
}