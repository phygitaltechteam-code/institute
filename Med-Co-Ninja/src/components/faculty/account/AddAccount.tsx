import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from '@tanstack/react-router';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import { useAuthContext } from '@/context/AuthContext';
import {
  useAddAccount,
  useGetAccountById,
  useUpdateAccount,
  useGetAccounts,
  useDeleteAccount,
} from '@/lib/react-query/queriesAndMutations/account';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import PageHeader from '@/components/Common/PageHeader';

type AccountType = {
  id: string;
  name: string;
  balance: number;
  currentBalance: number;
  createdAt: string;
};

export const AddAccount = () => {
  const { id } = useParams({
    strict: false,
  });
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const { user } = useAuthContext();
  const role = user?.role;

  const { mutate: updateAccount } = useUpdateAccount();
  const { mutate: addAccount } = useAddAccount();
  const { mutate: deleteAccount } = useDeleteAccount();
  const { data: accountData } = useGetAccountById(id as string, role);
  const { data: accountsData, isLoading, refetch } = useGetAccounts(role);

  const accounts = accountsData?.data?.data || accountsData?.data || [];

  const schema = z.object({
    name: z.string().min(1, 'Account name is required'),
    balance: z.coerce.number().default(0),
  });

  type AccountFormValues = z.infer<typeof schema>;

  const defaultValues = id
    ? {
      name: accountData?.name ?? '',
      balance: accountData?.balance ?? 0,
    }
    : {
      name: '',
      balance: 0,
    };

  const methods = useForm<AccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = (data: AccountFormValues) => {
    if (id) {
      updateAccount(
        {
          id,
          data,
          role,
        },
        {
          onSuccess: () => {
            refetch();
            setIsAdding(false);
            navigate({ to: '/admin/account/account-list' });
          },
        }
      );
    } else {
      addAccount(
        { data, role },
        {
          onSuccess: () => {
            refetch();
            reset();
            setIsAdding(false);
          },
        }
      );
    }
  };

  // ✅ FIX: Handle row click with proper navigation
  const handleRowClick = (row: AccountType) => {
    console.log('🔍 Row clicked:', row);
    console.log('🔍 Account ID:', row.id);
    
    if (row.id) {
      navigate({
        to: '/admin/account/acounthistorybyid/$id',
        params: { id: row.id },
      });
    } else {
      console.error('❌ No ID found for account');
    }
  };

  const handleDelete = (account: AccountType) => {
    confirmAlert({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete account "${account.name}"?`,
      buttons: [
        {
          label: 'Delete',
          onClick: () => {
            deleteAccount(
              { id: account.id, role },
              {
                onSuccess: () => refetch(),
              }
            );
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
    });
  };

  const columns: Column<AccountType>[] = [
    {
      accessor: 'createdAt',
      header: 'Created At',
      render: (item) =>
        item.createdAt ? formatDateTimeAuto(item.createdAt) : 'N/A',
    },
    {
      accessor: 'name',
      header: 'Account Name',
    },
    {
      accessor: 'balance',
      header: 'Current Balance',
      render: (item) => `₹${item.balance?.toLocaleString() || 0}`,
    },
  ];

  const handleBack = () => {
    setIsAdding(false);
    navigate({ to: '/admin/account/addaccount' });
  };

  const handleCancel = () => {
    reset();
    setIsAdding(false);
  };

  // If in edit mode or adding mode, show the form
  const showForm = id || isAdding;

  return (
    <div className="mx-auto  p-3 sm:p-4 md:p-6">
      {/* Header with Back Button and Title */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {showForm ? (
            <GenericButton
              onClick={handleBack}
              variant="navy"
              aria-label="Go back"
            >
              <span>← Back</span>
            </GenericButton>
          ) : (
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              Account Management
            </h1>
          )}
          {showForm && (
            <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
              {id ? 'Update Account' : 'Add New Account'}
            </h1>
          )}
        </div>
        {!showForm && (
          <GenericButton
            onClick={() => setIsAdding(true)}
            variant="navy"
            className="flex items-center gap-2"
          >
            <FaPlus className="h-4 w-4" />
            Add Account
          </GenericButton>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-4 shadow-lg sm:p-5 md:p-6">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <GenericInputField
                  label="Account Name"
                  name="name"
                  placeholder="Enter account name"
                  required
                />

                <GenericInputField
                  label="Current Balance"
                  name="balance"
                  type="number"
                  placeholder="Enter opening balance"
                  required
                />
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
                  {id ? 'Update Account' : 'Save Account'}
                </GenericButton>
              </div>
            </form>
          </FormProvider>
        </div>
      )}

      {/* Accounts Table - Only show when not in form mode */}
      {!showForm && (
        <div>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-primary-navy border-t-transparent"></div>
                <p className="text-text-charcoal">Loading accounts...</p>
              </div>
            </div>
          ) : (
            <GenericTable
              columns={columns}
              data={accounts}
              searchAble={true}
              itemsPerPage={10}
              action={true}
              onDelete={handleDelete}
              showSrNo={true}
              title=""
              onRowClick={handleRowClick}
            />
          )}
        </div>
      )}
    </div>
  );
};