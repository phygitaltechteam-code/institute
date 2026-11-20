import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  FileUp,
  User,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import {
  useAddFaculty,
  useEditFaculty,
  useGetFacultyById,
} from '@/lib/react-query/queriesAndMutations/queryMutation';
import { useNavigate } from '@tanstack/react-router';
import { FaArrowLeft } from 'react-icons/fa';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';

type AddFacultyProps = {
  facultyId?: string;
};

export const AddFaculty = ({ facultyId }: AddFacultyProps) => {
  const navigate = useNavigate();
  const { mutate: addFaculty   } = useAddFaculty();
  const { mutate: editFaculty } = useEditFaculty();

  const {
    data: facultyDataById,
    isLoading,
    isError,

  } = useGetFacultyById(facultyId || '');

  console.log('Faculty Data By ID:', facultyDataById);

  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    mobile: z.string().min(10, 'Valid mobile number is required'),
    address: z.string().min(1, 'Address is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(4, 'Password must be at least 4 characters long'),
    subject: z.string().min(1, 'Subject is required'),
    salary: z.string().min(1, 'Salary is required'),
    adharcard: z.any().optional(),
    panproof: z.any().optional(),
    addressProof: z.any().optional(),
    emergencyContact: z.string(),
    enam: z.string(),
    relationship: z.string(),
  });


  type FacultyFormValues = z.infer<typeof schema>;

  const method = useForm<FacultyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      mobile: '',
      address: '',
      email: '',
      password: '',
      subject: '',
      salary: '',
      adharcard: undefined,
      panproof: undefined,
      addressProof: undefined,
      emergencyContact: '',
      enam: '',
      relationship: '',
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = method;

  // useEffect(() => {
  //   if (!facultyDataById) return;

  //   reset({
  //     name: facultyDataById.fullname || '',
  //     mobile: facultyDataById.phoneNumber || '',
  //     address: facultyDataById.address || '',
  //     email: facultyDataById.email || '',
  //     password: '',
  //     subject: facultyDataById.subject || '',
  //     salary: facultyDataById.salary ? String(facultyDataById.salary) : '',
  //     emergencyContact: facultyDataById.emergencyContact || '',
  //     enam: facultyDataById.emergencyContact || '',
  //     relationship:
  //       facultyDataById.relationship || facultyDataById.Relationship || '',
  //   });
  // }, [facultyDataById, reset]);

  const handleBack = () => {
    navigate({ to: '/admin/faculty-table' });
  };

  if (facultyId && isLoading) {
    return <div className="p-4 md:p-8 text-center">Loading...</div>;
  }

  const onSubmit = (data: FacultyFormValues) => {
    const payload = {
      ...data,
      // Ensure file objects are passed directly (not FileList wrappers)
      adharcard: data.adharcard instanceof File ? data.adharcard : undefined,
      panproof: data.panproof instanceof File ? data.panproof : undefined,
      addressProof: data.addressProof instanceof File ? data.addressProof : undefined,
    };

    if (facultyId) {
      editFaculty({ id: facultyId, ...payload });
    } else {
      addFaculty(payload);
      reset()
    }
    console.log('Faculty Form Submitted:', data);
  };

  const FileUploadField = ({
    name,
    label,
    accept,
  }: {
    name: keyof FacultyFormValues;
    label: string;
    accept: string;
  }) => (
    <div className="flex flex-col space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-black dark:text-pure-white">
        <FileUp size={16} className="text-accent-teal" />
        {label}
      </label>

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="relative flex w-full items-center justify-center">
            <label className="border-accent-teal/30 bg-bg-light-mint/50 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all hover:bg-bg-light-mint dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80">
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <FileUp className="text-accent-teal/60 mb-3 h-8 w-8" />
                <p className="mb-2 text-sm text-text-charcoal dark:text-text-charcoal">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-text-charcoal dark:text-text-charcoal">
                  {field.value instanceof File
                    ? field.value.name
                    : `Upload ${label}`}
                </p>
              </div>

              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            </label>
          </div>
        )}
      />
    </div>
  );

  return (
    <div className="mx-auto  p-3 sm:p-4 md:p-6">
      {/* Header with Back Button and Title - Outside the Card */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <GenericButton
            onClick={handleBack}
            variant="navy"

            aria-label="Go back"
          >

            <span>←Back</span>
          </GenericButton>
          <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
            {facultyId ? 'Edit Faculty' : 'Add New Faculty'}
          </h1>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
        <FormProvider {...method}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 border-b border-stroke pb-2 text-lg font-semibold text-primary-navy dark:border-strokedark">
                <User size={20} className="text-accent-teal" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <GenericInputField
                  label="Full Name"
                  type="text"
                  placeholder="Enter full name"
                  name="name"
                  required
                />
                <GenericInputField
                  label="Mobile Number"
                  type="text"
                  placeholder="Enter mobile number"
                  name="mobile"
                  required
                />
                <GenericInputField
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address"
                  name="email"
                  required
                />
                <GenericInputField
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  required
                />

                <div className="sm:col-span-2 lg:col-span-3">
                  <GenericInputField
                    label="Residential Address"
                    type="text"
                    placeholder="Enter complete address"
                    name="address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 border-b border-stroke pb-2 text-lg font-semibold text-primary-navy dark:border-strokedark">
                <BookOpen size={20} className="text-accent-teal" />
                Professional Details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GenericInputField
                  label="Teaching Subject"
                  type="text"
                  placeholder="e.g. Mathematics, Biology"
                  name="subject"
                  required
                />
                <GenericInputField
                  label="Monthly Salary (₹)"
                  type="text"
                  placeholder="Enter salary amount"
                  name="salary"
                  required
                />
              </div>
            </div>


            {/* Documents Upload */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 border-b border-stroke pb-2 text-lg font-semibold text-primary-navy dark:border-strokedark">
                <FileUp size={20} className="text-accent-teal" />
                Required Documents
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FileUploadField
                  name="adharcard"
                  label="Aadhar Card"
                  accept="image/*,.pdf"
                />
                <FileUploadField
                  name="panproof"
                  label="PAN Card"
                  accept="image/*,.pdf"
                />
                <FileUploadField
                  name="addressProof"
                  label="Address Proof"
                  accept="image/*,.pdf"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 border-b border-stroke pb-2 text-lg font-semibold text-primary-navy dark:border-strokedark">
                <AlertCircle size={20} className="text-accent-teal" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <GenericInputField
                  label="Contact Name"
                  type="text"
                  placeholder="Enter emergency contact name"
                  name="enam"
                />
                <GenericInputField
                  label="Relationship"
                  type="text"
                  placeholder="e.g. Father, Spouse"
                  name="relationship"
                />
                <GenericInputField
                  label="Contact Number"
                  type="text"
                  placeholder="Enter emergency mobile number"
                  name="emergencyContact"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-strokedark">
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
              >
                {facultyId ? 'Update Faculty' : 'Save Faculty'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};