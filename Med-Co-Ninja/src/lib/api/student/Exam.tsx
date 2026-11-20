import { api } from "@/utils/axios";

export const Exams = async () => {
  try {
    const response = await api.get('/student/exams');
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exams:', { message });
    throw error;
  }
};

export const getExambyId=async(id:string)=>{
  try {
    const response = await api.get(`/student/exams/${id}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exam:', { message });
    throw error;
  }
}

export const submitExam=async(examId:string , payload: any)=>{
  try {
    const response = await api.post(`/student/exams/submit/${examId}` , payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to submit exam:', { message });
    throw error;
  }
}

// exam result 

export const getExamResult=async(examId:string)=>{
  try {
    const response = await api.get(`student/exams/result/${examId}`)
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exam result:', { message });
    throw error;
  }
}

export const examAnalysis=async (examId:string)=>{
  try {
    const response = await api.get(`student/exams/result/analysis/${examId}`)
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exam result:', { message });
    throw error;
  }
}

export const examAdminAnalysis=async (studentId:string ,examId:string , role:string)=>{
  try {
    const response = role ==="ADMIN"? await api.get(`admin/exams/result/${studentId}/${examId}`):await api.get(`teacher/exams/result/${studentId}/${examId}`)
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exam result:', { message });
    throw error;
  }
}