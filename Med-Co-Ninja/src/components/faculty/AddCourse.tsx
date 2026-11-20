import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useState } from 'react';

import GenericInputField from '../Forms/Input/GenericInputField';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useAddCourse, useGetCourses } from '@/mutations/courseMutation';
import { useDeleteCourse } from '@/mutations/courseMutation';
import { useNavigate } from '@tanstack/react-router';
import GenericTable, { Column } from '../Forms/Table/GenericTable';
import { useAuthContext } from '@/context/AuthContext';
import PageHeader from '@/components/Common/PageHeader';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface Course {
  id: string;
  name: string;
}

const AddCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role;
  const [isAdding, setIsAdding] = useState(false);
  const { mutateAsync: addCourse } = useAddCourse();
  const { mutateAsync: deleteCourse } = useDeleteCourse(role);

  // GET
  const { data: courses, isLoading, refetch } = useGetCourses(role);

  const methods = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (data: CourseFormValues) => {
    await addCourse({ data, role });
    reset();
    setIsAdding(false);
    refetch();
  };

  const handleBack = () => {
    setIsAdding(false);
    reset();
  };

  const handleCancel = () => {
    setIsAdding(false);
    reset();
  };

  const handleEdit = (id: string) => {
    role ==='ADMIN'? navigate({
      to: '/admin/edit-course/$courseId',
      params: { courseId: id },
    }):navigate({
      to: '/faculty/edit-course/$courseId',
      params: { courseId: id },
    });
  };

  const handleDelete = async (id: string) => {
    confirmAlert({
      title: 'Confirm Delete',
      message:
        'Are you sure you want to delete this course? This action cannot be undone.',
      buttons: [
        {
          label: 'Delete',
          onClick: async () => {
            try {
              await deleteCourse(id);
              refetch();
            } catch (error) {
              console.log(error);
            }
          },
          className:
            'bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition',
        },
        {
          label: 'Cancel',
          onClick: () => { },
          className:
            'bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition ml-2',
        },
      ],
      overlayClassName: 'react-confirm-alert-overlay-custom',
      customUI: ({ onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border-l-4 border-red-600 bg-white p-4 md:p-8 shadow-2xl">
            <h1 className="mb-3 text-xl font-bold text-text-charcoal">
              Confirm Delete
            </h1>
            <p className="mb-6 text-base leading-relaxed text-text-charcoal">
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onClose()}
                className="bg-gray-300 hover:bg-gray-400 rounded-lg px-6 py-2 font-semibold text-text-charcoal transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteCourse(id);
                    refetch();
                  } catch (error) {
                    console.log(error);
                  }
                  onClose();
                }}
                className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ),
    });
  };

  // Define columns for GenericTable
  const columns: Column<Course>[] = [
    {
      header: 'Course Name',
      accessor: 'name',
      render: (item: Course) => (
        <span className="text-gray-800 font-medium">{item.name}</span>
      ),
    },
  ];

  const handleEditCourse = (item: Course) => {
    handleEdit(item.id);
  };

  const handleDeleteCourse = (item: Course) => {
    handleDelete(item.id);
  };

  return (
    <div className="mx-auto  p-3 sm:p-4 md:p-6">
      {/* Header with Back Button and Title */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdding ? (
            <GenericButton
              onClick={handleBack}
              variant="navy"
              aria-label="Go back"
            >
              <span>← Back</span>
            </GenericButton>
          ) : null}
          <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
            {isAdding ? 'Add New Course' : 'Course Management.'}
          </h1>
        </div>
        {!isAdding && (
          <GenericButton
            onClick={() => setIsAdding(true)}
            variant="navy"
            className="flex items-center gap-2"
          >
            <FaPlus className="h-4 w-4" />
            Add Course
          </GenericButton>
        )}
      </div>

      {/* Add Course Form - Conditionally Rendered */}
      {isAdding && (
        <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <GenericInputField
                    label="Course Name"
                    name="name"
                    placeholder="Enter course name"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                <GenericButton
                  type="button"
                  onClick={handleCancel}
                  variant="cancel"
                  className="px-6 py-2"
                >
                  Cancel
                </GenericButton>
                <GenericButton
                  type="submit"
                  variant="navy"
                  className="px-4 md:px-8 py-2 text-base font-semibold"
                >
                  Save Course
                </GenericButton>
              </div>
            </form>
          </FormProvider>
        </div>
      )}

      {/* Course Table - Only show when not in form mode */}
      {!isAdding && (
        <div >
          <GenericTable<Course>
            data={courses?.data?.data || []}
            columns={columns}
            itemsPerPage={10}
            searchAble={true}
            action={true}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
            paginationOff={false}
            showSrNo={true}
          />
        </div>
      )}
    </div>
  );
};

export default AddCourse;