import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { api } from "@/utils/axios";

export interface AddCoursePayload {
  name: string;
}

export const addCourse = async (data: AddCoursePayload, role?: string) => {
  try {
    if (role === 'ADMIN') {
      const response = await api.post("admin/courses", data);
      return response;
    } else if (role === 'TEACHER') {
      const response = await api.post("teacher/courses", data);
      return response;
    }
    throw new Error('Invalid role');
  } catch (error) {
    console.log("erorrrrr", error);
    toast.error("course not add");

    throw error;
  }
};
export const getCourses = async (role?: string) => {
  if (role === 'ADMIN') {
    const response = await api.get("admin/courses");
    console.log("API Response:", response);
    return response;
  } else if (role === 'TEACHER') {
    const response = await api.get("teacher/courses");
    console.log("API Response:", response);
    return response;
  }
  throw new Error('Invalid role');
};

export const deleteCourse = async (id: string, role?: string) => {
  console.log("Deleting course with ID:", id);
  if (role === 'ADMIN') {
    return await api.delete(`admin/courses/${id}`);
  } else if (role === 'TEACHER') {
    return await api.delete(`teacher/courses/${id}`);
  }
  throw new Error('Invalid role');
};


export interface UpdateCoursePayload {
  id: string;
  name: string;
}

export const updateCourse = async ({ id, data }: any, role?: string) => {
  if (role === 'ADMIN') {
    return await api.put(`/admin/courses/${id}`, data);
  } else if (role === 'TEACHER') {
    return await api.put(`/teacher/courses/${id}`, data);
  }
  throw new Error('Invalid role');
};

export const getCoursesById = async (id: string, role?: string) => {
  if (role === 'ADMIN') {
    const response = await api.get(`admin/courses/${id}`);
    console.log("API Response:", response);
    return response;
  } else if (role === 'TEACHER') {
    const response = await api.get(`teacher/courses/${id}`);
    console.log("API Response:", response);
    return response;
  }
  throw new Error('Invalid role');
};


export const getInterviews = async (batchId?: string, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = batchId ? `/admin/interviews/students?batchId=${batchId}` : '/admin/interviews/students';
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = batchId ? `/teacher/interviews/students?batchId=${batchId}` : '/teacher/interviews/students';
    } else {
      url = batchId ? `/interviews/students?batchId=${batchId}` : '/interviews/students';
    }

    console.log('Fetching from URL:', url);
    const response = await api.get(url);
    console.log("Full API Response:", response);
    console.log("Response data:", response.data);
    console.log("Response data structure:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch interviews:', {
      message,
      error: error?.response?.data,
      status: error?.response?.status
    });
    toast.error(`Failed to fetch interviews: ${message}`);
    throw error;
  }
};


export const getBatchwiseStudentInterview = async (batchId?: string, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = batchId ? `/admin/batches/students/${batchId}` : '/admin/interviews/students';
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = batchId ? `/teacher/batches/students/${batchId}` : '/teacher/interviews/students';
    }
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    toast.error(`Failed to fetch interviews: ${message}`);
    throw error;
  }
};

export const addInterview = async (data: any, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = '/admin/placements/students';
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = '/teacher/placements/students';
    } else {
      url = '/placement/students';
    }

    console.log('Sending to URL:', url);
    console.log('Payload:', data);

    const response = await api.post(url, data);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to assign interview:', {
      message,
      error: error?.response?.data,
      status: error?.response?.status
    });
    toast.error(`Failed to assign interview: ${message}`);
    throw error;
  }
};

export const updateInterview = async (id: string, data: any, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = `/admin/placement/students/${id}`;
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = `/teacher/interviews/${id}`;
    } else {
      url = `/interviews/${id}`;
    }

    const response = await api.put(url, data);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update interview:', { message });
    toast.error(`Failed to update interview: ${message}`);
    throw error;
  }
};

export const deleteInterview = async (id: string, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = `/admin/interviews/${id}`;
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = `/teacher/interviews/${id}`;
    } else {
      url = `/interviews/${id}`;
    }

    const response = await api.delete(url);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete interview:', { message });
    toast.error(`Failed to delete interview: ${message}`);
    throw error;
  }
};