
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export const assignmentReview=async( assignmentId:string , role:string)=>{
    try{
      const response =  await api.get(role=="ADMIN"?`/admin/batches/assignments/remark/${assignmentId}`: `/teacher/batches/assignments/remark/${assignmentId}`)
      return response.data;
    }
    catch(error:any){
      const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to fetch daily task review:', {message});
    throw error;
    }
}


export const saveAssignmentRemark=async(assignmentId:string , role:string , data:any)=>{
  console.log("api",data , role,assignmentId)
    try{
      const response = role=="ADMIN" ? await api.put(`/admin/batches/assignments/remark/${assignmentId}`,data) : await api.put(`/teacher/batches/assignments/remark/${assignmentId}`,data)
      return response.data;
    }
    catch(error:any){
      const message =
      error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('Failed to save daily task remark:', {message});
    throw error;
    }
}

export const useGetAssignmentReview=(assignmentId:string, role:string)=>{
  return useQuery({
 
    queryFn: () =>assignmentReview(assignmentId , role),
    queryKey: ['assignmentReview', assignmentId , role],
 
  });
}

export const useAddAssignmentRemarks=()=>{
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, remarks , role}: {id: string; remarks: string , role:string}) =>
      saveAssignmentRemark(id, role, { remark: remarks }),
    onSuccess: () => {
      toast.success('Remarks added successfully!');
      queryClient.invalidateQueries({
        queryKey: ['assignmentReview'],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to add remarks';
      toast.error(message);
    },
  });
}