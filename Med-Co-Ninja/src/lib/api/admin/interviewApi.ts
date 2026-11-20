import { api } from "@/utils/axios";

export interface AssignInterviewData {
    studentId: string;
    interviewId?: string;
    placementId?: string;
    batchId?: string;
    pn?: string; // Assuming PN is some identifier
    companyName?: string;
    jobRole?: string;
    interviewDate?: string;
    interviewTime?: string;
    status?: string;
    role?: string;
}

export const assignInterview = async (
    placementId: string,
    interviewDetails?: {
        student: { studentId: string }[];
        interviewMode?: string;
        interviewDate?: string;
        interviewLocation?: string;
    },
    role?: string,
) => {
    console.log('Assigning students to placement:', {
        placementId,
        interviewDetails,
        role,
    });
    const response = role === 'ADMIN' ? await api.post(`/admin/placements/schedule/${placementId}`, interviewDetails) : await api.post(`/teacher/placements/schedule/${placementId}`, interviewDetails);
    return response.data;
};


export const getInterviewDetails = async (interviewId: string) => {
    try {
        const response = await api.get(`/admin/interviews/${interviewId}`);
        return response.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch interview details:', { message });
        throw error;
    }
};