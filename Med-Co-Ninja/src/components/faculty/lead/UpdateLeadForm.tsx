import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthContext } from '@/context/AuthContext';
import { useGetCourses } from '@/mutations/courseMutation';
import { useGetFaculties } from '@/lib/react-query/queriesAndMutations/queryMutation';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import {
  useGetLeadById,
  useUpdateLeadMutation,
} from '@/lib/react-query/queriesAndMutations/LeadMutation';
import { Route } from '@/routes/_app/_admin/admin/lead/updatelead.$id';
import { useEffect } from 'react';

const UpdateLeadForm = () => {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCourses(user?.role);

  // Fetch faculties
  const { data: facultyData, isLoading: facultyLoading } = useGetFaculties();

  // Fetch batches
  const { data: batchData, isLoading: batchLoading } = useGetBatches(user?.role);

  // Fetch lead data by ID
  const {
    data: leadData,
    isLoading: leadLoading,
    isError: leadError,
  } = useGetLeadById(id, user?.role);

  // Update Lead Mutation
  const updateLeadMutation = useUpdateLeadMutation();

  // Get batchId from state - with debug logs
  const batchId = (location.state as any)?.batchId || '';

  console.log('UpdateLeadForm - Location state:', location.state);
  console.log('UpdateLeadForm - Batch ID from state:', batchId);
  console.log('UpdateLeadForm - Lead ID:', id);

  // Transform courses data for dropdown
  const courseOptions =
    coursesData?.data?.data?.map((course: any) => ({
      label: course.name,
      value: course.id,
    })) || [];

  // Transform faculty data for dropdown
  const facultyOptions =
    facultyData?.data?.map((faculty: any) => ({
      label: faculty.fullname || faculty.username || faculty.email || 'Unknown',
      value: faculty.id,
    })) || [];

  // Transform batch data for dropdown
  const batchOptions =
    batchData?.data?.map((batch: any) => ({
      label: `${batch.name} (${batch.course?.name || 'No Course'})`,
      value: batch.id,
    })) || [];

  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    phoneNumber: z
      .string()
      .min(10, 'Phone number must be 10 digits')
      .max(10, 'Phone number must be 10 digits'),
    source: z.string().optional(),
    courseId: z.string().min(1, 'Course is required'),
    qualification: z.string().optional(),
    interested: z.string().optional(),
    teacherId: z.string().optional(),
    batchType: z.string().optional(),
    batchId: z.string().optional(),
    collegeName: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      source: '',
      courseId: '',
      qualification: '',
      interested: '',
      teacherId: '',
      batchType: '',
      batchId: '',
      collegeName: '',
    },
  });

  const { handleSubmit, control, reset } = methods;

  // Populate form with lead data when fetched
  useEffect(() => {
    if (leadData) {
      const lead = leadData;
      console.log('Populating form with lead data:', lead);

      reset({
        name: lead.name || '',
        phoneNumber: lead.phoneNumber || '',
        source: lead.source || '',
        courseId: lead.courseId || '',
        qualification: lead.qualification || '',
        interested: lead.interested ? 'Yes' : 'No',
        teacherId: lead.teacherId || '',
        batchType: lead.batchType || '',
        batchId: lead.batchId || '',
        collegeName: lead.collegeName || '',
      });
    }
  }, [leadData, reset]);

  const onSubmit = (data: FormValues) => {
    console.log('Form Data:', data);

    const leadData = {
      name: data.name,
      phoneNumber: data.phoneNumber,
      source: data.source || undefined,
      courseId: data.courseId,
      qualification: data.qualification || undefined,
      interested: data.interested === 'Yes' ? true : false,
      teacherId: data.teacherId || undefined,
      batchType: data.batchType || undefined,
      batchId: data.batchId || undefined,
      collegeName: data.collegeName || undefined,
    };

    updateLeadMutation.mutate(
      { leadId: id, data: leadData, role: user?.role },
      {
        onSuccess: () => {
          console.log(
            'Update successful, navigating back with batchId:',
            batchId,
          );
          navigate({
            to: `/admin/batch/batch-dashboard/${batchId}`,
            state: { activeTab: 'lead' },
          });
        },
      },
    );
  };

  // Handle back navigation
  const handleBack = () => {
    console.log('Going back to dashboard with batchId:', batchId);
    if (batchId) {
      navigate({
        to: `/admin/batch/batch-dashboard/${batchId}`,
        state: { activeTab: 'lead' },
      });
    } else {
      // Fallback if batchId is missing
      navigate({
        to: '/admin/batch/batch-dashboard',
      });
    }
  };

  // Show loading state
  if (coursesLoading || facultyLoading || batchLoading || leadLoading) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl bg-pure-white p-6 shadow-lg">
        <div className="flex items-center justify-center py-6 md:py-12">
          <div className="text-center">
            <div className="mb-4 text-4xl">⏳</div>
            <p className="text-text-charcoal">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (leadError) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl bg-pure-white p-6 shadow-lg">
        <div className="flex items-center justify-center py-6 md:py-12">
          <div className="text-center">
            <div className="mb-4 text-4xl">❌</div>
            <p className="text-red-500">
              Error loading lead data. Please try again.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 rounded-lg bg-primary-navy px-6 py-2 text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl rounded-xl bg-pure-white p-6 shadow-lg">
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="bg-gray-100 hover:bg-gray-200 flex items-center gap-2 rounded-lg px-4 py-2 text-text-charcoal transition"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-text-charcoal">Update Lead</h1>
        <div className="w-[140px]"></div>
      </div>

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <GenericInputField
            label="Name"
            name="name"
            placeholder="Enter Name"
            required
          />

          <GenericInputField
            label="Phone Number"
            name="phoneNumber"
            placeholder="Enter 10-digit Phone Number"
            required
          />

          <GenericInputField
            label="Source"
            name="source"
            placeholder="Enter Source"
          />

          <GenericDropdown
            control={control as any}
            label="Course"
            name="courseId"
            options={courseOptions}
            placeholder="Select Course"
            required
          />

          <GenericInputField
            label="Qualification"
            name="qualification"
            placeholder="Enter Qualification"
          />

          <GenericInputField
            label="Interested"
            name="interested"
            placeholder="Yes / No"
          />

          <GenericDropdown
            label="Faculty"
            name="teacherId"
            control={control as any}
            options={facultyOptions}
            placeholder="Select Faculty"
          />

          <GenericDropdown
            label="Batch Type"
            name="batchType"
            control={control as any}
            options={[
              { label: 'Online', value: 'ONLINE' },
              { label: 'Offline', value: 'OFFLINE' },
            ]}
          />

          <GenericDropdown
            label="Batch"
            name="batchId"
            control={control as any}
            options={batchOptions}
            placeholder="Select Batch"
          />

          <div className="md:col-span-2">
            <GenericInputField
              label="College Name"
              name="collegeName"
              placeholder="Enter College Name"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={handleBack}
              className="bg-gray-300 hover:bg-gray-400 rounded-lg px-4 md:px-8 py-2.5 font-medium text-text-charcoal transition"
            >
              Cancel
            </button>
            <GenericButton
              type="submit"
              disabled={updateLeadMutation.isPending}
              className={`rounded-lg bg-primary-navy px-4 md:px-8 py-2.5 font-medium text-pure-white transition hover:bg-primary-navy ${updateLeadMutation.isPending
                  ? 'cursor-not-allowed opacity-50'
                  : ''
                }`}
            >
              {updateLeadMutation.isPending ? 'Updating...' : 'Update Lead'}
            </GenericButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default UpdateLeadForm;
