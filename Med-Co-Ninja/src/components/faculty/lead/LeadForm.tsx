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
import { useGetBatchById, useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useCreateLeadMutation } from '@/lib/react-query/queriesAndMutations/LeadMutation';
import { useGetStudent } from '@/lib/react-query/queriesAndMutations/studentDetails';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouterState } from '@tanstack/react-router';

const LeadForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const role = user?.role;


  
  // const location = useRouterState({
  //   select: (state) => state.location,
  // });

  // const batchId = location.state?.batchId;

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCourses(role);

  // Fetch faculty
  const { data: facultyData, facultyLoading, isError, refetch } = useGetFaculties(role);

  // Fetch batches
  const { data: batchData, isLoading: batchLoading } = useGetBatches(role);

  // Fetch students for referral dropdown
  const { data: studentsData, isLoading: studentsLoading } = useGetStudent(role);

  // Create Lead Mutation
  const createLeadMutation = useCreateLeadMutation();

  // Get batchId from state or location
  const batchId = (location.state as any)?.batchId || '';


  const {data : BatchDataById , isLoading: BatchDataByIdLoading} = useGetBatchById(batchId,role );

  console.log(    "Batch Data By Id :" , BatchDataById);
  const defaultValuesLead = {
    
    courseId:BatchDataById?.courseId ||'',
    batchId:BatchDataById?.id ||'',
    bacthtype:BatchDataById?.batchType ||'',
    faculty:BatchDataById?.teacher?.id || ''
  
  
  }

  console.log("defaultValuesLead" , defaultValuesLead)



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

  // Transform student data for referral dropdown
  const studentOptions =
    studentsData?.data?.data?.map((student: any) => ({
      label: student.user?.fullname || student.fullname || student.name || 'Unknown Student',
      value: student.id || student._id,
    })) || [];

  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    phoneNumber: z.string().min(10, 'Phone number must be 10 digits').max(10, 'Phone number must be 10 digits'),
    source: z.string().optional(),
    courseId: z.string().optional(),
    qualification: z.string().optional(),
    interested: z.string().optional(),
    teacherId: z.string().optional(),
    batchType: z.string().optional(),
    batchId: z.string().optional(),
    collegeName: z.string().optional(),
    referId: z.string().optional(), // Add referId field
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
      batchId: batchId || '',
      collegeName: '',
      referId: '',
    },
  });



  const { handleSubmit, control, watch } = methods;
  const selectedCourse = watch('courseId');
  const selectedSource = watch('source');

  // Filter batch options based on selected course
  const filteredBatchOptions = selectedCourse
    ? batchOptions.filter((batch: any) => {
      const batchCourseId = batchData?.data?.find((b: any) => b.id === batch.value)?.courseId;
      return batchCourseId === selectedCourse;
    })
    : batchOptions;

  const onSubmit = (data: FormValues) => {
    const leadData = {
      name: data.name,
      phoneNumber: data.phoneNumber,
      source: data.source || undefined,
      courseId: defaultValuesLead.courseId||undefined,
      qualification: data.qualification || undefined,
      interested: data.interested || undefined,
      teacherId: defaultValuesLead.faculty || undefined,
      batchType: defaultValuesLead.bacthtype || undefined,
      batchId: defaultValuesLead.batchId || undefined,
      collegeName: data.collegeName || undefined,
      referId: data.source === 'REFRAL' ? data.referId : undefined, // Only send referId if source is REFRAL
    };

    createLeadMutation.mutate(
      { data: leadData, role: role },
      {
        onSuccess: () => {
          if (role === 'ADMIN') {
            navigate({
              to: `/admin/batch/batch-dashboard/${batchId}`,
            });
          } else {
            navigate({
              to: `/faculty/batch/batch-dashboard/${batchId}`,
            });
          }
        },
      }
    );
  };

  const handleBack = () => {
    if (role === 'ADMIN') {
      navigate({
        to: `/admin/batch/batch-dashboard/${batchId}`,
      });
    } else {
      navigate({
        to: `/faculty/batch/batch-dashboard/${batchId}`,
      });
    }
  };

  // Show loading state
  if (coursesLoading || facultyLoading || batchLoading || studentsLoading) {
    return (
      <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6">
        <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 md:p-8 shadow-lg">
          <div className="flex items-center justify-center py-6 md:py-12">
            <div className="text-center">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-4 border-primary-navy border-t-transparent"></div>
              <p className="text-text-charcoal">Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6">
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
          Add New Lead
        </h1>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <GenericInputField
                label="Name"
                name="name"
                placeholder="Enter Name"
                required
              />

              {/* Phone Number */}
              <GenericInputField
                label="Phone Number"
                name="phoneNumber"
                placeholder="Enter 10-digit Phone Number"
                required
              />

              {/* Source */}
              <GenericDropdown
                label="Source"
                name="source"
                control={control as any}
                options={[
                  { label: 'Website', value: 'WEBSITE' },
                  { label: 'Referral', value: 'REFRAL' },
                ]}
                placeholder="Select Source"
              />

              {/* Referral Dropdown - Only show when source is REFRAL */}
              {selectedSource === 'REFRAL' && (
                <GenericDropdown
                  label="Referred By (Student)"
                  name="referId"
                  control={control as any}
                  options={studentOptions}
                  placeholder="Select Student"
                  required={selectedSource === 'REFRAL'}
                />
              )}

              {/* Course Dropdown */}
              {/* <GenericDropdown
                control={control as any}
                label="Course"
                name="courseId"
                options={courseOptions}
                placeholder="Select Course"
                required
              /> */}

              {/* Qualification */}
              <GenericInputField
                label="Qualification"
                name="qualification"
                placeholder="Enter Qualification"
              />

              {/* Interested */}
              <GenericDropdown
                label="Interested"
                name="interested"
                control={control as any}
                options={[
                  { label: 'Warm', value: 'WARM' },
                  { label: 'Win', value: 'WIN' },
                  { label: 'Cold', value: 'COLD' },
                ]}
                placeholder="Select Interested"
              />

              {/* Faculty Dropdown */}
              {/* <GenericDropdown
                label="Faculty"
                name="teacherId"
                control={control as any}
                options={facultyOptions}
                placeholder="Select Faculty"
              /> */}

              {/* Batch Type Dropdown */}
              {/* <GenericDropdown
                label="Batch Type"
                name="batchType"
                control={control as any}
                options={[
                  { label: 'Online', value: 'ONLINE' },
                  { label: 'Offline', value: 'OFFLINE' },
                ]}
                placeholder="Select Batch Type"
              /> */}

              {/* Batch Dropdown - Filtered by Course */}
              {/* <GenericDropdown
                label="Batch"
                name="batchId"
                control={control as any}
                options={filteredBatchOptions}
                placeholder={selectedCourse ? "Select Batch" : "Select Course First"}
                disabled={!selectedCourse}
              /> */}

              {/* College Name - Full Width */}
              <div className="md:col-span-2">
                <GenericInputField
                  label="College Name"
                  name="collegeName"
                  placeholder="Enter College Name"
                />
              </div>
            </div>

            {/* Submit Button */}
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
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? 'Creating...' : 'Add Lead'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default LeadForm;