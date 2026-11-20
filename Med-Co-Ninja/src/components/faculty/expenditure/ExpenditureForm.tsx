import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import DatePicker from '@/components/Forms/Input/DatePicker';
import {
  useAddExpenditure,
  useGetExpenditureById,
  useUpdateExpenditure,
} from '@/lib/react-query/queriesAndMutations/expenditure';
import { useGetAccounts } from '@/lib/react-query/queriesAndMutations/account';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from '@tanstack/react-router';
import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import { useAuthContext } from '@/context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

export const ExpenditureForm = () => {
  const { id } = useParams({
    strict: false,
  });
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const role = user?.role;
  const { mutate: updateExpenditure } = useUpdateExpenditure();
  const { mutate: addExpenditure } = useAddExpenditure();
  const { data: expenditureFormData } = useGetExpenditureById(id as string, role);

  // Fetch accounts
  const { data: accountsData, isLoading: accountsLoading } = useGetAccounts(role);

  const data = {
    id: expenditureFormData?.data?.id,
    title: expenditureFormData?.data?.title,
    amount: expenditureFormData?.data?.amount,
    date: expenditureFormData?.data?.date,
    accountId: expenditureFormData?.data?.accountId,
    description: expenditureFormData?.data?.description,
  };

  console.log('Expenditure Data:', data);

  // Transform accounts data for dropdown
  const accountOptions = accountsData?.data?.map((account: any) => ({
    label: account.name || account.accountName || 'Unknown Account',
    value: account.id,
  })) || [];

  const schema = z.object({
    title: z.string().min(1, 'Expenditure name is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    date: z.string().min(1, 'Date is required'),
    accountId: z.string().min(1, 'Account is required'),
    description: z.string().optional(),
  });
  type value = z.infer<typeof schema>;

  const defaultvalue = id
    ? {
      title: data?.title ?? '',
      amount: data?.amount ?? 0,
      date: data?.date ? new Date(data.date).toISOString().split('T')[0] : '',
      accountId: data?.accountId ?? '',
      description: data?.description ?? '',
    }
    : {
      title: '',
      amount: 0,
      date: '',
      accountId: '',
      description: '',
    };

  const methods = useForm<value>({
    resolver: zodResolver(schema),
    defaultValues: defaultvalue,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const onSubmit = (formData: value) => {
    const payload = {
      title: formData.title,
      amount: formData.amount,
      date: formData.date,
      accountId: formData.accountId,
      description: formData.description,
    };

    console.log('Submitting payload:', payload);

    if (id) {
      updateExpenditure({
        id,
        data: payload,
        role,
      });
    } else {
      addExpenditure({
        data: payload,
        role,
      });
    }
  };

  const handleBack = () => {
    role === "ADMIN" ?navigate({ to: '/admin/expenditure/expenditure-list' })
    :navigate({ to: '/faculty/expenditure/expenditure-list' });
  };

  return (
    <div className="mx-auto  p-3 sm:p-4 md:p-6">
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
          {id ? 'Update Expenditure' : 'Add New Expenditure'}
        </h1>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <GenericInputField
                label="Expenditure Name"
                name="title"
                placeholder="Enter expenditure name"
                required
              />

              {/* Amount */}
              <GenericInputField
                label="Amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                required
              />

              {/* Date with DatePicker */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text-charcoal">
                  Date <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="date"
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
                {errors.date && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.date.message}
                  </p>
                )}
              </div>

              {/* Account Dropdown - Using accounts from API */}
              <GenericDropdown
                label="Account"
                name="accountId"
                control={control}
                options={accountOptions}
                placeholder={accountsLoading ? "Loading accounts..." : "Select Account"}
                required
                isLoading={accountsLoading}
              />

              {/* Note - Full Width */}
              <div className="md:col-span-2">
                <GenericInputField
                  label="Particular"
                  name="description"
                  placeholder="Add any additional notes"
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
              >
                {id ? 'Update Expenditure' : 'Save Expenditure'}
              </GenericButton>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};