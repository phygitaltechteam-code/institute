import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthContext } from '@/context/AuthContext';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTextarea from '@/components/Forms/Textarea/GenericTextarea';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import DatePicker from '@/components/Forms/Input/DatePicker';
import { FiSave } from 'react-icons/fi';
import {
  useAddAssignment,
  useGetAssignmentById,
  useUpdateAssignment
} from '@/lib/react-query/queriesAndMutations/assignmentMutation';
import FormPageLayout from '@/components/Common/FormPageLayout';

type AssignmentFormProps = {
  assignmentId?: string;
  batchId?: string;
  onSuccess?: () => void;
}

const Assignment = ({ assignmentId, batchId: propBatchId, onSuccess }: AssignmentFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const params = useParams({ strict: false });
  const batchId = propBatchId || params.batchId || params.id;
  const role = user?.role;
  const basePath = role === 'ADMIN' ? '/admin' : '/faculty';

  // Get assignment data if editing
  const { data: assignmentData, isLoading: isAssignmentLoading } = useGetAssignmentById(
    assignmentId || '',
    role
  );

  // Mutations
  const { mutate: createAssignment, isPending: isCreating } = useAddAssignment(role);
  const { mutate: updateAssignment, isPending: isUpdating } = useUpdateAssignment(role);

  // Form Schema
  const schema = z.object({
    name: z.string().min(1, 'Assignment name is required'),
    attachment: z.any().optional(),
    description: z.string().min(1, 'Description is required'),
    remark: z.string().optional(),
    deadline: z.string().min(1, 'Deadline is required'),
  });

  type AssignmentFormValues = z.infer<typeof schema>;

  // React Hook Form
  const methods = useForm<AssignmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      attachment: null,
      description: '',
      remark: '',
      deadline: '',
    },
  });

  const { handleSubmit, control, reset, setValue } = methods;
  const [fileName, setFileName] = useState<string>('');

  // Populate form when editing
  useEffect(() => {
    if (assignmentId && assignmentData) {
      const payload = assignmentData?.data ?? assignmentData;
      reset({
        name: payload?.name || '',
        description: payload?.description || '',
        remark: payload?.remark || '',
        deadline: payload?.deadline ? payload.deadline.split('T')[0] : '',
      });
      if (payload?.attachment) {
        setFileName(payload.attachment.split('/').pop() || '');
      }
    }
  }, [assignmentData, assignmentId, reset]);

  // Handle form submission
  const onSubmit = async (data: AssignmentFormValues) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('deadline', data.deadline);
    if (data.remark) {
      formData.append('remark', data.remark);
    }
    if (data.attachment instanceof File) {
      formData.append('pdf', data.attachment);
    }
    if (batchId) {
      formData.append('batchId', batchId);
    }

    if (assignmentId) {
      updateAssignment(
        { id: assignmentId, payload: formData, role },
        {
          onSuccess: () => {
            reset();
            if (onSuccess) {
              onSuccess();
            } else {
              // Navigate based on role
              const path = role === 'ADMIN' ? '/admin/batch/batch-dashboard/$id' : '/faculty/batch/batch-dashboard/$id';
              sessionStorage.setItem('batch-activeGroup', '1');
              sessionStorage.setItem('batch-activeSub', '4');
              navigate({
                to: path,
                params: { id: batchId },
              });
            }
          }
        }
      );
    } else {
      createAssignment(
        { payload: formData, role },
        {
          onSuccess: () => {
            reset();
            if (onSuccess) {
              onSuccess();
            } else {
              // Navigate based on role
              const path = role === 'ADMIN' ? '/admin/batch/batch-dashboard/$id' : '/faculty/batch/batch-dashboard/$id';
              sessionStorage.setItem('batch-activeGroup', '1');
              sessionStorage.setItem('batch-activeSub', '4');
              navigate({
                to: path,
                params: { id: batchId },
              });
            }
          }
        }
      );
    }
  };

  const handleBack = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      // Navigate based on role
      const path = role === 'ADMIN' ? '/admin/batch/batch-dashboard/$id' : '/faculty/batch/batch-dashboard/$id';
      sessionStorage.setItem('batch-activeGroup', '1');
      sessionStorage.setItem('batch-activeSub', '4');
      navigate({
        to: path,
        params: { id: batchId },
      });
    }
  };

  // Loading state
  if (assignmentId && isAssignmentLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl bg-pure-white p-3 shadow-lg sm:p-5">
        <p className="text-center text-text-charcoal">Loading assignment...</p>
      </div>
    );
  }

  return (
    <FormPageLayout
      title={assignmentId ? 'Update Assignment' : 'Add New Assignment'}
      onBack={handleBack}
      isLoading={isCreating || isUpdating}
      loadingText={assignmentId ? 'Updating assignment...' : 'Creating assignment...'}
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Assignment Name - Full Width */}
          <GenericInputField
            label="Assignment Name"
            name="name"
            placeholder="Enter assignment name"
            className="w-full"
            required
          />

          {/* Attachment and Deadline - Side by Side */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Attachment */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text-charcoal">
                Attachment
              </label>
              <Controller
                control={control}
                name="attachment"
                render={({ field }) => (
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm text-text-charcoal outline-none transition file:mr-2 file:rounded-full file:border-0 file:bg-primary-navy file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-primary-navy/80 focus:border-primary-navy active:border-primary-navy dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary-navy"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFileName(file.name);
                        field.onChange(file);
                      }
                    }}
                  />
                )}
              />
              {fileName && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ {fileName} selected
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Upload assignment file (PDF, DOC, DOCX, or ZIP)
              </p>
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text-charcoal">
                Deadline <span className="text-red-500">*</span>
              </label>
              <Controller
                name="deadline"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    name={field.name}
                    value={field.value}
                    onDateChange={field.onChange}
                    error={fieldState.error?.message}
                    placeholder="DD/MM/YYYY"
                  />
                )}
              />
              {methods.formState.errors.deadline && (
                <p className="mt-1 text-xs text-red-500">
                  {methods.formState.errors.deadline.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <GenericTextarea
            label="Description"
            name="description"
            placeholder="Enter assignment description"
            rows={4}
            className="w-full"
            required
          />

          {/* Remark */}
          <GenericTextarea
            label="Remark (Optional)"
            name="remark"
            placeholder="Enter any additional remarks"
            rows={3}
            className="w-full"
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-gray-700">
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
              className="flex items-center gap-2 px-6 py-2 text-base font-semibold"
              disabled={isCreating || isUpdating}
            >
              <FiSave size={18} />
              {assignmentId ? 'Update Assignment' : 'Create Assignment'}
            </GenericButton>
          </div>
        </form>
      </FormProvider>
    </FormPageLayout>
  );
};

export default Assignment;