import { api } from "@/utils/axios"

export const getstudentInterview=async ()=>{
    try {   
        const response = await api.get('student/placement/interview')
        return response.data;
    } catch (error:any) {
        const message = 
            error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch interviews:', { message });
        throw error;
    }   
}

export const updateInterviewStatus=async(id:string, status:string)=>{

    try {
         const response = await api.patch(`student/placement/interview/${id}`, { status });
         return response.data
    } catch (error:any) {
        const message =
            error?.response?.data?.message || error?.message || "Unknown error";
        console.error("Failed to update interview:", { message });
        throw error;
    }
   
}