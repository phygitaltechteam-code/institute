import { api } from "@/utils/axios";
import toast from "react-hot-toast";

export const addExpenditure =(data:any, role?: string)=>{
    try{
        const path = role === 'ADMIN' ? '/admin/expenditures' : '/teacher/expenditures';
        const response = api.post(path,data);
        console.log(response);
        return response;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to create batch:', { message, details, payload: data });
        // toast.error(`Failed to create batch: ${message}`);
        throw error;
    }
}

export const getExpenditure =(role?: string)=>{
    try{
        const path = role === 'ADMIN' ? '/admin/expenditures' : '/teacher/expenditures';
        const response = api.get(path);
        console.log(response);
        return response;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to create batch:', { message, details });
        // toast.error(`Failed to create batch: ${message}`);
        throw error;
    }
}

export const getExpenditureById=(id:string, role?: string)=>{
    try{
        const path = role === 'ADMIN' ? `/admin/expenditures/${id}` : `/teacher/expenditures/${id}`;
        const response = api.get(path);
        console.log(response);
        return response;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to create batch:', { message, details });
        // toast.error(`Failed to create batch: ${message}`);
        throw error;
    }
}

export const editExpenditure =(id:string,data:any, role?: string)=>{
    try{
        const path = role === 'ADMIN' ? `/admin/expenditures/${id}` : `/teacher/expenditures/${id}`;
        const response = api.put(path,data);
        console.log(response);
        return response;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to create batch:', { message, details, payload: data });
        // toast.error(`Failed to create batch: ${message}`);
        throw error;
    }
}

export const deleteExpenditure=(id:string, role?: string)=>{
    try{
        const path = role === 'ADMIN' ? `/admin/expenditures/${id}` : `/teacher/expenditures/${id}`;
        const response = api.delete(path);
        console.log(response);
        return response;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Failed to create batch:', { message, details });
        // toast.error(`Failed to create batch: ${message}`);
        throw error;
    }
}
