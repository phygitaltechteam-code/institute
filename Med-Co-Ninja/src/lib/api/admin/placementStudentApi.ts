import { api } from '@/utils/axios';
import toast from 'react-hot-toast';
const basePath = (role?: string) =>
  role === 'ADMIN' ? '/admin/placements/students' : '/teacher/placements/students';

// POST - Assign a student to a placement
export const assignStudentToPlacement = async (data: any, role?: string) => {
  try {
    // Ensure both studentId and placementId are in the payload
    const payload = {
      studentId: data.studentId,
      placementId: data.placementId,
    };
    
    console.log('Sending payload:', payload); // For debugging
    
    const response = await api.post(basePath(role), payload);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to assign student to placement:', { 
      message, 
      error: error?.response?.data 
    });
    toast.error(`Failed to assign student: ${message}`);
    throw error;
  }
};

// GET - Get placement students
export const getPlacementStudents = async (params: { page?: number; limit?: number; search?: string; } | undefined, role?: string) => {
  try {
    const response = await api.get(basePath(role));
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch placement students:', { message });
    toast.error(`Failed to fetch placement students: ${message}`);
    throw error;
  }
};

// GET by ID
export const getPlacementStudentById = async (id: string, role?: string) => {
  try {
    const response = await api.get(`${basePath(role)}/${id}`);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch placement student:', { message });
    toast.error(`Failed to fetch: ${message}`);
    throw error;
  }
};

// PATCH - Update a relation
export const updatePlacementStudent = async (id: string, data: any, role?: string) => {
  try {
    const response = await api.patch(`${basePath(role)}/${id}`, data);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update placement student:', { message });
    toast.error(`Failed to update: ${message}`);
    throw error;
  }
};

// DELETE
export const deletePlacementStudent = async (id: string, role?: string) => {
  try {
    const response = await api.delete(`${basePath(role)}/${id}`);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete placement student:', { message });
    toast.error(`Failed to delete: ${message}`);
    throw error;
  }
};
