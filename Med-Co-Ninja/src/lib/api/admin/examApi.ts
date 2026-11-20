import { api } from '@/utils/axios';

export interface Question {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
}

export interface ExamData {
  name: string;
  subject: string;
  courseId: string;
  marks: number;
  hours: number;
  minutes: number;
  questions: Question[];
}

export const createExam = async (data: ExamData, batchId: string, role:string) => {
  try {
    const response = role=="ADMIN"? await api.post(`/admin/exams`, data):await api.post(`/teacher/exams`, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    const details = error?.response?.data?.errors;
    console.error('Failed to create exam:', { message, details, payload: data });
    throw error;
  }
};


export const getExams = async (id: string) => {
  try {
    const response = await api.get(`/admin/exams/batch/${id}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exams:', { message });
    throw error;
  }
};

export const getAllExams = async (role:string) => {
  try {
    const response = role=="ADMIN"?await api.get('/admin/exams'):await api.get('/teacher/exams');
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exams:', { message });
    throw error;
  }
};
//admin/exam/batch/id

export const assignExamToBatch = async (examId: string, batchId: string , role:string) => {
  try {
    const response = role=="ADMIN"?await api.post(`/admin/exams/batch/${batchId}`, {examId}):await api.post(`/teacher/exams/batch/${batchId}`, {examId});
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to assign exam to batch:', { message });
    throw error;
  }
};

export const getBatchExams = async (batchId: string , role:string) => {
  try {
    const response = role=="ADMIN"?await api.get(`/admin/exams/batch/${batchId}`):await api.get(`/teacher/exams/batch/${batchId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exams:', { message });
    throw error;
  }
};


export const getExamById = async (examId: string , role) => {
  try {
    const response = role=="ADMIN"?await api.get(`/admin/exams/${examId}`):await api.get(`/teacher/exams/${examId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exam:', { message });
    throw error;
  }
};

export const updateExam = async (examId: string, data: Partial<ExamData> , role:string) => {
  try {
    const response = role=="ADMIN"?await api.patch(`/admin/exams/${examId}`, data):await api.patch(`/teacher/exams/${examId}`, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update exam:', { message });
    throw error;
  }
};

export const deleteExam = async (examId: string) => {
  try {
    const response = await api.delete(`/admin/exams/${examId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete exam:', { message });
    throw error;
  }
};

// Nested Questions endpoints
export const addQuestionToExam = async (examId: string, question: Question) => {
  try {
    const response = await api.post(`/admin/exams/${examId}/questions`, question);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to add question:', { message });
    throw error;
  }
};

export const getExamQuestions = async (examId: string) => {
  try {
    const response = await api.get(`/admin/exams/${examId}/questions`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch questions:', { message });
    throw error;
  }
};

export const updateQuestion = async (examId: string, questionId: string, question: Partial<Question>) => {
  try {
    const response = await api.patch(`/admin/exams/${examId}/questions/${questionId}`, question);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update question:', { message });
    throw error;
  }
};

export const deleteQuestion = async (examId: string, questionId: string) => {
  try {
    const response = await api.delete(`/admin/exams/${examId}/questions/${questionId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete question:', { message });
    throw error;
  }
};

export const getExamReview=async(examId:string,role:string)=>{
  try{
    const response = role=="ADMIN"?await api.get(`/admin/exams/data/${examId}`):await api.get(`/teacher/exams/data/${examId}`);
    return response.data;
  }catch(error:any){
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch exam review:', { message });
    throw error;
  }
}

export const  saveRemark=async(id:string,remarks:string , role:string)=>{
  try{
    const response = role=="ADMIN"? await api.patch(`/admin/exams/data/${id}`, { remarks }):await api.patch(`/teacher/exams/data/${id}`, { remarks });
    return response.data;
  }catch(error:any){
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to save remark:', { message });
    throw error;
  }
}