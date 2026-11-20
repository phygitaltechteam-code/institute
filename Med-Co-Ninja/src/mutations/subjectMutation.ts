import { addSubject, getSubjects, AddCoursePayload } from "@/lib/api/subjectApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useAddSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, role }: { data: AddCoursePayload; role?: string }) =>
      addSubject(data, role),

    onSuccess: () => {
      toast.success("Subject Added Successfully");

      queryClient.invalidateQueries({
        queryKey: ["subject"],
      });
    },

    onError: () => {
      toast.error("Subject Not Added");
    },
  });
};

export const useGetSubject = (role?: string) => {
  return useQuery({
    queryKey: ['subject', role],
    queryFn: () => getSubjects(role),
    enabled: Boolean(role),
  });
};