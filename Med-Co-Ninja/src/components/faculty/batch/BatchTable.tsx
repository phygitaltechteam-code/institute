import { Column } from '../../Forms/Table/GenericTable';
import GenericTable from '../../Forms/Table/GenericTable';
import { useNavigate } from '@tanstack/react-router';
import { useAuthContext } from '@/context/AuthContext';
import {
  useDeleteBatch,
  useGetBatches,
} from '@/lib/react-query/queriesAndMutations/batchMutation';
import React, { useMemo, useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import {
  formatDate,
  formatTimeRange,
  formatDateRange,
  getTeachingDaysLabel,
  formatTime,
} from '@/utils/dateTimeUtils';



const BatchTable =  () => {
  const { user } = useAuthContext();
  const role = user?.role;
  const { data: batchData } = useGetBatches(role);
  const { mutate: deleteBatch } = useDeleteBatch(role);
  const navigate = useNavigate();

  type batchTable = {
    id: string;
    sno: number;
    batchName: string;
    course: string;
    faculty: string;
    totalDays: string;
    totalStudent: number | string;
    batchType: string;
    days: Record<string, boolean> | string;
    timing: string;
    date: string;
    startDate?: string;
    endDate?: string;
    totalFees: number;
    remainingFees: number;
  };

  // Function to calculate total days based on teaching days selected
  const calculateTotalDays = (teachingDays: Record<string, boolean>): number => {
    if (!teachingDays) return 0;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.filter(day => teachingDays[day] === true).length;
  };

  // Format date to DD/MM/YY
  const formatDateToDDMMYY = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const batchdata = (batchData?.data || []).map(
    (batch: any, index: number) => {
      // Calculate total days based on teaching days selected
      const teachingDaysCount = calculateTotalDays(batch.teachingDays || {});
      const totalDaysCount = batch.totalDays || 0;

      // Format start and end dates as DD/MM/YY
      const startDateFormatted = formatDateToDDMMYY(batch.startDate);
      const endDateFormatted = formatDateToDDMMYY(batch.endDate);

      return {
        id: batch.id,
        sno: index + 1,
        batchName: batch.name,
        course: batch.course?.name,
        faculty: batch.teacher?.user?.fullname,
        totalDays: `${teachingDaysCount}/${totalDaysCount}`,
        totalStudent: batch.totalStudent || '0',
        batchType: batch.batchType,
        days: batch.teachingDays,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        startTime: formatTime(batch.startTime),
        endTime:formatTime(batch.endTime),
        date: formatDateRange(batch.startDate, batch.endDate),
        totalFees: batch.totalFees || 0,
        remainingFees: batch.remainingFees || 0,
      };
    },
  );


  const nw = 'whitespace-nowrap';
  const money = (n: any) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
  const columns: Column<batchTable>[] = [
    {
      accessor: 'batchName',
      header: 'Batch',
      render: (item: any) => (
        <div className="text-left leading-tight">
          <p className="font-semibold text-text-charcoal dark:text-white">{item.batchName}</p>
          <p className="text-[11px] text-slate-500">{item.course}</p>
        </div>
      ),
    },
    {
      accessor: 'date',
      header: 'Duration',
      render: (item: any) => (
        <span className={`${nw} text-xs`}>
          {item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : item.date || '-'}
        </span>
      ),
    },
    {
      accessor: 'timing',
      header: 'Time',
      render: (item: any) => (
        <span className={`${nw} text-xs`}>
          {item.startTime ? `${item.startTime} – ${item.endTime}` : '-'}
        </span>
      ),
    },
    {
      accessor: 'days',
      header: 'Days',
      render: (item: batchTable) => <span className={`${nw} text-xs`}>{getTeachingDaysLabel(item.days)}</span>,
    },
    {
      accessor: 'faculty',
      header: 'Faculty',
      render: (item: any) => <span className={nw}>{item.faculty || '-'}</span>,
    },
    {
      accessor: 'batchType',
      header: 'Type',
      render: (item: any) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">{item.batchType}</span>
      ),
    },
    {
      accessor: 'totalStudent',
      header: 'Students',
    },
    {
      accessor: 'totalDays',
      header: 'Classes',
      render: (item: batchTable) => <span className={nw}>{item.totalDays || '0/0'}</span>,
    },
    {
      accessor: 'totalFees',
      header: 'Fees',
      render: (item: any) => (
        <div className={`${nw} text-xs leading-tight`}>
          <p className="font-semibold">{money(item.totalFees)}</p>
          {Number(item.remainingFees) > 0 && <p className="text-red-600">Due {money(item.remainingFees)}</p>}
        </div>
      ),
    },
  ];

  const handleDelete = (item: batchTable) => {
    confirmAlert({
      title: 'Confirm Delete',
      message:
        `Are you sure you want to delete the batch "${item.batchName}"? This action cannot be undone.`,
      buttons: [
        {
          label: 'Delete',
          onClick: async () => {
            try {
              deleteBatch(item.id);
              console.log(`Delete batch with ID: ${item.id}`);
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
              Are you sure you want to delete the batch "{item.batchName}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onClose()}
                className="rounded-lg bg-gray-300 px-6 py-2 font-semibold text-text-charcoal transition hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    deleteBatch(item.id);
                    console.log(`Delete batch with ID: ${item.id}`);
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

  const handleEdit = (item: batchTable) => {
    console.log(`Edit batch with ID: ${item.id}`);
    if (user?.role === 'ADMIN') {
      navigate({
        to: '/admin/batch/edit-batch/$batchId',
        params: { batchId: item.id },
      });
    } else if (user?.role === 'TEACHER') {
      navigate({
        to: '/faculty/batch/edit-batch/$batchId',
        params: { batchId: item.id },
      });
    }
  };

  return (
    
    <div className="p-0.1">
      <div className="mb-4 flex justify-end">

</div>
      <GenericTable
  columns={columns}
  data={batchdata}
  searchAble={true}
  itemsPerPage={10}
  action={true}
  showSrNo={true}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onRowClick={(item: batchTable) => {
    if (user?.role === 'ADMIN') {
      navigate({
        to: '/admin/batch/batch-dashboard/$id',
        params: { id: item.id },
      });
    } else if (user?.role === 'TEACHER') {
      navigate({
        to: '/faculty/batch/batch-dashboard/$id',
        params: { id: item.id },
      });
    }
  }}
/>
    </div>
  );
};

export default BatchTable;