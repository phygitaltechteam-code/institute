import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import z from 'zod';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useGetCourses } from '@/mutations/courseMutation';
import GenericInputField from '../Forms/Input/GenericInputField';
import GenericDropdown from '../Forms/DropDown/GenericDropDown';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useGetCourse, useGetStudentReferal, useReferalForm } from '@/lib/react-query/queriesAndMutations/studentReferalFormMuta';
import GenericTable from '../Forms/Table/GenericTable';


const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  phoneNumber: z.string().min(10, { message: 'Valid contact number is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  courseId:z.string().min(1,{message:'course'}) ,
  pursuing: z.string().min(1),
  college: z.string().optional(),
  degree: z.string().min(1, { message: 'Degree is required' }),
  mode: z.string().min(1)
});

type FormValues = z.infer<typeof schema>;



const StudentReferalForm = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const {data:referalStudent}=useGetStudentReferal()
    console.log("referal", referalStudent)

  const {mutate:referalFormSubmit} = useReferalForm();

const {data:getCourse}=useGetCourse();
    // const { mutate: addEnroll, isError, error } = useEnroll();
console.log("get course",getCourse);

const courseData = getCourse?.data?.map((item: any) => {
  return {
    value: item.id,
    label: item.name,
  };
});

console.log("course data",courseData);

  const method = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      courseId: '',
      pursuing: '',
      college: '',
      degree: '',
      mode: ''
    }
  });

//    "id": "b5d39a7d-4042-4c16-9afe-138b43f913c1",
//             "name": "Demo",
//             "phoneNumber": "7418529630",
//             "email": "demo@phygitaltech.in",
//             "source": null,
//             "courseId": "c15e401f-db06-468a-b23e-cfa91ad9aafc",
//             "pursing": null,
//             "interested": "COLD",
//             "teacherId": null,
//             "mode": "ONLINE",
//             "qualification": null,
//             "batchId": null,
//             "referId": "b3454c15-ec74-4d07-8a00-5ee03cafceb3",
//             "collegeName": null,
//             "degree": null,
//             "status": "NEW",
//             "createdAt": "2026-08-07T09:17:36.796Z",
//             "updatedAt": "2026-08-07T09:17:36.796Z",
//             "course": {
//                 "id": "c15e401f-db06-468a-b23e-cfa91ad9aafc",
//                 "name": "java",
//                 "adminId": "53dab725-9d1a-4a44-97b7-cbbe0564bf37"
//             },
//             "batch": null


  const referalMapData = (referalStudent?.data || referalStudent || []).map((item:any) => {
    return {
        id: item.id,
        referalName: item.name,
        referalNo: item.phoneNumber,
        email: item.email,
        courseName: item.course?.name || '-',
        college:item.collegeName||'-',
degree:item.degree||'-',
        mode: item.mode || '-',
        status: item.status || 'NEW',
        date: item.createdAt ? formatDateTimeAuto(item.createdAt) : '-',
    }
  });

  console.log("referalMapData", referalMapData)

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Name', accessor: 'referalName' },
    { header: 'Contact No', accessor: 'referalNo' },
    { header: 'Email', accessor: 'email' },
    { header: 'Course', accessor: 'courseName' },
    { header: 'College', accessor: 'college' },
    { header: 'Degree', accessor: 'degree' },
    { header: 'Mode', accessor: 'mode' },
    { header: 'Status', accessor: 'status' }
  ];
  const { handleSubmit, control, formState: { errors } } = method;

  const onSubmit = (data: FormValues) => {
    console.log("Enrollment Data:", data);
    referalFormSubmit(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      }
    });
    method.reset();
  };



  return (
    <div className="p-2 md:p-2">
      {/* Header section with title and button */}
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <div>
          <h1 className="text-lg font-bold text-primary-navy dark:text-white sm:text-xl">
            Referrals
          </h1>
          <p className="text-sm text-text-charcoal dark:text-gray-400">
            View and add student referrals
          </p>
        </div>
        
        <GenericButton
          onClick={() => setIsFormOpen(true)}
          variant="navy"
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add Referral
        </GenericButton>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <GenericTable data={referalMapData} columns={columns} searchAble={true} />
      </div>

      {/* Modal Popup for Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-primary-navy rounded-xl max-w-3xl w-full max-h-[90dvh] overflow-y-auto p-4 shadow-2xl sm:p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-primary-navy dark:text-white">
                  Add Referral Form
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  method.reset();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <FormProvider {...method}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <GenericInputField
                    label="Full Name"
                    name="name"
                    placeholder="Enter full name"
                    required
                  />

                  <GenericInputField
                    label="Contact Number"
                    name="phoneNumber"
                    placeholder="Enter phone number"
                    type="tel"
                    required
                  />

                  <GenericInputField
                    label="Email Address"
                    name="email"
                    placeholder="Enter email"
                    type="email"
                    required
                  />

                  <GenericDropdown
                    label="Are you pursuing a degree?"
                    name="pursuing"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' }
                    ]}
                    control={control}
                    required
                  />

                  <GenericInputField
                    label="College Name (Optional)"
                    name="college"
                    placeholder="Enter college name"
                  />

                  <GenericInputField
                    label="Highest Degree"
                    name="degree"
                    placeholder="Enter degree"
                    required
                  />

                  <GenericDropdown
                    label="Select Course"
                    name="courseId"
                    options={courseData || []}
                    control={control}
                    required
                  />

                  <GenericDropdown
                    label="Preferred Learning Mode"
                    name="mode"
                    options={[
                      { value: 'ONLINE', label: 'Online' },
                      { value: 'OFFLINE', label: 'Offline' }
                    ]}
                    control={control}
                    required
                  />
                </div>

                <div className="flex justify-end pt-4 gap-3 border-t border-gray-100 dark:border-gray-700 mt-6 pt-4">
                  <GenericButton 
                    type="button" 
                    variant="cancel"
                    onClick={() => {
                      setIsFormOpen(false);
                      method.reset();
                    }}
                  >
                    Cancel
                  </GenericButton>
                  <GenericButton 
                    type="submit" 
                    variant="navy"
                  >
                    Submit Referral
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

export default StudentReferalForm;
