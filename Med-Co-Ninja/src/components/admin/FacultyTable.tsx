import { Column } from '@/types/index';
import React from 'react';
import GenericTable from '../Forms/Table/GenericTable';
import { Pencil, Trash2 } from 'lucide-react';
import {
  useDeleteFaculty,
  useGetFaculties,
} from '@/lib/react-query/queriesAndMutations/queryMutation';
import { useNavigate } from '@tanstack/react-router';
import { FiEdit } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import { useAuthContext } from '@/context/AuthContext'; 
const FacultyTable = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext(); // Get user context
  const role = user?.role || 'ADMIN'; 

  const { data: facultyData, isLoading, isError, refetch } = useGetFaculties(role);
  const { mutate: deleteFaculty } = useDeleteFaculty();
  
  console.log('Faculty Data:', facultyData);
  console.log('Role:', role);

  type table = {
    id?: string;
    name: string;
    subject: string;
    mobile: string;
    attendance: string;
    currentBatch: string;
  };

  const extractFacultyData = () => {
    if (!facultyData) return [];
    if (facultyData?.data?.data && Array.isArray(facultyData.data.data)) {
      return facultyData.data.data;
    }
    if (facultyData?.data && Array.isArray(facultyData.data)) {
      return facultyData.data;
    }
    if (Array.isArray(facultyData)) {
      return facultyData;
    }
    if (facultyData?.teachers && Array.isArray(facultyData.teachers)) {
      return facultyData.teachers;
    }
    if (facultyData?.faculties && Array.isArray(facultyData.faculties)) {
      return facultyData.faculties;
    }
    
    console.warn('Unexpected faculty data structure:', facultyData);
    return [];
  };

  const facultydata = extractFacultyData().map((faculty: any) => ({
    id: faculty._id || faculty.id || faculty.teacherId,
    name: faculty.fullname || faculty.name || faculty.fullName || 'N/A',
    subject: faculty.subject || faculty.subjects || 'N/A',
    mobile: faculty.phoneNumber || faculty.mobile || faculty.phone || 'N/A',
    attendance: faculty.attendance || 'N/A',
    currentBatch: Array.isArray(faculty.batches) && faculty.batches.length > 0
      ? faculty.batches.map((b: any) => b.name).join(', ')
      : faculty.currentBatch || faculty.batch || 'N/A',
  }));

  const column: Column<table>[] = [
    {
      accessor: 'name',
      header: 'Name',
    },
    {
      accessor: 'subject',
      header: 'Subject',
    },
    {
      accessor: 'mobile',
      header: 'Mobile',
    },
    // {
    //   accessor: 'attendance',
    //   header: 'Attendance',
    // },
    {
      accessor: 'currentBatch',
      header: 'Current Batch',
    },
    {
      accessor: 'name',
      header: 'Actions',
      render: (item: table) => {
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(item.id || '')}
              className="hover:bg-primary-navy/10 rounded p-1.5 text-text-charcoal transition-colors hover:text-primary-navy dark:text-bodydark"
            >
              <FiEdit className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleDelete(item.id || '')}
              className="hover:bg-primary-navy/10 rounded p-1.5 text-text-charcoal transition-colors hover:text-primary-navy dark:text-bodydark"
              title="Delete"
            >
              <MdDelete className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const handleEdit = (id: string) => {
    navigate({
      to: '/admin/edit-faculty/$id',
      params: { id },
    });
  };

  const handleDelete = (id: string) => {
    deleteFaculty(id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent"></div>
          <p className="text-text-charcoal">Loading faculty data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600 font-semibold">Failed to load faculty data</p>
          <p className="text-sm text-red-500 mt-1">Please try again later</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-primary-blue px-6 py-2 text-white hover:bg-primary-navy transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (facultydata.length === 0) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-gray-50 p-4 md:p-8 text-center">
          <p className="text-gray-500">No faculty members found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GenericTable 
        data={facultydata} 
        columns={column}  
        searchAble={true}
        showSrNo={true}
        paginationOff={10}
        
      />
    </div>
  );
};

export default FacultyTable;