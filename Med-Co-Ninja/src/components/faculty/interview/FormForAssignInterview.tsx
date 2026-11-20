import { useForm, FormProvider } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import GenericButton from '../../Forms/Buttons/GenericButton';
import { useAuthContext } from '@/context/AuthContext';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { useGetPlacement } from '@/lib/react-query/queriesAndMutations/placementMutation';
import toast from 'react-hot-toast';
import { useAssignInterviewMutation } from '@/lib/react-query/queriesAndMutations/interviewMutations';
import { formatDate, formatTime } from '@/utils/dateTimeUtils';

interface FormForAssignInterviewProps {
  batchId: string;
  studentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FormForAssignInterview = ({
  batchId,
  studentId,
  onSuccess,
  onCancel
}: FormForAssignInterviewProps) => {
  const { user } = useAuthContext();
  const role = user?.role;

  const method = useForm({
    defaultValues: {
      placement: '',
      interviewMode: '',
      interviewDate: '',
      interviewTime: '',
      location: '',
    }
  });

  const { control, handleSubmit, watch, setValue, getValues } = method;
  const { data: placementsData } = useGetPlacement(role);
  const { mutate: assignInterview, isPending } = useAssignInterviewMutation();

  const selectedPlacementId = watch('placement');
  const interviewMode = watch('interviewMode');

  const normalizedMode = interviewMode?.toUpperCase() || '';
  const isOffline = normalizedMode === 'OFFLINE';
  const isOnline = normalizedMode === 'ONLINE';

  const isManualModeChange = useRef(false);
  const prevPlacementId = useRef('');

  const formatDateForInput = (dateValue: string) => {
    if (!dateValue) return '';
    try {
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      if (dateValue.includes('T')) {
        return dateValue.split('T')[0];
      }
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return '';
    } catch {
      return '';
    }
  };

  const formatTimeForInput = (timeValue: string) => {
    if (!timeValue) return '';
    try {
      if (timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue;
      }
      if (timeValue.includes('T')) {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      }
      return '';
    } catch {
      return '';
    }
  };

  const placementArray = Array.isArray(placementsData)
    ? placementsData
    : Array.isArray(placementsData?.data)
      ? placementsData.data
      : placementsData?.data?.data || [];

  const placementsDataForOptions = placementArray.map((placement: any) => ({
    id: placement.id,
    name: placement.companyName,
    jobRole: placement.jobRole,
    PN: placement.PN,
    qualification: placement.qualification,
    salary: placement.salary,
    interviewDate: placement.interviewDate,
    interviewMode: placement.interviewMode,
    location: placement.location,
    time: placement.deadLine
  }));

  const selectedPlacement = placementsDataForOptions.find(
    (item: any) => item.id === selectedPlacementId
  );

  useEffect(() => {
    if (selectedPlacement) {
      const placementChanged = prevPlacementId.current !== selectedPlacementId;

      const formattedDate = formatDateForInput(selectedPlacement.interviewDate);
      setValue('interviewDate', formattedDate);

      const formattedTime = formatTimeForInput(selectedPlacement.time);
      setValue('interviewTime', formattedTime);

      setValue('location', selectedPlacement.location || '');

      if (placementChanged && !isManualModeChange.current) {
        setValue('interviewMode', selectedPlacement.interviewMode || '');
      }

      prevPlacementId.current = selectedPlacementId;
    }
  }, [selectedPlacement, setValue, selectedPlacementId, interviewMode]);

  const onSubmit = (data: any) => {

    if (!selectedPlacementId) {
      toast.error('Please select a placement');
      return;
    }

    if (!studentId) {
      toast.error('Student ID is missing');
      return;
    }


    const mode = data.interviewMode || getValues('interviewMode');
    const date = data.interviewDate || getValues('interviewDate');
    const time = data.interviewTime || getValues('interviewTime');
    const location = data.location || getValues('location');



    const normalizedModeForValidation = mode?.toUpperCase() || '';

    if (!mode) {
      toast.error('Please select interview mode');
      return;
    }

    if (!date) {
      toast.error('Please select interview date');
      return;
    }

    if (!time) {
      toast.error('Please select interview time');
      return;
    }

    if (normalizedModeForValidation === 'OFFLINE' && !location) {
      toast.error('Please enter interview location');
      return;
    }


    let interviewDateTime = '';
    if (date && time) {
      try {
        const dateObj = new Date(`${date}T${time}:00`);
        if (!isNaN(dateObj.getTime())) {
          interviewDateTime = dateObj.toISOString();
        }
      } catch (e) {
        console.error('Error formatting date/time:', e);
      }
    }


    const payload = {
      placementId: selectedPlacementId,
      interviewDetails: {
        student: [{ studentId: studentId }],
        interviewMode: normalizedModeForValidation,
        interviewDate: interviewDateTime,
        interviewLocation: location || '',
      },
      role: role,
    };



    assignInterview(payload, {
      onSuccess: (response: any) => {
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error: any) => {

        toast.error(error?.response?.data?.message || 'Failed to assign interview');
      },
    });
  };

  // Handle mode change from select
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    isManualModeChange.current = true;
    setValue('interviewMode', value);
    console.log('📌 Mode manually changed to:', value);
  };

