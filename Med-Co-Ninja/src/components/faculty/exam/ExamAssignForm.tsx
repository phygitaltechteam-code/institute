import GenericButton from "@/components/Forms/Buttons/GenericButton";
import GenericDropdown from "@/components/Forms/DropDown/GenericDropDown"
import { useAuthContext } from "@/context/AuthContext";
import { useAssignExamToBatchMutation, useGetAllExams } from "@/lib/react-query/queriesAndMutations/examMutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form"
import z from "zod";
import { FaPlus } from "react-icons/fa";

export const ExamAssignForm = ({batchId, refetch}: {batchId: string, refetch: () => void}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const examAssignSchema = z.object({
    examId: z.string().min(1, "Please select an exam"),
  });
  
  const { user } = useAuthContext();
  const role = user?.role;

  const { data: examData, isLoading, isError } = useGetAllExams(role);
  const { mutateAsync: assignExamToBatch, isPending } = useAssignExamToBatchMutation();

  const examOptions = useMemo(() => {
    if (!examData || !examData.data) return [];
    return examData.data.map((exam: any) => ({
      value: exam.id,
      label: exam.name,
    }));
  }, [examData]);

  type ExamAssignValues = z.infer<typeof examAssignSchema>;
  
  const examAssignMethods = useForm<ExamAssignValues>({
    resolver: zodResolver(examAssignSchema),
    defaultValues: {
      examId: "",
    },
  });

  const { handleSubmit, control, reset } = examAssignMethods;

  const onSubmit = (data: ExamAssignValues) => {
    assignExamToBatch({ examId: data.examId, batchId, role }, {
      onSuccess: () => {
        refetch();
        setIsModalOpen(false);
        reset();
      }
    });
  };

  // Loading state
  if (isLoading) {
    return <div>Loading exams...</div>;
  }

  // Error state
  if (isError) {
    return <div>Error loading exams. Please try again.</div>;
  }

  return (
    <div>
      <GenericButton
        onClick={() => setIsModalOpen(true)}
        className="hover:bg-primary-navy/90 flex items-center gap-1.5 bg-primary-navy px-3 py-1.5 text-sm font-medium text-pure-white shadow-sm transition-colors"
      >
        <FaPlus className="h-3.5 w-3.5" />
        Add New
      </GenericButton>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-text-charcoal">
              Assign Exam to Batch
            </h2>
            <FormProvider {...examAssignMethods}>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="w-full">
                  <GenericDropdown
                    control={control as any}
                    name="examId"
                    label="Select Exam"
                    required={true}
                    options={examOptions}
                    placeholder="Choose an exam"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                    }}
                    className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <GenericButton
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-primary-navy  text-md font-medium text-white transition hover:bg-primary-navy/90 disabled:opacity-60"
                  >
                    {isPending ? 'Assigning...' : 'Assign'}
                  </GenericButton>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      )}
    </div>
  );
};