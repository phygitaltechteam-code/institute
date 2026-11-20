import { api } from "@/utils/axios";
import toast from "react-hot-toast";

export const addPlacement = (data: any, role?: string) => {
  try {
    const path = role === 'ADMIN' ? '/admin/placements' : '/teacher/placements';
    const response = api.post(path, data);
    console.log(response);
    return response;
  }
  catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    const details = error?.response?.data?.errors;
    console.error('Failed to create batch:', { message, details, payload: data });
    toast.error(`Failed to create batch: ${message}`);
    throw error;
  }
}

export const getPlacements = async (role?: string) => {
  console.log('getPlacements');
  try {
    const path = role === 'ADMIN' ? '/admin/placements' : '/teacher/placements';
    const response = await api.get(path);
    console.log('Fetched placements data:', response);
    return response.data;
  }
  catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch placements:', { message, details: error?.response?.data?.errors });
    toast.error(`Failed to fetch placements: ${message}`);
    throw error;
  }
}

export const updatePlacement = async (id: string, data: any, role?: string) => {
  try {
    const path = role === 'ADMIN' ? `/admin/placements/${id}` : `/teacher/placements/${id}`;
    const response = await api.patch(path, data);
    console.log(response);
    return response;
  }
  catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    const details = error?.response?.data?.errors;
    console.error('Failed to update placement:', { message, details, payload: data });
    toast.error(`Failed to update placement: ${message}`);
    throw error;
  }
}

export const deletePlacement = async (id: string, role?: string) => {
  try {
    const path = role === 'ADMIN' ? `/admin/placements/${id}` : `/teacher/placements/${id}`;
    const response = await api.delete(path);
    console.log('Deleted placement:', response.data);
    return response.data;
  }
  catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete placement:', { message, details: error?.response?.data?.errors });
    toast.error(`Failed to delete placement: ${message}`);
    throw error;
  }
}

export const getPlacementById = async (id: string, role?: string) => {
  try {
    const path = role === 'ADMIN' ? `/admin/placements/${id}` : `/teacher/placements/${id}`;
    const response = await api.get(path);
    console.log('Fetched placement data:', response.data);
    return response.data;
  }
  catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch placement:', { message, details: error?.response?.data?.errors });
    toast.error(`Failed to fetch placement: ${message}`);
    throw error;
  }
}

// export const assignStudentsToPlacement = async (placementId: string, studentIds: string[], role?: string) => {
//   console.log('Assigning students to placement:', { placementId, studentIds, role });

//   const response = await api.post(
//     `/api/placement/${placementId}/assign-students`,
//     { studentIds },
//     { headers: { 'x-role': role || 'ADMIN' } }
//   );

//   return response.data;
// };


export const assignStudentsToPlacement = async (
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


// ============================================
// GET ASSIGNED STUDENTS
// ============================================
export const getAssignedStudents = async (

  placementId: string,
  role?: string,
) => {
  if (!placementId) {
    throw new Error('Placement ID is missing');
  }

  console.log(
    'Fetching assigned students:',
    placementId,
  );

  const response = await api.get(
    role === 'ADMIN' ? `/admin/placements/assign/${placementId}` : `/teacher/placements/assign/${placementId}`,
    {
      headers: {
        'x-role': role || 'ADMIN',
      },
    },
  );

  console.log(
    'Assigned students response:',
    response.data,
  );

  return response.data;
};