  // Reset manual mode flag when placement changes
  useEffect(() => {
    if (selectedPlacementId) {
      setTimeout(() => {
        isManualModeChange.current = false;
      }, 100);
    }
  }, [selectedPlacementId]);

  return (
    <div className="p-4 md:p-2 2xl:p-2">
      <div>
        <div className="overflow-x-auto">
          <FormProvider {...method}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Placement Dropdown */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text-charcoal">
                  Select Placement <span className="text-red-500">*</span>
                </label>
                <GenericDropdown
                  control={control}
                  options={
                    placementsDataForOptions?.map((item: any) => ({
                      label: `PN-${item.PN} (${item.name})`,
                      value: item.id,
                    })) || []
                  }
                  name="placement"
                  placeholder="Select PN Number"
                  required
                />
              </div>

              {/* Selected Placement Details */}
              {selectedPlacement && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-sm text-gray-500">Company:</span>
                      <span className="ml-2 font-medium text-primary-navy">{selectedPlacement.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Job Role:</span>
                      <span className="ml-2 font-medium">{selectedPlacement.jobRole || '-'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">PN No:</span>
                      <span className="ml-2 font-medium">{selectedPlacement.PN || '-'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Salary:</span>
                      <span className="ml-2 font-medium">{selectedPlacement.salary || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Mode - Using native select for reliability */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text-charcoal">
                  Interview Mode <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm text-text-charcoal outline-none transition focus:border-primary-navy active:border-primary-navy dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  value={interviewMode || ''}
                  onChange={handleModeChange}
                >
                  <option value="">Select Mode</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>

              {/* Interview Date and Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <GenericInputField
                  label="Interview Date"
                  type="date"
                  name="interviewDate"
                  required
                />

                <GenericInputField
                  label="Interview Time"
                  type="time"
                  name="interviewTime"
                  required
                />
              </div>

              {/* Location - Only shown when mode is OFFLINE */}
              {isOffline && (
                <div>
                  <GenericInputField
                    label="Interview Location"
                    name="location"
                    placeholder="Enter interview location"
                    required
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                {onCancel && (
                  <GenericButton
                    type="button"
                    variant="cancel"
                    className="px-6 py-2"
                    onClick={onCancel}
                  >
                    Cancel
                  </GenericButton>
                )}
                <GenericButton
                  type="submit"
                  className="rounded-lg bg-primary-navy px-4 md:px-8 py-2 text-base font-semibold text-pure-white hover:bg-primary-navy/90 disabled:opacity-50"
                  disabled={isPending || !selectedPlacementId}
                >
                  {isPending ? 'Assigning...' : 'Assign Interview'}
                </GenericButton>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default FormForAssignInterview;