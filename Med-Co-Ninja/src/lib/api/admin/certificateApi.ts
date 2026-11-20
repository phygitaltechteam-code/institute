import { api } from "@/utils/axios";
import toast from "react-hot-toast";

export interface GenerateCertificatePayload {
  studentId: string;
  batchId?: string;
  studentName: string;
  phoneNumber?: string;
  courseName: string;
  duration: string;
  grade: string;
  issueDate?: string;
}

export const generateCertificateApi = async (payload: FormData | GenerateCertificatePayload, studentId: string, role?: string) => {

  console.log("cirtificate", payload)
  try {
    let url = `/admin/student/certificate/${studentId}`;
    if (role === 'ADMIN') {
      url = `/admin/students/certificate/${studentId}`;
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = `/teacher/students/certificate/${studentId}`;
    }
    const response = await api.post(url, payload);
    console.log('Certificate generated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to submit certificate to backend';
    console.error('Failed to submit certificate:', { message, error, payload });
    toast.error(`Failed to submit certificate: ${message}`);
    throw error;
  }
};

export const getCertificatesApi = async (batchId?: string, role?: string) => {
  try {
    let basePath = '/admin/certificates';
    if (role === 'ADMIN') {
      basePath = '/admin/certificates';
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      basePath = '/teacher/certificates';
    }
    const path = batchId ? `${basePath}?batchId=${batchId}` : basePath;
    const response = await api.get(path);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch certificates:', { message });
    toast.error(`Failed to fetch certificates: ${message}`);
    throw error;
  }
};
