// lib/react-query/queriesAndMutations/studentplacement.ts

import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// types/studentPlacement.ts

export interface StudentPlacementFormData {
    name: string;
    email: string;
    phone1: string;
    phone2?: string;
    gender: string;

    // Education Details
    ssc: string;
    ssc_year: string;
    hsc?: string;
    hsc_year?: string;
    diploma?: string;
    diploma_year?: string;
    diploma_course?: string;
    post_graduation?: string;
    post_graduation_year?: string;
    post_course?: string;

    // Experience
    exprience: string;
    current_working: string;

    // Preferences
    Preferred_Profiles: string;
    state: string;
    district: string;
    preferredLocation: string;

    // Documents - Files
    aadharcard?: FileList;
    passport?: FileList;
    profile_photo?: FileList;
    resume?: FileList;
}

export interface StudentPlacementResponse {
    statusCode: number;
    status: boolean;
    message: string;
    data: {
        id: string;
        studentId: string;
        name: string;
        email: string;
        createdAt: string;
        updatedAt: string;
    };
    errors: any;
}

// API function to submit placement form
const submitStudentPlacement = async (formData: FormData) => {
    try {
        const response = await api.post('/student/placement/form', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        console.error('Error submitting placement form:', error);
        throw error;
    }
};
const getStudentPlacement = async () => {
    try {
        const response = await api.get('/student/placement/form');
        return response.data;
    } catch (error: any) {
        console.error('Error submitting placement form:', error);
        throw error;
    }
};

// Hook to use the mutation
export const useStudentPlacement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitStudentPlacement,
        onSuccess: (data) => {

            queryClient.invalidateQueries({ queryKey: ['student-placement'] });
            queryClient.invalidateQueries({ queryKey: ['student-profile'] });
            toast.success('Placement form submitted successfully!');
        },
        onError: (error: any) => {
            console.error('Placement submission error:', error);
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to submit placement form. Please try again.';

            toast.error(errorMessage);
        },
    });
};


export const useGetPlacementFormData =()=>{
   
  return useQuery({
    queryKey: ['placement-form-data'],
    queryFn: () => getStudentPlacement(),

  });
};



// For getting student placement data (GET request)
export const useGetStudentPlacement = () => {
    // This would be a query hook to fetch existing placement data
    // You can implement this if needed
};

// For updating student placement (PUT/PATCH request)
export const useUpdateStudentPlacement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
            const response = await api.put(`/student/placement/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-placement'] });
            toast.success('Placement form updated successfully!');
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.message ||
                'Failed to update placement form. Please try again.';
            toast.error(errorMessage);
        },
    });
};

// For deleting student placement
export const useDeleteStudentPlacement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/student/placement/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-placement'] });
            toast.success('Placement form deleted successfully!');
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.message ||
                'Failed to delete placement form. Please try again.';
            toast.error(errorMessage);
        },
    });
};


export const getStudentDataForPlacementForm =async()=>{
    try {
        const response = await api.get('/student/daily-tasks/profile');
        return response.data;
    } catch (error: any) {
        console.error('Error submitting placement form:', error);
        throw error;
    }
}

export const useGetStudentDataForPlacementForm =()=>{
    return useQuery({
        queryKey: ['student-data-for-placement-form'],
        queryFn: () => getStudentDataForPlacementForm(),
    });
}
