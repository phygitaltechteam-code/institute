import { api } from '@/utils/axios';
import toast from 'react-hot-toast';

export interface LeadData {
  name: string;
  phoneNumber: string; // Changed from 'number' to 'phoneNumber' to match API
  source?: string;
  courseId: string; // Changed from 'course' to 'courseId'
  qualification?: string;
  interested?: boolean; // Changed to boolean
  teacherId?: string; // Changed from 'faculty' to 'teacherId'
  mode?: string; // "ONLINE" | "OFFLINE"
  batchId?: string; // Changed from 'batch' to 'batchId'
  collegeName?: string;
}

export const createLead = async (data: any, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = '/admin/leads';
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = '/teacher/leads';
    } else {
      url = '/leads';
    }
    const response = await api.post(url, data);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to create lead:', { message });
    toast.error(`Failed to create lead: ${message}`);
    throw error;
  }
};

export const getLeads = async (params?: {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: string;
  courseId?: string;
  batchId?: string;
  teacherId?: string;
  batchType?: string;
}, role?: string) => {
  try {
    const path = role === 'ADMIN' ? '/admin/leads' : '/teacher/leads';
    const response = await api.get(path, { params });
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch leads:', { message });
    throw error;
  }
};

// Get a single follow-up by ID
export const getFollowUpById = async (followUpId: string, role?: string) => {
  try {
    let url = '';
    if (role === 'ADMIN') {
      url = `/admin/leads/followups/${followUpId}`;
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      url = `/teacher/leads/followups/${followUpId}`;
    } else {
      url = `/leads/followups/${followUpId}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch follow-up:', { message });
    toast.error(`Failed to fetch follow-up: ${message}`);
    throw error;
  }
};



export const getLeadById = async (leadId: string, role?: string) => {
  try {
    const path = role === 'ADMIN' ? `/admin/leads/${leadId}` : `/teacher/leads/${leadId}`;
    const response = await api.get(path);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch lead:', { message });
    throw error;
  }
};

export const addNextFollowUp = async (data: any, role?: string) => {
  try {
    const path = role === 'ADMIN'
      ? '/admin/leads/followups'
      : '/teacher/leads/followups';

    const response = await api.post(path, data);
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to add follow-up:', { message });
    // toast.error(`Failed to add follow-up: ${message}`);
    throw error;
  }
};
export const updateLead = async (leadId: string, data: Partial<LeadData>, role?: string) => {
  try {
    const path = role === 'ADMIN' ? `/admin/leads/${leadId}` : `/teacher/leads/${leadId}`;
    const response = await api.put(path, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update lead:', { message });
    throw error;
  }
};

export const deleteLead = async (leadId: string, role?: string) => {
  try {
    const path = role === 'ADMIN' ? `/admin/leads/${leadId}` : `/teacher/leads/${leadId}`;
    const response = await api.delete(path);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete lead:', { message });
    throw error;
  }
};

export const deleteFollowUp = async (followUpId: string, role?: string) => {
  try {
    const path = role === 'ADMIN' 
      ? `/admin/leads/followup/${followUpId}` 
      : `/teacher/leads/followup/${followUpId}`;
    const response = await api.delete(path);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete follow-up:', { message });
    throw error;
  }
};