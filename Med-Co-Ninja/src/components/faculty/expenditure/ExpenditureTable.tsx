import GenericTable from '@/components/Forms/Table/GenericTable';
import {
  useDeleteExpenditure,
  useGetExpenditure,
} from '@/lib/react-query/queriesAndMutations/expenditure';
import { useGetAccounts } from '@/lib/react-query/queriesAndMutations/account';
import { Column } from '@/types/index';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { FiEdit } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import { useAuthContext } from '@/context/AuthContext';
import { formatDate } from '@/utils/dateTimeUtils';

export const ExpenditureTable = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role;

  const { data: expenditureData, refetch } = useGetExpenditure(role);
  const { data: accountsData } = useGetAccounts(role);
  const { mutateAsync: deleteExpenditure } = useDeleteExpenditure(role);

  console.log('expenditureData', expenditureData);
  console.log('accountsData', accountsData);

  type ExpenditureTable = {
    id: string;
    name: string;
    amount: string;
    date: string;
    account: string;
    note: string;
  };

  // Create a map of account ID to account name for quick lookup
  const accountMap = useMemo(() => {
    const map = new Map();
    const accounts = accountsData?.data || accountsData || [];
    accounts.forEach((account: any) => {
      map.set(account.id, account.name || account.accountName || 'Unknown');
    });
    return map;
  }, [accountsData]);

  // Map data from API
  const data: ExpenditureTable[] = (expenditureData?.data?.data || []).map(
    (item: any) => ({
      id: item.id,
      name: item.title || item.name || 'N/A',
      amount: item.amount ? `₹${Number(item.amount).toLocaleString()}` : '₹0',
      date: formatDate(item.date),
      account: accountMap.get(item.accountId) || item.accountId || 'N/A',
      note: item.description || item.note || '-',
    }),
  );

  const columns: Column<ExpenditureTable>[] = [
    {
      header: 'Date',
      accessor: 'date',
      render: (item) => (
        <span className="">
          {formatDate(item.date)}
        </span>
      ),
    },
    {
      header: 'Expenditure Name',
      accessor: 'name',
      render: (item) => (
        <span className="">
          {item.name}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (item) => (
        <span className="">{item.amount}</span>
      ),
    },
    {
      header: 'Account',
      accessor: 'account',
      render: (item) => (
        <span className="">
          {item.account}
        </span>
      ),
    },
    {
      header: 'Particular',
      accessor: 'note',
      render: (item) => (
        <span className="">
          {item.note}
        </span>
      ),
    },
  ];

  const handleEdit = (id: string) => {
    navigate({
      to: '/admin/edit-expenditure/$id',
      params: { id },
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expenditure?')) {
      await deleteExpenditure(id);
      refetch();
    }
  };

  return (
    <div>
      <GenericTable
        columns={columns}
        data={data}
        searchAble={true}
        action={true}
        showSrNo={true}
        onEdit={(item: ExpenditureTable) => handleEdit(item.id)}
        onDelete={(item: ExpenditureTable) => handleDelete(item.id)}
        itemsPerPage={10}
      />
    </div>
  );
};