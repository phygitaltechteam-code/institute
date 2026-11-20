import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {
  useUpdateDailyTaskMutation,
  useGetDailyTaskById,
} from '@/lib/react-query/queriesAndMutations/dailytaskmutation';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, FormProvider, useForm} from 'react-hook-form';
import z from 'zod';
import {useNavigate, useLocation, useParams} from '@tanstack/react-router';
import {FiFile, FiVideo, FiX} from 'react-icons/fi';
import {useEffect, useState} from 'react';
import { useAuthContext } from '@/context/AuthContext';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface UpdateTaskProps {
  batchId: string;
}

const UpdateTask = ({batchId: propBatchId}: UpdateTaskProps) => {
  const params = useParams({ strict: false });
  const id = (params as any)?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const {user} = useAuthContext();
  const role = user?.role;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  // Get batchId from state or use prop
  const batchId = (location.state as any)?.batchId || propBatchId;

  // Single task schema
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

  const updateTask = useUpdateDailyTaskMutation();
  const {data: taskData, isLoading, isError} = useGetDailyTaskById(id , role);

  const {control, handleSubmit, reset} = methods;

  // Populate form with task data when fetched
  useEffect(() => {
    const task = taskData?.data || taskData;
    if (task && task.id) {
      // Format date for input field (YYYY-MM-DD)
      const formattedDate = task.date ? task.date.split('T')[0] : '';

      console.log('Setting form values:', {
        date: formattedDate,
        topic: task.topic,
        task: task.task,
      });

      reset({
        date: formattedDate,
        topic: task.topic || '',
        task: task.task || '',
        file: undefined,
        video: undefined,
      });
    }
  }, [taskData, reset]);

  // Get file name from URL
  const getFileNameFromUrl = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const onSubmit = (data: DailyTask) => {
    // console.log('Form data:', data);
    // console.log('Task ID:', id);

    // Create FormData for update
    const formData = new FormData();

    // Append regular fields
    formData.append('date', data.date);
    formData.append('topic', data.topic);
    formData.append('task', data.task);

    // Append file as multipart if it exists
    if (data.file && data.file instanceof File) {
      formData.append('pdf', data.file);
    //   console.log(
    //     `📄 PDF attached: ${data.file.name} (${data.file.size} bytes)`,
    //   );
    }

    // Append video as multipart if it exists
    if (data.video && data.video instanceof File) {
      formData.append('video', data.video);
      console.log(
        `🎥 Video attached: ${data.video.name} (${data.video.size} bytes)`,
      );
    }

    updateTask.mutate(
      {
        taskId: id,
        data: formData,
        role:role
      },
      {
        onSuccess: () => {
          // Navigate back to tasks list after successful update
          if (role === 'ADMIN') {
            navigate({
              to: '/admin/batch/batch-dashboard/$id',
              params: {id: batchId},
            });
          } else {
            navigate({
              to: '/faculty/batch/batch-dashboard/$id',
              params: {id: batchId},
            });
          }
        },
      },
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-5 md:py-8">
        <div className="text-text-charcoal">Loading task details...</div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex justify-center py-5 md:py-8">
        <div className="text-red-500">
          Error loading task details. Please try again.
        </div>
      </div>
    );
  }

  const currentTask = taskData?.data || taskData;

  return (
    <div className='p-2'>
      <FormProvider {...methods} >
      {/* Back Button - Navigates to tasks list with batchId */}
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GenericButton
          type="button"
          className="hover:bg-primary-navy/80 flex w-fit items-center gap-2 rounded bg-primary-navy px-4 py-2 text-white"
          onClick={() => {
            if (role === 'ADMIN') {
              navigate({
                to: '/admin/batch/batch-dashboard/$id',
                 params: {id: batchId},
              });
            } else {
              navigate({
                to: '/faculty/batch/batch-dashboard/$id',
                params: {id: batchId},
              });
            }
          }}
        >
          ← Back to Tasks
        </GenericButton>
      </div>

      <div className="rounded-xl border-l-4 border-primary-navy bg-white p-3 shadow-md md:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-navy">
            Update Daily Task
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              Date <span className="text-red-500">*</span>
            </label>
            <GenericInputField name="date" type="date" />
          </div>

          {/* Topic */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              Topic <span className="text-red-500">*</span>
            </label>
            <GenericInputField defaultValue={currentTask?.topic} name="topic" placeholder="Enter topic" />
          </div>

          {/* Task */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              Task <span className="text-red-500">*</span>
            </label>
            <GenericInputField defaultValue={currentTask?.task} name="task" placeholder="Enter task details" />
          </div>

          {/* PDF */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              PDF Document
            </label>
            {currentTask?.document && (
              <div className="mb-1 flex items-center gap-2 truncate rounded bg-bg-light-mint px-2 py-1 text-xs">
                <div className="flex items-center gap-2">
                  <FiFile className="text-accent-teal" />
                  <span className="text-text-charcoal/60">Current:</span>
                  <a
                    href={currentTask.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-teal/80 text-accent-teal transition-colors"
                  >
                    {getFileNameFromUrl(currentTask.document)}
                  </a>
                </div>
              </div>
            )}
            <Controller
              control={control}
              name="file"
              render={({field}) => (
                <div className="relative rounded-sm">
                  <input
                    type="file"
                    accept=".pdf"
                    className="w-full rounded-md border border-gray-200 p-1 text-sm text-text-charcoal file:mr-2 file:rounded file:border-0 file:bg-bg-light-mint file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-navy hover:file:bg-bg-light-mint"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                      setSelectedFile(file || null);
                    }}
                  />
                  {field.value && field.value instanceof File && (
                    <div className="mt-1 flex items-center  gap-2 text-sm text-accent-teal">
                      <FiFile />
                      <span>Selected: {field.value.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange(undefined);
                          setSelectedFile(null);
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
              )}
            />
            <p className="text-text-charcoal/50 mt-1 text-xs">
              Leave empty to keep existing document
            </p>
          </div>

          {/* Video */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-charcoal">
              Video
            </label>
            {currentTask?.video && (
              <div className="mb-1 flex items-center gap-2 truncate rounded bg-bg-light-mint px-2 py-1 text-xs">
                <div className="flex items-center gap-2">
                  <FiVideo className="text-accent-teal" />
                  <span className="text-text-charcoal/60">Current:</span>
                  <a
                    href={currentTask.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-teal/80 text-accent-teal transition-colors"
                  >
                    {getFileNameFromUrl(currentTask.video)}
                  </a>
                </div>
              </div>
            )}
            <Controller
              control={control}
              name="video"
              render={({field}) => (
                <div className="relative rounded-sm">
                  <input
                    type="file"
                    accept="video/*"
                    className="w-full rounded-md border border-gray-200 p-1 text-sm text-text-charcoal file:mr-2 file:rounded file:border-0 file:bg-bg-light-mint file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-navy hover:file:bg-bg-light-mint"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                      setSelectedVideo(file || null);
                    }}
                  />
                  {field.value && field.value instanceof File && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-accent-teal">
                      <FiVideo />
                      <span>Selected: {field.value.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange(undefined);
                          setSelectedVideo(null);
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
              )}
            />
            <p className="text-text-charcoal/50 mt-1 text-xs">
              Leave empty to keep existing video
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-end gap-3">
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={updateTask.isPending}
              className={`rounded bg-primary-navy px-6 py-2 font-semibold text-pure-white transition-colors hover:bg-primary-navy ${
                updateTask.isPending ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              {updateTask.isPending ? 'Updating...' : 'Update Task'}
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: role === 'ADMIN' ? '/admin/batch/batch-dashboard/$id' : '/faculty/batch/batch-dashboard/$id', params: { id: batchId } })}
              className="bg-gray-500 hover:bg-gray-600 rounded px-6 py-2 font-semibold text-pure-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </FormProvider>
    </div>
    
  );
};

export default UpdateTask;
