import { api } from "@/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const sumbitAssignment = async(data:any , assignmentId:string)=>{
    try {
        const response = await api.post(`/student/assignments/submit/${assignmentId}`, data);
    return response.data;
    } catch (error) {
        
    }
}

export const useAddAssignmentSumbitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn:({data , assignmentId}: {data: any ; assignmentId:string})=> sumbitAssignment(data , assignmentId),
    onSuccess: (_, variables) => {
      toast.success('Assignment added successfully');
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to save assignment';
      toast.error(message);
    },
  });
};