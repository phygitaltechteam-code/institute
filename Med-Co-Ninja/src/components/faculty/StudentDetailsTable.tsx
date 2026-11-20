import { useAuthContext } from '@/context/AuthContext';
import { useDeleteStudent, useGetStudent } from '@/lib/react-query/queriesAndMutations/studentDetails';
import GenericTable, { Column } from '../Forms/Table/GenericTable';
import { useNavigate } from '@tanstack/react-router';
import { FiEdit } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';

type StudentRow = {
  id: string;
  srNo: number;
  username: string;
  name: string;
  mobile: string;
  city: string;
  batch: string;
  batchType: string;
  teacher: string;
  totalFees: string;
  paidFees: string;
  pendingFees: string;
  action: string;
};

const StudentDetailsTable = () => {
  const { user } = useAuthContext();
  const role = user?.role;
  const navigate = useNavigate();

  const { data, isLoading } = useGetStudent(role);
  const { mutate: deleteStudent } = useDeleteStudent(role);

  // Map API response → flat row shape
  const students: StudentRow[] = (data?.data?.data || []).map((item: any, index: number) => {
    // Get batch name from batchStudents array
    const batchName = item.batchStudents && item.batchStudents.length > 0
      ? item.batchStudents[0]?.batch?.name
      : null;

    

    return {
      id: item.id,
      srNo: index + 1,
      username: item.user?.username ?? '—',
      name: item.user?.fullname ?? '—',
      mobile: item.user?.phoneNumber ?? '—',
      city: item.city ?? '—',
      batch: batchName ?? '—',
      batchType: item.batchStudents[0]?.batch?.batchType,
      teacher: item.teacher?.user?.fullname || "--",
      totalFees: item.totalFees !== undefined && item.totalFees !== null
        ? `₹${item.totalFees.toLocaleString()}`
        : '—',
      paidFees: item.paidFees !== undefined && item.paidFees !== null
        ? `₹${item.paidFees.toLocaleString()}`
        : '—',
      pendingFees: item.pendingFees !== undefined && item.pendingFees !== null
        ? `₹${item.pendingFees.toLocaleString()}`
        : '—',
      action: '',
    };
  });

  const handleEdit = (id: string) => {
    const path = role === 'ADMIN'
      ? '/admin/student/edit-student/$studentId'
      : '/faculty/student/edit-student/$studentId';
    navigate({ to: path, params: { studentId: id } });
  };

  const handleDelete = (id: string) => {
    deleteStudent(id);
  };

  const columns: Column<StudentRow>[] = [
    {
      accessor: 'srNo',
      header: 'Sr No.',
      render: (item) => (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {item.srNo}
        </span>
      ),
      className: 'min-w-[60px]',
    },
    {
      accessor: 'username',
      header: 'Username',
      render: (item) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {item.username}
        </span>
      ),
    },
    {
      accessor: 'name',
      header: 'Name',
      render: (item) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.name}
        </span>
      ),
    },
    {
      accessor: 'mobile',
      header: 'Number',
      render: (item) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.mobile}
        </span>
      ),
    },
    {
      accessor: 'city',
      header: 'City',
      render: (item) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.city}
        </span>
      ),
    },
    {
      accessor: 'batch',
      header: 'Batch',
      render: (item) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.batch}
        </span>
      ),
    },
    {
      accessor: 'batchType',
      header: 'Batch Type',
      render: (item) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.batchType}
        </span>
      ),
    },
    {
      accessor: 'teacher',
      header: 'Faculty',
      render: (item) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.teacher}
        </span>
      ),
    },
    {
      accessor: 'totalFees',
      header: 'Total Fees',
      render: (item) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {item.totalFees}
        </span>
      ),
    },
    {
      accessor: 'paidFees',
      header: 'Paid Fees',
      render: (item) => (
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {item.paidFees}
        </span>
      ),
    },
    {
      accessor: 'pendingFees',
      header: 'Pending Fees',
      render: (item) => (
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          {item.pendingFees}
        </span>
      ),
    },
    {
      accessor: 'action',
      header: 'Action',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(item.id); }}
            className="rounded p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-slate-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            title="Edit"
          >
            <FiEdit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
            className="rounded p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Delete"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
      className: 'min-w-[100px]',
    },
  ];

  if (isLoading) {
    return <div className="p-4 text-center text-slate-600 dark:text-slate-400">Loading students...</div>;
  }

  return (
    <div>
      <GenericTable
        columns={columns}
        data={students}
        // Clicking anywhere on a row opens that student's update page
        onRowClick={(row) => handleEdit(row.id)}
         itemsPerPage={10}
         searchAble={true}
      />
    </div>
  );
};

export default StudentDetailsTable;