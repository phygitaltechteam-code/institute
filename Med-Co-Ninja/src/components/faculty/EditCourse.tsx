import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import GenericInputField from "../Forms/Input/GenericInputField";
import GenericButton from "../Forms/Buttons/GenericButton";

import {
  useGetCourseById,
  useUpdateCourse,
} from "@/mutations/courseMutation";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/context/AuthContext";
import { FaArrowLeft } from "react-icons/fa";

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

type Props = {
  courseId: string;
};

const EditCourse = ({ courseId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role;
  const { mutateAsync: updateCourse, isPending } = useUpdateCourse();
  const { data, isLoading } = useGetCourseById(courseId, role);

  const methods = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
    },
  });

  const { reset, handleSubmit } = methods;

  // ✅ FIX: correct response handling
  useEffect(() => {
    if (data?.data) {
      methods.reset({
        name: data.data.name,
      });
    }
  }, [data]);

  const onSubmit = async (formData: CourseFormValues) => {
    await updateCourse({
      id: courseId,
      data: formData,
      role,
    }).then(() => {
      navigate({
        to: '/admin/add-course',
      });
    });
  };

  const handleBack = () => {
   role =="ADMIN" ? navigate({ to: '/admin/add-course' }) : navigate({ to: '/faculty/add-course' });
  };

  if (isLoading) return <div className="p-4 md:p-8 text-center">Loading course...</div>;

  return (
    <div className="mx-auto  p-3 sm:p-4 md:p-6">
      {/* Header with Back Button and Title */}
      <div className="mb-4 flex flex-wrap items-center gap-3 sm:mb-5 md:mb-6">
        <GenericButton
          onClick={handleBack}
          variant="navy"
          aria-label="Go back"
        >

          <span>← Back</span>
        </GenericButton>
        <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
          Edit Course
        </h1>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <GenericInputField
                label="Course Name"
                name="name"
                placeholder="Enter course name"
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
              <GenericButton
                type="button"
                onClick={handleBack}
                variant="cancel"
                className="px-6 py-2"
              >
                Cancel
              </GenericButton>
              <GenericButton
                type="submit"
                variant="navy"
                className="px-4 md:px-8 py-2 text-base font-semibold"
                disabled={isPending}
              >
                {isPending ? "Updating..." : "Update Course"}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default EditCourse;