import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { useAuthContext } from '@/context/AuthContext';
import { useGetBatches } from '@/lib/react-query/queriesAndMutations/batchMutation';
import { useGetStudentById, useGetUsername } from '@/lib/react-query/queriesAndMutations/studentDetails';
import { useRegisterStudent, useUpdateStudent } from '@/lib/react-query/queriesAndMutations/studentMutation';
import { useGetCourses } from '@/mutations/courseMutation';
import { useGetStudent } from '@/lib/react-query/queriesAndMutations/studentDetails';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import FormPageLayout from '@/components/Common/FormPageLayout';
import { formatDate, formatTimeRange } from '@/utils/dateTimeUtils';
import toast from 'react-hot-toast';

// Pincode API service
const fetchPincodeDetails = async (pincode: string) => {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const postOffice = data[0].PostOffice[0];
      return {
        city: postOffice.District || '',
        state: postOffice.State || '',
        country: postOffice.Country || 'India',
        postOffice: postOffice.Name || '',
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

const schema = z.object({
  fullname: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  username: z.string().min(1, 'Username is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((v) => /\d/.test(v) && /[a-zA-Z]/.test(v), 'Password must contain a letter and a number')
    .or(z.literal('')),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  address: z.string().min(1, 'Address is required'),
  qualification: z.string().optional(),
  collegeName: z.string().optional(),
  referId: z.string().optional(),
  courseId: z.string().optional(),
  batchId: z.string().optional(),
  feeOptionId: z.string().optional(),
  totalFees: z.coerce.number().min(0).default(0),
  paidFees: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).max(100).default(0),
});

type AddStudentFormValues = z.infer<typeof schema>;

type AddStudentProps = {
  studentId?: string;
};

const AddStudent = ({ studentId }: AddStudentProps) => {
  const { user } = useAuthContext();
  const role = user?.role;
  const navigate = useNavigate();
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeFetched, setPincodeFetched] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<any>(null);
  const [feeOptions, setFeeOptions] = useState<any[]>([]);
  const [pincodeError, setPincodeError] = useState<string>('');
  const [selectedFeeOption, setSelectedFeeOption] = useState<any>(null);
  const [generatedUsername, setGeneratedUsername] = useState<string>('');

  const isEditMode = Boolean(studentId);
  const { data: studentData, isLoading: isStudentLoading } = useGetStudentById(studentId || '', role);
  const { mutate: registerStudent, isPending: isCreating } = useRegisterStudent();
  const { mutate: updateStudent, isPending: isUpdating } = useUpdateStudent();
  
  // Get username from API
  const { data: usernameData, refetch: refetchUsername } = useGetUsername(!isEditMode);

  const { data: coursesData, isLoading: isCoursesLoading } = useGetCourses(role);
  const { data: batchData, isLoading: isBatchLoading } = useGetBatches(role);
  const { data: studentsData, isLoading: isStudentsLoading } = useGetStudent(role);

  const isPending = isCreating || isUpdating;
  const isLoading = isStudentLoading || isCoursesLoading || isBatchLoading || isStudentsLoading;

  const courseOptions = (coursesData?.data?.data || coursesData?.data || []).map((course: any) => ({
    value: course.id,
    label: course.name,
  }));

  const batchOptions = (batchData?.data || []).map((batch: any) => ({
    value: batch.id,
    label: `${batch.name} (${batch.course?.name || 'No Course'})`,
  }));

  // Student options for referral dropdown
  const studentOptions = (studentsData?.data?.data || studentsData?.data || []).map((student: any) => ({
    value: student.id,
    label: student.user?.fullname || student.fullname || student.name || 'Unknown',
  }));

  const method = useForm<AddStudentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullname: '',
      email: '',
      username: '',
      password: '',
      phoneNumber: '',
      pincode: '',
      city: '',
      state: '',
      country: '',
      address: '',
      qualification: '',
      collegeName: '',
      referId: '',
      courseId: '',
      batchId: '',
      feeOptionId: '',
      totalFees: 0,
      paidFees: 0,
      discount: 0,
    },
  });

  const { handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = method;
  const pincode = watch('pincode');
  const selectedCourseId = watch('courseId');
  const selectedBatchId = watch('batchId');
  const selectedFeeOptionId = watch('feeOptionId');
  const totalFees = watch('totalFees');
  const discount = watch('discount');

  // Set generated username when API returns data
  useEffect(() => {
    // Only new students get a generated ID; editing must keep the student's real login ID
    if (usernameData && !isEditMode) {
      setGeneratedUsername(usernameData);
      setValue('username', usernameData);
    }
  }, [usernameData, setValue, isEditMode]);

  // Fetch username on component mount if not in edit mode
  useEffect(() => {
    if (!isEditMode) {
      refetchUsername();
    }
  }, [isEditMode, refetchUsername]);

  // Fetch batch details when batch is selected
  useEffect(() => {
    if (selectedBatchId && batchData?.data) {
      const batch = batchData.data.find((b: any) => b.id === selectedBatchId);
      if (batch) {
        setSelectedBatchDetails(batch);
        if (batch.feeOptions) {
          setFeeOptions(batch.feeOptions);
        } else {
          setFeeOptions([]);
        }
        setValue('feeOptionId', '');
        setSelectedFeeOption(null);
        setValue('totalFees', 0);
      }
    } else {
      setSelectedBatchDetails(null);
      setFeeOptions([]);
      setSelectedFeeOption(null);
    }
  }, [selectedBatchId, batchData, setValue]);

  // Get total fee when fee option is selected
  useEffect(() => {
    if (selectedFeeOptionId && feeOptions.length > 0) {
      const option = feeOptions.find((opt: any) => opt.id === selectedFeeOptionId);
      if (option && option.feeInstallments) {
        const total = option.feeInstallments.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0);
        setSelectedFeeOption(option);
        setValue('totalFees', total);
      }
    }
  }, [selectedFeeOptionId, feeOptions, setValue]);

  // Fee summary (same formula as the backend): net = total − discount%, pending = net − paid.
  // "Paid" is money actually received, so it is entered by the user and never auto-filled.
  const paidFeesValue = Number(watch('paidFees')) || 0;
  const netPayable = Math.round((Number(totalFees) || 0) * (1 - (Number(discount) || 0) / 100));
  const pendingAmount = Math.max(0, netPayable - paidFeesValue);
  const paidExceedsNet = paidFeesValue > netPayable;

  // Fee option options
  const feeOptionOptions = feeOptions.map((option: any) => {
    // Create a breakdown string like "₹10000 + ₹10000 + ₹10000"
    const breakdown = option.feeInstallments
      ?.filter((inst: any) => inst.amount > 0)
      .map((inst: any) => `₹${inst.amount}`)
      .join(' + ');

    const totalAmount = option.feeInstallments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;

    return {
      value: option.id,
      label: `${option.name} (${breakdown || '₹0'} = Total: ₹${totalAmount})`,
    };
  });

  // Filter batches by selected course
  const filteredBatchOptions = selectedCourseId
    ? batchOptions.filter((option: any) => {
      const batchItem = batchData?.data?.find((b: any) => b.id === option.value);
      return batchItem?.courseId === selectedCourseId || batchItem?.course?.id === selectedCourseId;
    })
    : batchOptions;

  // Pincode auto-fetch logic - triggers when pincode changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (pincode && pincode.length === 6 && !pincodeFetched) {
        setIsFetchingPincode(true);
        setPincodeError('');

        try {
          const details = await fetchPincodeDetails(pincode);
          if (details) {
            setValue('city', details.city);
            setValue('state', details.state);
            setValue('country', details.country);
            setPincodeFetched(true);

          } else {
            setPincodeError('Invalid pincode. Please check and try again.');
            toast.error('Invalid pincode. Please check and try again.');
          }
        } catch (error) {

          setPincodeError('Failed to fetch location details.');
        } finally {
          setIsFetchingPincode(false);
        }
      }
    };

    // Reset fetched status when pincode is cleared or changed
    if (pincode && pincode.length < 6) {
      setPincodeFetched(false);
      setPincodeError('');
      if (pincodeFetched) {
        setValue('city', '');
        setValue('state', '');
        setValue('country', '');
      }
    }

    // Debounce the API call to avoid too many requests
    const timer = setTimeout(() => {
      if (pincode && pincode.length === 6) {
        fetchDetails();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [pincode, setValue, pincodeFetched]);

  // Function to manually trigger pincode fetch (for onBlur)
  const handlePincodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && value.length === 6 && !pincodeFetched) {
      const fetchDetails = async () => {
        setIsFetchingPincode(true);
        setPincodeError('');

        try {
          const details = await fetchPincodeDetails(value);
          if (details) {
            setValue('city', details.city);
            setValue('state', details.state);
            setValue('country', details.country);
            setPincodeFetched(true);
            toast.success(`Location found: ${details.city}, ${details.state}`);
          } else {
            setPincodeError('Invalid pincode. Please check and try again.');
            toast.error('Invalid pincode. Please check and try again.');
          }
        } catch (error) {

          setPincodeError('Failed to fetch location details.');
        } finally {
          setIsFetchingPincode(false);
        }
      };

      fetchDetails();
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (!isEditMode || !studentData) return;

    const s = studentData?.data ?? studentData;
    const u = s?.user ?? {};

    // Get batchId from batchStudents array if available
    let batchIdFromData = s.batchId || '';
    let courseIdFromData = s.courseId || '';

    // If batchId is not directly on the student, try to get it from batchStudents
    if (!batchIdFromData && s.batchStudents && s.batchStudents.length > 0) {
      batchIdFromData = s.batchStudents[0]?.batchId || '';
      // Get courseId from the batch if available
      if (s.batchStudents[0]?.batch?.courseId) {
        courseIdFromData = s.batchStudents[0].batch.courseId;
      }
    }

    let totalFeesValue = s.totalFees || 0;
    let discountValue = s.discount || 0;
    let paidFeeValue = s.paidFees || 0;
    let feeOptionIdValue = s.feeOptionId || '';

    // If feeOptionId exists, find the fee option from batch data to get the name
    if (feeOptionIdValue && batchIdFromData && batchData?.data) {
      const batch = batchData.data.find((b: any) => b.id === batchIdFromData);
      if (batch && batch.feeOptions) {
        const feeOption = batch.feeOptions.find((opt: any) => opt.id === feeOptionIdValue);
        if (feeOption) {
          setSelectedFeeOption(feeOption);
          // Set fee options for dropdown
          setFeeOptions(batch.feeOptions);
        }
      }
    }

    reset({
      fullname: u.fullname ?? '',
      email: u.email ?? '',
      username: u.username ?? '',
      password: '',
      phoneNumber: u.phoneNumber ?? '',
      pincode: s.pincode ?? '',
      city: s.city ?? '',
      state: s.state ?? '',
      country: s.country ?? '',
      address: s.address ?? '',
      qualification: s.qualification ?? '',
      collegeName: s.collegeName ?? '',
      referId: s.referId ?? '',
      courseId: courseIdFromData,
      batchId: batchIdFromData,
      feeOptionId: feeOptionIdValue,
      totalFees: totalFeesValue,
      paidFees: paidFeeValue,
      discount: discountValue,
    });

    if (s.pincode) {
      setPincodeFetched(true);
    }
  }, [studentData, isEditMode, reset, batchData]);

  const backPath = role === 'ADMIN' ? '/admin/student-details' : '/faculty/student-details';

  const onSubmit = (data: AddStudentFormValues) => {
    if (paidExceedsNet) {
      toast.error(`Amount paid cannot be more than the net payable fee (₹${netPayable})`);
      return;
    }
    const payload = {
      fullname: data.fullname,
      email: data.email,
      username: data.username,
      password: data.password || undefined,
      phoneNumber: data.phoneNumber,
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      country: data.country,
      address: data.address,
      qualification: data.qualification || undefined,
      collegeName: data.collegeName || undefined,
      referId: data.referId || undefined,
      courseId: data.courseId || undefined,
      batchId: data.batchId || undefined,
      feeOptionId: data.feeOptionId || undefined,
      totalFees: data.totalFees || 0,
      paidFees: data.paidFees || 0,
      discount: data.discount || 0,
    };

    if (isEditMode && studentId) {
      updateStudent(
        { id: studentId, payload, role },
        {
          onSuccess: () => {
            navigate({ to: backPath });
          },
         
        }
      );
    } else {
      registerStudent(
        { payload, role },
        
      );
    }
  };

  return (
    <FormPageLayout
      title={isEditMode ? 'Edit Student' : 'Add New Student'}
      backPath={backPath}
      isLoading={isLoading}
      loadingText={isStudentLoading ? 'Loading student...' : 'Loading options...'}
    >
      <FormProvider {...method}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Personal Information */}
          <GenericInputField label="Full Name" name="fullname" placeholder="Enter full name" />
          <GenericInputField label="Email" name="email" type="email" placeholder="Enter email" />

          <GenericInputField
            label="Phone Number"
            name="phoneNumber"
            placeholder="Enter phone number"
          />

          {/* Qualification and College */}
          <GenericInputField
            label="Qualification"
            name="qualification"
            placeholder="Enter qualification"
          />
          <GenericInputField
            label="College Name"
            name="collegeName"
            placeholder="Enter college name"
          />

          {/* Referral Dropdown */}
          <GenericDropdown
            label="Referred By"
            name="referId"
            control={method.control as any}
            options={studentOptions}
            placeholder="Select Referred Student"
          />

          {/* Pincode Field with Auto-fetch */}
          <div className="relative">
            <GenericInputField
              label="Pincode"
              name="pincode"
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              helperText={
                isFetchingPincode
                  ? "Fetching location..."
                  : "Auto-fills city, state, country"
              }
              error={pincodeError || errors.pincode?.message}
              onBlur={handlePincodeBlur}
            />
            {isFetchingPincode && (
              <div className="absolute right-3 top-9">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-navy border-t-transparent"></div>
              </div>
            )}
            {pincodeFetched && !isFetchingPincode && pincode && (
              <div className="absolute right-3 top-9">
                <span className="text-green-500">✓</span>
              </div>
            )}
          </div>

          <GenericInputField label="City" name="city" placeholder="Enter city" />
          <GenericInputField label="State" name="state" placeholder="Enter state" />
          <GenericInputField label="Country" name="country" placeholder="Enter country" />

          <div className="sm:col-span-2 lg:col-span-3">
            <GenericInputField label="Address" name="address" placeholder="Enter full address" />
          </div>

          {/* Username - Read-only and auto-populated */}
          <GenericInputField
            label="Login User ID"
            name="username"
            placeholder="Auto-generated username"
            disabled={true}
            className="bg-gray-100 cursor-not-allowed"
            value={isEditMode ? getValues('username') : generatedUsername || getValues('username')}
          />
          
          <GenericInputField
            label={isEditMode ? 'Password (leave blank to keep)' : 'Password'}
            name="password"
            type="password"
            placeholder={isEditMode ? 'Leave blank to keep current' : 'Enter password'}
            
            
          />

          {/* Course and Batch Dropdowns */}
          <GenericDropdown
            label="Course"
            name="courseId"
            control={method.control as any}
            options={courseOptions}
            placeholder="Select Course"
          />

          <GenericDropdown
            label="Batch"
            name="batchId"
            control={method.control as any}
            options={filteredBatchOptions}
            placeholder="Select Batch"
          />

          {/* Batch Details Display */}
          {selectedBatchDetails && (
            // Compact one-line summary of the selected batch (wraps only on narrow screens)
            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-xs sm:text-sm">
              <span className="rounded bg-primary-navy px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Batch
              </span>
              <span className="font-semibold text-text-charcoal">{selectedBatchDetails.name}</span>
              <span>
                <span className="text-gray-500">Type:</span>{' '}
                <span className="font-medium">{selectedBatchDetails.batchType}</span>
              </span>
              <span>
                <span className="text-gray-500">Faculty:</span>{' '}
                <span className="font-medium">{selectedBatchDetails.teacher?.user?.fullname || 'N/A'}</span>
              </span>
              <span>
                <span className="text-gray-500">Date:</span>{' '}
                <span className="font-medium">
                  {formatDate(selectedBatchDetails.startDate)} – {formatDate(selectedBatchDetails.endDate)}
                </span>
              </span>
              <span>
                <span className="text-gray-500">Time:</span>{' '}
                <span className="font-medium">
                  {formatTimeRange(selectedBatchDetails.startTime, selectedBatchDetails.endTime)}
                </span>
              </span>
            </div>
          )}
          
          <GenericDropdown
            label="Fee Installment Plan"
            name="feeOptionId"
            control={method.control as any}
            options={feeOptionOptions}
            placeholder="Select Fee Plan"
            disabled={!selectedBatchId}
          />

          {/* Total Fee - Show as disabled with value */}
          <GenericInputField
            label="Total Fee (₹)"
            name="totalFees"
            type="number"
            placeholder="Auto-calculated from installment plan"
            disabled={true}
            className="bg-gray-100 cursor-not-allowed"
          />

          {/* Discount Percentage */}
          <GenericInputField
            label="Discount (%)"
            name="discount"
            type="number"
            placeholder="Enter discount percentage"
            min="0"
            max="100"
          />

          {/* Paid Fees - money actually received */}
          <GenericInputField
            label="Amount Paid (₹)"
            name="paidFees"
            type="number"
            placeholder="Amount received (0 if none)"
          />

          {/* Live fee summary */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-3 gap-2 rounded-lg border border-stroke bg-gray-50 p-2 text-center text-xs sm:text-sm">
            <div>
              <p className="text-gray-500">Net Payable</p>
              <p className="font-semibold text-primary-navy">₹{netPayable.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500">Paid</p>
              <p className="font-semibold text-accent-teal">₹{paidFeesValue.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500">Pending</p>
              <p className={`font-semibold ${pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{pendingAmount.toLocaleString('en-IN')}
              </p>
            </div>
            {paidExceedsNet && (
              <p className="col-span-3 text-xs font-medium text-red-600">
                Amount paid cannot be more than the net payable fee.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 z-10 -mx-3 flex justify-end gap-3 border-t border-stroke bg-pure-white/95 px-3 py-2.5 backdrop-blur sm:col-span-2 sm:-mx-4 sm:px-4 lg:col-span-3 md:-mx-5 md:px-5">
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
                ? isEditMode ? 'Updating...' : 'Registering...'
                : isEditMode ? 'Update Student' : 'Add Student'}
            </GenericButton>
          </div>
        </form>
      </FormProvider>
    </FormPageLayout>
  );
};

export default AddStudent;