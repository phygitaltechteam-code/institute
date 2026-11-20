import {api} from '@/utils/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const addDailyTask = async (data: any) => {
  try {
    const {batchId, date, topic, task, file, video, role} = data;

    if (!batchId) {
      throw new Error('Batch ID is required');
    }

    // Create FormData
    const formData = new FormData();

    // Append regular fields directly (not wrapped in a task object)
    formData.append('date', date);
    formData.append('topic', topic);
    formData.append('task', task);

    // Append file as multipart if it exists
    if (file && file instanceof File) {
      formData.append('pdf', file);
      // console.log(` pdf attached: ${file.name} (${file.size} bytes)`);
    }

    // Append video as multipart if it exists
    if (video && video instanceof File) {
      formData.append('video', video);
      // console.log(`🎥 Video attached: ${video.name} (${video.size} bytes)`);
    }

    // Log FormData contents for debugging
    // console.log('FormData entries:');
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        // console.log(
        //   `  ${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`,
        // );
      } else {
        // console.log(`  ${pair[0]}:`, pair[1]);
      }
    }

    const endpoint = role == 'ADMIN' ? `/admin/batches/tasks/${batchId}` : `/teacher/batches/tasks/${batchId}`;

    const response = await api.post(
      endpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    console.log(' Response:', response.data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    const details = error?.response?.data?.errors;
    console.error('Failed to create daily task:', {
      message,
      details,
      payload: data,
    });
    throw error;
  }
};


export const getDailyTasks = async (batchId: string , role:string) => {
  try {
    const response = role=="ADMIN"?await api.get(`/admin/batches/tasks/${batchId}`): await api.get(`/teacher/batches/tasks/${batchId}`)
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch daily tasks:', {message});
    throw error;
  }
};


export const getDailyTaskById = async (taskId: string , role:string) => {
  try {
    const response = role=="ADMIN"? await api.get(`/admin/batches/tasks/byId/${taskId}`): await api.get(`/teacher/batches/tasks/byId/${taskId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch daily task:', {message});
    throw error;
  }
};


export const updateDailyTask = async (taskId: string, data: any, role:string) => {
  try {
    const endpoint = role=="ADMIN"?`/admin/batches/tasks/byId/${taskId}`: `/teacher/batches/tasks/byId/${taskId}`;
    const response = await api.patch(
      endpoint,
      data,
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to update daily task:', {message});
    throw error;
  }
};

// DELETE /admin/batches/tasks/byId/:taskId
export const deleteDailyTask = async (taskId: string) => {
  try {
    const response = await api.delete(`/admin/batches/tasks/byId/${taskId}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to delete daily task:', {message});
    throw error;
  }
};

export const dailyTaskReview=async( taskId:string , role:string)=>{
    try{
      const response =  await api.get(role=="ADMIN"?`/admin/batches/tasks/remark/${taskId}`: `/teacher/batches/tasks/remark/${taskId}`)
      return response.data;
    }
    catch(error:any){
      const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch daily task review:', {message});
    throw error;
    }
}

export const saveDailyTaskRemark=async(taskId:string , role:string , data:any)=>{
  console.log("api",data , role,taskId)
    try{
      const response = role=="ADMIN" ? await api.put(`/admin/batches/tasks/remark/${taskId}`,data) : await api.put(`/teacher/batches/tasks/remark/${taskId}`,data)
      return response.data;
    }
    catch(error:any){
      const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to save daily task remark:', {message});
    throw error;
    }
}