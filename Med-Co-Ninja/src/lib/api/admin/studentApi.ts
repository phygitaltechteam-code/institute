import { api } from '@/utils/axios';
import toast from 'react-hot-toast';

export const registerStudent = async (payload: any, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = '/admin/students';
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = '/teacher/students';
    } else {
      url = '/students';
    }
    const response = await api.post(url, payload);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to register student:', { message });
    toast.error(`Failed to register student: ${message}`);
    throw error;
  }
};

export const updateStudent = async (id: string, payload: any, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = `/admin/students/${id}`;
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = `/teacher/students/${id}`;
    } else {
      url = `/students/${id}`;
    }
    const response = await api.put(url, payload);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update student:', { message });
    toast.error(`Failed to update student: ${message}`);
    throw error;
  }
};


export const payReferToStudent=async(data:any , role:string)=>{
  try {
    const response = role=="ADMIN"? await api.post(`/admin/students/refer/${data.studentId}`,{accountId:data.accountId}):await api.post(`/teacher/students/refer/${data.studentId}`, data.accountId);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to pay refer amount:', { message });
    toast.error(`Failed to pay refer amount: ${message}`);
    throw error;
  }
}
