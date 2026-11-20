import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCourse, addInterview, deleteCourse, deleteInterview, getBatchwiseStudentInterview, getCourses, getCoursesById, getInterviews, updateCourse, updateInterview } from "@/lib/api/course";
import toast from "react-hot-toast";


export const useAddCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, role }: { data: AddCoursePayload; role?: string }) =>
      addCourse(data, role),

    onSuccess: () => {
      toast.success("Course Added Successfully");

      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
    },

    onError: () => {
      toast.error("Course Not Added");
    },
  });
};
export const useDeleteCourse = (role?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteCourse(id, role),

    onSuccess: () => {
      toast.success("Course Deleted");

      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
    },

    onError: () => {
      toast.error("Delete Failed");
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, role }: { id: string; data: any; role?: string }) =>
      updateCourse({ id, data }, role),

    onSuccess: () => {
      toast.success("Course Updated");

      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
    },

    onError: () => {
      toast.error("Update Failed");
    },
  });
};
export const useGetCourses = (role?: string) => {
  return useQuery({
    queryKey: ['courses', role],
    queryFn: () => getCourses(role),
    enabled: Boolean(role),
  });
}
export const useGetCourseById = (id: string, role?: string) => {
  return useQuery({
    queryKey: ["course", id, role],
    queryFn: () => getCoursesById(id, role),
    enabled: Boolean(id) && Boolean(role),
  });
};



export const useGetInterviews = (batchId?: string, role?: string) => {
  return useQuery({
    queryKey: ['interviews', batchId, role],
    queryFn: () => getInterviews(batchId, role),
    enabled: Boolean(role),
  });
};

export const useGetBatchwiseStudentInterview = (batchId?: string, role?: string) => {
  return useQuery({
    queryKey: ['batchwiseStudentInterview', batchId, role],
    queryFn: () => getBatchwiseStudentInterview(batchId, role),
    enabled: Boolean(batchId),
  });
};

export const useAddInterview = (role?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => addInterview(data, role),
    onSuccess: (data) => {
      console.log("Success:", data);
      toast.success("Interview assigned successfully");
      queryClient.invalidateQueries({
        queryKey: ["interviews"],
      });
      queryClient.invalidateQueries({
        queryKey: ["placement"],
      });
    },
    onError: (error: any) => {
      console.log("Error:", error);
      const message = error?.response?.data?.message || "Failed to assign interview";
      toast.error(message);
    },
  });
};

// Update Interview Mutation
export const useUpdateInterview = (role?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateInterview(id, data, role),
    onSuccess: (data) => {
      console.log("Success:", data);
      toast.success("Interview updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["interviews"],
      });
    },
    onError: (error) => {
      console.log("Error:", error);
      toast.error("Failed to update interview");
    },
  });
};

// Delete Interview Mutation
export const useDeleteInterview = (role?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInterview(id, role),
    onSuccess: (data) => {
      console.log("Success:", data);
      toast.success("Interview deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["interviews"],
      });
    },
    onError: (error) => {
      console.log("Error:", error);
      toast.error("Failed to delete interview");
    },
  });
};