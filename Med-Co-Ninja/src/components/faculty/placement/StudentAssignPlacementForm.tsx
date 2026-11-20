import GenericButton from "@/components/Forms/Buttons/GenericButton";
import GenericDropdown from "@/components/Forms/DropDown/GenericDropDown";
import { useAuthContext } from "@/context/AuthContext";
import { useGetStudent } from "@/lib/react-query/queriesAndMutations/studentDetails";
import { useAssignStudentToPlacement } from "@/lib/react-query/queriesAndMutations/placementStudentMutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";
import GenericInputField from "@/components/Forms/Input/GenericInputField";

export const StudentAssignPlacementForm = ({
  placementId,
  onSuccess,
}: {
  placementId: string;
  onSuccess?: () => void;
}) => {
  const { user } = useAuthContext();
  const role = user?.role;

  const { data: studentData, isLoading: isStudentsLoading } = useGetStudent(role);
  const { mutate: assignStudent, isPending } = useAssignStudentToPlacement();

  // Build dropdown options from API response
  const studentList =
    studentData?.data?.data?.data ?? studentData?.data?.data ?? [];
  const options = studentList.map((s: any) => ({
    label: s.user?.fullname ?? s.id,
    value: s.id,
  }));

  const schema = z.object({
    studentId: z.string().min(1, "Please select a student"),
    interviewLocation: z.string().min(1, "Please enter interview location"),
    interviewTime: z.string().min(1, "Please enter interview time"),
    interviewDate: z.string().min(1, "Please enter interview date"),
    interviewMode: z.string().min(1, "Please enter interview mode"),
  });

  type FormValue = z.infer<typeof schema>;

  const methods = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: "" , interviewLocation: "", interviewTime: "", interviewDate: "", interviewMode: "" },
  });

  const { handleSubmit, control, reset } = methods;
  const onSubmit = (data: FormValue) => {
    console.log('Submitting with:', {
      studentId: data.studentId,
      placementId: placementId,
      role: role
    });

    assignStudent(
      {
        payload: {
          studentId: data.studentId,
          placementId: placementId,
          interviewLocation: data.interviewLocation,
          interviewTime: data.interviewTime,
          interviewDate: data.interviewDate,
          interviewMode: data.interviewMode,
        },
        role,
      },
      {
        onSuccess: () => {
          reset();
          if (onSuccess) {
            onSuccess();
          }
        },
      },
    );
  };

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h1 className="mb-4 text-lg font-semibold">Assign Student to Placement</h1>

          {isStudentsLoading ? (
            <p className="text-sm text-text-charcoal">Loading students...</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-text-charcoal">No students available.</p>
          ) : (
            <div className="flex flex-col gap-2">
                 <GenericDropdown
              label="Select Student"
              options={options}
              control={control as any}
              name="studentId"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <GenericInputField
                label="Interview Location"
                name="interviewLocation"
                required
              />
              <GenericInputField
                label="Interview Time"
                type="time"
                name="interviewTime"
                required
              />
              <GenericInputField
                label="Interview Date"
                type="date"
                name="interviewDate"
                required
              />
              <GenericDropdown
                label="Interview Mode"
                name="interviewMode"
                control={control as any}
                options={[
                  { label: "Online", value: "online" },
                  { label: "Offline", value: "offline" },
                ]}
                defaultOption="Select Mode"
                required
              />
            </div>

            </div>
         

            
          )}
         

          <div className="mt-4">
            <GenericButton
              type="submit"
              disabled={isPending || isStudentsLoading}
              className="rounded-lg bg-accent-teal text-lg font-semibold text-pure-white shadow-lg hover:bg-primary-navy disabled:opacity-60"
            >
              {isPending ? "Assigning..." : "Assign Student"}
            </GenericButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};