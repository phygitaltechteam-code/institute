import GenericTextarea from '@/components/Forms/Textarea/GenericTextarea';
import {
  useAddPlacement,
  useGetPlacementById,
  useUpdatePlacement,
} from '@/lib/react-query/queriesAndMutations/placementMutation';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { useAuthContext } from '@/context/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import FormPageLayout from '@/components/Common/FormPageLayout';
import DatePicker from '@/components/Forms/Input/DatePicker';

type PlacementFormProps = {
  placementId?: string;
};

const PlacementForm = ({ placementId }: PlacementFormProps) => {
  const { user } = useAuthContext();
  const role = user?.role;
  const { data: placementDataById, isLoading: isPlacementLoading } =
    useGetPlacementById(placementId || '', role);
  const { mutate: createPlacement, isPending: isCreating } = useAddPlacement();
  const { mutate: updatePlacement, isPending: isUpdating } = useUpdatePlacement();
  const navigate = useNavigate();

  const schema = z.object({
    companyName: z.string().min(1, 'Please enter company name'),
    jobRole: z.string().min(1, 'Please enter job role'),
    qualification: z.string().min(1, 'Please enter qualification'),
    experience: z.string().min(1, 'Please enter experience'),
    interviewDate: z.string().min(1, 'Please enter interview date'),
    interviewTime: z.string().optional(),
    interviewMode: z.string(),
    workSchedule: z.string(),
    salary: z.string(),
    deadLine: z.string().optional(),
    deadlineTime: z.string().optional(),
    jobDescription: z.string().optional(),
    requiredSkills: z.string().optional(),
    otherDetails: z.string().optional(),
    location: z.string().optional(),
  });

  type PlacementFormValues = z.infer<typeof schema>;

  const method = useForm<PlacementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      jobRole: '',
      qualification: '',
      experience: '',
      interviewDate: '',
      interviewTime: '',
      interviewMode: '',
      workSchedule: '',
      salary: '',
      deadLine: '',
      deadlineTime: '',
      jobDescription: '',
      requiredSkills: '',
      otherDetails: '',
      location: '',
    },
  });

  const { handleSubmit, control, reset, watch } = method;
  const interviewMode = watch('interviewMode');

  const isPending = isCreating || isUpdating;
  const isEditMode = Boolean(placementId);

  useEffect(() => {
    const payload = placementDataById?.data ?? placementDataById;

    if (!placementId || !payload) return;

    // Parse deadline date and time if available
    let deadlineDate = '';
    let deadlineTime = '';
    if (payload.deadLine) {
      const date = new Date(payload.deadLine);
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        // Format date as YYYY-MM-DD for date input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        deadlineDate = `${year}-${month}-${day}`;

        // Format time as HH:mm for time input
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        deadlineTime = `${hours}:${minutes}`;
      }
    }

    // Parse interview date and time
    let interviewDateValue = '';
    let interviewTimeValue = '';
    if (payload.interviewDate) {
      const date = new Date(payload.interviewDate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        interviewDateValue = `${year}-${month}-${day}`;

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        interviewTimeValue = `${hours}:${minutes}`;
      }
    }

    reset({
      companyName: payload.companyName ?? '',
      jobRole: payload.jobRole ?? '',
      qualification: payload.qualification ?? '',
      experience: payload.experience ?? '',
      interviewDate: interviewDateValue,
      interviewTime: interviewTimeValue,
      interviewMode: payload.interviewMode ?? '',
      workSchedule: payload.workSchedule ?? '',
      salary: payload.salary ?? '',
      deadLine: deadlineDate,
      deadlineTime: deadlineTime,
      jobDescription: payload.jobDescription ?? '',
      requiredSkills: payload.requiredSkills ?? '',
      otherDetails: payload.otherDetails ?? '',
      location: payload.location ?? '',
    });
  }, [placementDataById, placementId, reset]);

  const backPath =
    role === 'ADMIN'
      ? '/admin/placement/placement-list'
      : '/faculty/placement/placement-list';

  const onSubmit = (data: PlacementFormValues) => {
    // Combine deadline date and time into proper format
    let deadlineDate = null;
    if (data.deadLine && data.deadlineTime) {
      // Create date object with local time
      const date = new Date(`${data.deadLine}T${data.deadlineTime}:00`);
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        deadlineDate = date.toISOString();
      }
    }

    // Combine interview date and time as ISO string
    let interviewDateValue = '';
    if (data.interviewDate && data.interviewTime) {
      const date = new Date(`${data.interviewDate}T${data.interviewTime}:00`);
      if (!isNaN(date.getTime())) {
        interviewDateValue = date.toISOString();
      }
    } else if (data.interviewDate) {
      const date = new Date(data.interviewDate);
      if (!isNaN(date.getTime())) {
        interviewDateValue = date.toISOString();
      }
    }

    const payload = {
      companyName: data.companyName,
      jobRole: data.jobRole,
      qualification: data.qualification,
      experience: data.experience,
      interviewDate: interviewDateValue || data.interviewDate,
      interviewMode: data.interviewMode,
      workSchedule: data.workSchedule,
      salary: data.salary,
      deadLine: deadlineDate,
      jobDescription: data.jobDescription || '',
      requiredSkills: data.requiredSkills || '',
      otherDetails: data.otherDetails || '',
      location: data.location || '',
    };

    console.log('📤 Payload being sent:', payload);
    console.log('📅 deadLine:', deadlineDate);

    if (placementId) {
      updatePlacement(
        { id: placementId, payload, role },
        {
          onSuccess: () => navigate({ to: backPath }),
          onError: (error) => {
            console.error('Update error:', error);
            console.error('Error response:', error?.response?.data);
          },
        },
      );
    } else {
      createPlacement(
        { payload, role },
        {
          onSuccess: () => navigate({ to: backPath }),
          onError: (error) => {
            console.error('Registration error:', error);
            console.error('Error response:', error?.response?.data);
          },
        },
      );
    }
  };

  

  return (
    <FormPageLayout
      title={isEditMode ? 'Update Placement' : 'Add New Placement'}
      backPath={backPath}
      isLoading={isPlacementLoading}
      loadingText="Loading placement..."
    >
      <FormProvider {...method}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5"
        >
          {/* Basic Information Section */}
          <div className="md:col-span-2">
            <h2 className="text-gray-700 border-gray-200 mb-4 border-b pb-2 text-lg font-semibold">
              Basic Information
            </h2>
          </div>

          <GenericInputField
            label="Company Name"
            name="companyName"
            placeholder="Enter Company Name"
          />

          <GenericInputField
            label="Job Role"
            name="jobRole"
            placeholder="Enter Job Role"
          />

          <GenericInputField
            label="Qualification"
            name="qualification"
            placeholder="Enter Qualification"
          />

          <GenericInputField
            label="Experience"
            name="experience"
            placeholder="Enter Experience (in years)"
          />

          <GenericInputField
            label="Interview Date"
            name="interviewDate"
            type="date"
            placeholder="Select Interview Date"
          />

          <GenericInputField
            label="Interview Time"
            name="interviewTime"
            type="time"
            placeholder="Select Interview Time"
          />

          <GenericDropdown
            name="interviewMode"
            label="Interview Mode"
            options={[
              { value: 'online', label: 'Online' },
              { value: 'offline', label: 'Offline' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
            control={control as any}
          />

          {interviewMode?.toLowerCase() === 'offline' && (
            <GenericInputField
              label="Location"
              name="location"
              placeholder="Enter Location"
            />
          )}

          <GenericInputField
            label="Work Schedule"
            name="workSchedule"
            placeholder="Enter Work Schedule"
          />

          <GenericInputField
            label="Salary"
            name="salary"
            placeholder="Enter Salary"
          />

          {/* Deadline Section */}
          <div className="md:col-span-2">
            <h2 className="text-gray-700 border-gray-200 mb-4 mt-2 border-b pb-2 text-lg font-semibold">
              Deadline Details
            </h2>
          </div>

          <div className="md:col-span-1">
            <DatePicker
              control={control}
              name="deadLine"
              label="Deadline Date"
            />
          </div>

          <div className="md:col-span-1">
            <GenericInputField
              label="Deadline Time"
              name="deadlineTime"
              type="time"
              placeholder="Select Deadline Time"
            />
          </div>

          {/* Job Description Section */}
          <div className="md:col-span-2">
            <h2 className="text-gray-700 border-gray-200 mb-4 mt-2 border-b pb-2 text-lg font-semibold">
              Job Details
            </h2>
          </div>

          <div className="md:col-span-2">
            <GenericTextarea
              label="Job Description"
              name="jobDescription"
              placeholder="Enter detailed job description..."
              rows={4}
            />
          </div>

          <div className="md:col-span-2">
            <GenericTextarea
              label="Required Skills"
              name="requiredSkills"
              placeholder="Enter required skills and qualifications..."
              rows={4}
            />
          </div>

          <div className="md:col-span-2">
            <GenericTextarea
              label="Other Details"
              name="otherDetails"
              placeholder="Enter any additional details..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="mt-2 flex justify-end gap-3 md:col-span-2">
            <GenericButton
              type="button"
              onClick={() => navigate({ to: backPath })}
              variant="cancel"
              className="px-5 py-1.5 sm:px-6 sm:py-2"
            >
              Cancel
            </GenericButton>
            <GenericButton
              type="submit"
              variant="navy"
              className="px-6 py-1.5 sm:px-7 sm:py-2"
              disabled={isPending}
            >
              {isPending
                ? isEditMode
                  ? 'Updating...'
                  : 'Adding...'
                : isEditMode
                  ? 'Update Placement'
                  : 'Add Placement'}
            </GenericButton>
          </div>
        </form>
      </FormProvider>
    </FormPageLayout>
  );
};

export default PlacementForm;