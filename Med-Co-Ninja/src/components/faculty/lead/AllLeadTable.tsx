import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericTable from '@/components/Forms/Table/GenericTable';
import { useAuthContext } from '@/context/AuthContext';
import { Column } from '@/types/index';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useGetLeads, useDeleteLeadMutation } from '@/lib/react-query/queriesAndMutations/LeadMutation';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { formatDate, formatDateTime } from '@/utils/dateTimeUtils';

const LeadTable = () => {
  const { user } = useAuthContext();
  const role = user?.role;
  const [isEnroll, setEnroll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: leadsData, isLoading, isError, refetch } = useGetLeads(undefined, role);
  const { mutate: deleteLead } = useDeleteLeadMutation();

  // Debug log to see the data structure
  console.log('Leads Data:', leadsData);

  type leadType = {
    id: string;
    name: string;
    number: string;
    source: string;
    course: string;
    qualification: string;
    interested: string;
    faculty: string;
    note: string;
    nextFollowUp: string;
    batchType: string;
    batch: string;
    status: string;
    collegeName: string;
  };

  const navigate = useNavigate();

  // Extract leads data from the API response
  const leadsArray = leadsData?.data || [];

  const leadData = leadsArray.map((lead: any) => ({
    id: lead.id,
    name: lead.name || 'N/A',
    number: lead.phoneNumber || 'N/A',
    source: lead.source || 'N/A',
    course: lead.course?.name || 'N/A',
    qualification: lead.qualification || 'N/A',
    interested: lead.interested || 'N/A',
    faculty: lead.teacher?.user?.fullname || 'Not Assigned',
    note: lead.leadFollowUps?.length > 0 ? lead.leadFollowUps.map((item: any) => item.note).join(', ') : '-',
    nextFollowUp: lead.leadFollowUps?.length > 0 ? lead.leadFollowUps.map((item: any) => formatDateTimeAuto(item.nextFollowUpDate)).join(', ') : '-',
    batchType: lead.batchType || 'N/A',
    batch: lead.batch?.name || 'Not Assigned',
    status: lead.status || 'N/A',
    collegeName: lead.collegeName || 'N/A',
  }));

  // Handle Edit
  const handleEdit = (item: leadType) => {
    console.log(`Edit lead with ID: ${item.id}`);
    if (user?.role === 'ADMIN') {
      navigate({
        to: '/admin/lead/lead/$id',
        params: { id: item.id },
      });
    } else if (user?.role === 'TEACHER' || user?.role === 'FACULTY') {
      navigate({
        to: '/faculty/lead/lead/$id',
        params: { id: item.id },
      });
    }
  };

  // Handle Delete
  const handleDelete = (item: leadType) => {
    confirmAlert({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the lead "${item.name}"? This action cannot be undone.`,
      buttons: [
        {
          label: 'Delete',
          onClick: () => {
            deleteLead({ leadId: item.id, role });
            console.log(`Delete lead with ID: ${item.id}`);
          },
          className: 'bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition',
        },
        {
          label: 'Cancel',
          onClick: () => { },
          className: 'bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition ml-2',
        },
      ],
      overlayClassName: 'react-confirm-alert-overlay-custom',
      customUI: ({ onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border-l-4 border-red-600 bg-white p-4 md:p-8 shadow-2xl">
            <h1 className="mb-3 text-xl font-bold text-text-charcoal">Confirm Delete</h1>
            <p className="mb-6 text-base leading-relaxed text-text-charcoal">
              Are you sure you want to delete the lead "{item.name}"? This action cannot be undone.
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
                  deleteLead({ leadId: item.id, role });
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

  const leadColumn: Column<leadType>[] = [
    {
      accessor: 'name',
      header: 'Name',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.name}
        </span>
      ),
    },
    {
      accessor: 'number',
      header: 'Number',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.number}
        </span>
      ),
    },
    {
      accessor: 'source',
      header: 'Source',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.source || '-'}
        </span>
      ),
    },
    {
      accessor: 'course',
      header: 'Course',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.course || '-'}
        </span>
      ),
    },
    {
      accessor: 'batch',
      header: 'Batch',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.batch || '-'}
        </span>
      ),
    },
    {
      accessor: 'batchType',
      header: 'Batch Type',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.batchType || '-'}
        </span>
      ),
    },
    {
      accessor: 'faculty',
      header: 'Faculty',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.faculty || '-'}
        </span>
      ),
    },
    {
      accessor: 'qualification',
      header: 'Qualification',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.qualification || '-'}
        </span>
      ),
    },
    {
      accessor: 'interested',
      header: 'Interested',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.interested || '-'}
        </span>
      ),
    },
    {
      accessor: 'nextFollowUp',
      header: 'Next Follow Up',
      render: (item: leadType) => (
        <span
          className="cursor-pointer"
          onClick={() => handleClick(item.id)}
        >
          {item.nextFollowUp}
        </span>
      ),
    },
    {
      accessor: 'note',
      header: 'Note',
      render: (item: leadType) => (
        <span className="" onClick={() => handleClick(item.id)}>
          {item.note || '-'}
        </span>
      ),
    },
  ];

  const handleClick = (id: string) => {
    if (user?.role === 'TEACHER' || user?.role === 'FACULTY') {
      navigate({
        to: '/faculty/lead/lead/$id',
        params: { id },
      });
    } else if (user?.role === 'ADMIN') {
      navigate({
        to: '/admin/lead/lead/$id',
        params: { id },
      });
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent"></div>
          <p className="text-text-charcoal">Loading leads...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-red-600">Failed to load leads. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 rounded-lg bg-primary-blue px-4 py-2 text-white hover:bg-primary-navy"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <GenericTable
        title="All Lead Students"
        columns={leadColumn}
        data={leadData}
        searchAble={true}
        itemsPerPage={10}
        onRowClick={(row: leadType) => handleClick(row.id)}
        action={true}
        // onEdit={handleEdit}
        onDelete={handleDelete}
        showSrNo={true}
      />
    </div>
  );
};

export default LeadTable;