import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


const submitAttendance = async (data: any, role: string) => {
    const rolePath = role === 'ADMIN'  ? '/admin' : '/teacher';
    const payload = {
        batchId: data.batchId,
        date: data.date,
        totalStudents: data.totalStudents,
        presentStudents: data.presentStudents,
        absentStudents: data.absentStudents,
        studentIds: data.studentIds,
    };
    const response = await api.post(`${rolePath}/attendance`, payload);
    return response.data;
};

export const useSubmitAttendance = (role: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => submitAttendance(data, role),
        onSuccess: (data) => {

            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            //   console.log('Attendance submitted successfully:', data);
        },
        onError: (error: any) => {
            console.error('Error submitting attendance:', error);
        },
    });
};

export const useGetAttendance = (batchId?: string, role?: string, date?: string) => {
    return useQuery({
        queryKey: ['attendance', batchId || 'all', date || 'all', role],
        queryFn: () => getAttendance(role || '', batchId, date),
        enabled: !!role && !!batchId && batchId !== '', 
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
};
const getAttendance = async (role: string, batchId?: string, date?: string) => {
    const rolePath = role === 'ADMIN' || role === 'SUPERADMIN' ? '/admin' : '/teacher';
    
    // ✅ Fixed: Don't add /admin twice
    let url = `${rolePath}/attendance`;
    const params = new URLSearchParams();
    
    if (batchId) {
        params.append('batchId', batchId);
    }
    if (date) {
        params.append('date', date);
    }
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    console.log('📤 Fetching attendance from URL:', url);
    
    try {
        const response = await api.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching attendance:', error);
        throw error;
    }
};
