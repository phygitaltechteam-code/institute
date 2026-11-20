import { api } from "@/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const sumbitDailyTaska = async(data:any , dailyTaskId:string)=>{
    try {
        const response = await api.post(`/student/daily-tasks/submit/${dailyTaskId}`, data);
    return response.data;
    } catch (error) {
        
    }
}

export const useAddDailyTaskSumbitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn:({data , dailyTaskId}: {data: any ; dailyTaskId:string})=> sumbitDailyTaska(data , dailyTaskId),
    onSuccess: (_, variables) => {
      toast.success('Daily task added successfully');
      queryClient.invalidateQueries({
        queryKey: ['dailytasks', variables.dailyTaskId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to save daily task';
      toast.error(message);
    },
  });
};