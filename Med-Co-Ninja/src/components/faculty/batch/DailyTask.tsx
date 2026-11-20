import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import DatePicker from '@/components/Forms/Input/DatePicker';
import { useAddDailyTaskMutation } from '@/lib/react-query/queriesAndMutations/dailytaskmutation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import { useNavigate } from '@tanstack/react-router';
import FormPageLayout from '@/components/Common/FormPageLayout';
import { role } from '@/types/auth';
import { useAuthContext } from '@/context/AuthContext';

interface DailyTaskProps {
  batchId: string;
  onSuccess?: () => void;
}

const DailyTask = ({ batchId, onSuccess }: DailyTaskProps) => {
  const navigate = useNavigate();
  const {user}= useAuthContext()
  const role = user?.role

  const taskSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    topic: z.string().min(1, 'Topic is required'),
    task: z.string().min(1, 'Task is required'),
    file: z.instanceof(File).optional(),
    video: z.instanceof(File).optional(),
  });

  type DailyTask = z.infer<typeof taskSchema>;

  const methods = useForm<DailyTask>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      date: '',
      topic: '',
      task: '',
      file: undefined,
      video: undefined,
    },
  });

  const addtask = useAddDailyTaskMutation();

  const { control, handleSubmit, reset } = methods;

  const onSubmit = (data: DailyTask) => {
    addtask.mutate(
      {
        batchId: batchId,
        date: data.date,
        topic: data.topic,
        task: data.task,
        file: data.file,
        video: data.video,
        role: role,
      },
     
      role=="ADMIN"?{
        onSuccess: () => {
          reset();
          if (onSuccess) {
            // Inline mode: just close the form
            onSuccess();
          } else {
            // Standalone route mode: navigate back to correct tab
            sessionStorage.setItem('batch-activeGroup', '1');
            sessionStorage.setItem('batch-activeSub', '0');
            navigate({
              to: '/admin/batch/batch-dashboard/$id',
              params: { id: batchId },
            });
          }
        },
      }:{
        onSuccess: () => {
          reset();
          if (onSuccess) {
            // Inline mode: just close the form
            onSuccess();
          } else {
            // Standalone route mode: navigate back to correct tab
            sessionStorage.setItem('batch-activeGroup', '1');
            sessionStorage.setItem('batch-activeSub', '0');
            navigate({
              to: '/faculty/batch/batch-dashboard/$id',
              params: { id: batchId },
            });
          }
        },
      }
    );
  };

  const handleBack = () => {
    if (onSuccess) {
      // Inline mode: just hide the form
      onSuccess();
    } else {
      // Standalone route mode: navigate back with correct tab
      sessionStorage.setItem('batch-activeGroup', '1');
      sessionStorage.setItem('batch-activeSub', '0');
      if(role=="ADMIN"){
      navigate({
        to: '/admin/batch/batch-dashboard/$id',
        params: { id: batchId },
      });
      }else{
      navigate({
        to: '/faculty/batch/batch-dashboard/$id',
        params: { id: batchId },
      });
      }
    }
  };

  return (
    <FormPageLayout
      title="Add Daily Task"
      onBack={handleBack}
      isLoading={addtask.isPending}
      loadingText="Submitting task..."
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5">
          {/* Topic */}
          <GenericInputField
            label="Topic"
            name="topic"
            placeholder="Enter topic"
            required
          />

          {/* Task */}
          <GenericInputField
            label="Task"
            name="task"
            placeholder="Enter task details"
            required
          />

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              Date <span className="text-red-500">*</span>
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  name={field.name}
                  value={field.value}
                  onDateChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            {methods.formState.errors.date && (
              <p className="mt-1 text-xs text-red-500">
                {methods.formState.errors.date.message}
              </p>
            )}
          </div>

          {/* PDF Document */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              PDF Document
            </label>
            <Controller
              control={control}
              name="file"
              render={({ field }) => (
                <input
                  type="file"
                  accept=".pdf"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm text-text-charcoal outline-none transition file:mr-2 file:rounded-full file:border-0 file:bg-primary-navy file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-primary-navy/80 focus:border-primary-navy active:border-primary-navy dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary-navy"
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              )}
            />
          </div>

          {/* Video */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              Video
            </label>
            <Controller
              control={control}
              name="video"
              render={({ field }) => (
                <input
                  type="file"
                  accept="video/*"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm text-text-charcoal outline-none transition file:mr-2 file:rounded-full file:border-0 file:bg-primary-navy file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-primary-navy/80 focus:border-primary-navy active:border-primary-navy dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary-navy"
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              )}
            />
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="mt-2 flex justify-end gap-3 md:col-span-2">
            <GenericButton
              type="button"
              onClick={handleBack}
              variant="cancel"
              className="px-5 py-1.5 sm:px-6 sm:py-2"
            >
              Cancel
            </GenericButton>
            <GenericButton
              type="submit"
              variant="navy"
              className="px-6 py-1.5 sm:px-7 sm:py-2"
              disabled={addtask.isPending}
            >
              {addtask.isPending ? 'Submitting...' : 'Add Task'}
            </GenericButton>
          </div>
        </form>
      </FormProvider>
    </FormPageLayout>
  );
};

export default DailyTask;