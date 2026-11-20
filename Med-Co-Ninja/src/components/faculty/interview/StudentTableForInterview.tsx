import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import GenericButton from '../../Forms/Buttons/GenericButton';
import GenericTable, { Column } from '../../Forms/Table/GenericTable';
import FormForAssignInterview from './FormForAssignInterview';
import { useGetBatchwiseStudentInterview, useUpdateInterview, useDeleteInterview } from '@/mutations/courseMutation';
import { useAuthContext } from '@/context/AuthContext';
import { FiUsers, FiPlus, FiAlertCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useGetPlacement } from '@/lib/react-query/queriesAndMutations/placementMutation';
import { formatDate } from '@/utils/dateTimeUtils';

type StudentTableForInterviewType = {
  id: string;
  name: string;
  PN: string;
  mobile: string;
  totalAttendance: string;
  totalExam: string;
  finalExam: string;
  placementForm: string;
  internship: string;
  paidFees: string;
  pendingFees: string;
  followUpDate: string;
  totalInterviewGiven: string;
  placementRecieved: string;
  referals: string;
  isAssigned?: boolean;
  assignmentDetails?: any;
  action?: string;
};

interface StudentTableForInterviewProps {
  batchId: string;
}

const StudentTableForInterview = ({ batchId }: StudentTableForInterviewProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role;

  const [selectedStudent, setSelectedStudent] =
    useState<StudentTableForInterviewType | null>(null);
  const [isInterviewFormOpen, setIsInterviewFormOpen] =
    useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch students with batchId and role
  const { data: interviews, isLoading, isError, refetch } = useGetBatchwiseStudentInterview(batchId, role);
  const { mutate: deleteInterview, isPending: isDeleting } = useDeleteInterview(role);
  const { mutate: updateInterview, isPending: isUpdating } = useUpdateInterview(role);

  // Fetch placements to check which students have assignments
  const { data: placementsData } = useGetPlacement(role);

  console.log('Batch ID:', batchId);
  console.log('Role:', role);
  console.log('API Response:', interviews);
  console.log('Placements Data:', placementsData);

  // Create a set of student IDs that have assignments
  const [assignedStudentIds, setAssignedStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (placementsData?.data?.data) {
      const assignedIds = new Set<string>();
      placementsData.data.data.forEach((placement: any) => {
        // Check if placement has a studentId or student field
        if (placement.studentId) {
          assignedIds.add(placement.studentId);
        }
        if (placement.student?.id) {
          assignedIds.add(placement.student.id);
        }
      });
      setAssignedStudentIds(assignedIds);
      console.log('Assigned student IDs:', assignedIds);
    }
  }, [placementsData]);

  const handleInterview = (item: StudentTableForInterviewType) => {
    setSelectedStudent(item);
    setIsInterviewFormOpen(true);
  };

  const handleAssignmentSuccess = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
    setIsInterviewFormOpen(false);
    setSelectedStudent(null);
  };

  // Handle Delete from table action
  const handleDeleteAssignment = (item: StudentTableForInterviewType) => {
    confirmAlert({
      title: 'Confirm Remove',
      message: `Are you sure you want to remove the interview assignment for "${item.name}"?`,
      buttons: [
        {
          label: 'Remove',
          onClick: () => {
            deleteInterview(
              { id: item.id, role },
              {
                onSuccess: () => {
                  setRefreshKey(prev => prev + 1);
                  refetch();
                  // Remove from assigned set
                  setAssignedStudentIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(item.id);
                    return newSet;
                  });
                },
                onError: (error) => {
                  console.error('Delete failed:', error);
                }
              }
            );
          },
          className: 'bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition',
        },
        {
          label: 'Cancel',
          onClick: () => { },
          className: 'bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition ml-2',
        },
      ],
    });
  };

  // Handle Edit from table action
  const handleEditAssignment = (item: StudentTableForInterviewType) => {
    setSelectedStudent(item);
    setIsInterviewFormOpen(true);
  };

  const columns: Column<StudentTableForInterviewType>[] = [
    {
      accessor: 'name',
      header: 'Name',
    },
    {
      accessor: 'mobile',
      header: 'Mobile',
    },
    {
      accessor: 'totalAttendance',
      header: 'Total Attendance',
    },
    {
      accessor: 'totalExam',
      header: 'Total Exam',
    },
    {
      accessor: 'finalExam',
      header: 'Final Exam',
    },
    {
      accessor: 'placementForm',
      header: 'Placement Form',
    },
    {
      accessor: 'internship',
      header: 'Internship',
    },
    // {
    //   accessor: 'paidFees',
    //   header: 'Paid Fees',
    // },
    {
      accessor: 'pendingFees',
      header: 'Pending Fees',
    },
    {
      accessor: 'followUpDate',
      header: 'Follow Up Date',
    },
    {
      accessor: 'totalInterviewGiven',
      header: 'Total Interview Given',
    },
    {
      accessor: 'placementRecieved',
      header: 'Placement Received',
    },
    {
      accessor: 'referals',
      header: 'Referrals',
    },
    {
      accessor: 'action',
      header: 'Action',
      render: (item) => {
        // Check if student is assigned from the set
        const isAssigned = assignedStudentIds.has(item.id);

        if (isAssigned) {
          // Show Edit and Delete icons when assigned
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleEditAssignment(item)}
                className="rounded-lg bg-primary-navy p-2 text-white hover:bg-primary-navy/80 transition"
                title="Edit Assignment"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAssignment(item)}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600 transition disabled:opacity-50"
                title="Remove Assignment"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          );
        }

        // Show Interview button when not assigned
        return (
          <GenericButton
            type="button"
            variant="bg-primary"
            className="rounded-lg bg-accent-teal text-base font-semibold text-pure-white shadow-lg bg-primary-navy"
            onClick={() => handleInterview(item)}

          >
            Interview
          </GenericButton>
        );
      },
    },
  ];

  // Helper function to safely extract data from response
  const extractData = (response: any) => {
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response?.students && Array.isArray(response.students)) {
      return response.students;
    }
    if (response?.items && Array.isArray(response.items)) {
      return response.items;
    }
    console.warn('Unexpected response structure:', response);
    return [];
  };

  // Map API data to table data structure
  const rawData = extractData(interviews);
  console.log('Extracted data:', rawData);

  const studentData = rawData.map((student: any) => ({
    id: student.id || student._id || 'N/A',
    name: student.user?.fullname || student.name || student.fullname || 'N/A',
    mobile: student.phoneNumber || student.mobile || student.phone || 'N/A',
    totalAttendance: student.totalAttendance || student.attendance || '0%',
    totalExam: student.totalExam || student.exams || '0',
    finalExam: student.finalExam || student.final_exam || 'N/A',
    placementForm: student.placementForm =="true" ? "Yes" : "No" || 'N/A',
    internship: student.internship || 'N/A',
    paidFees: student.paidFees || student.paid_fees || '₹0',
    pendingFees: student.pendingFees || student.pending_fees || '₹0',
    followUpDate: (student.followUp || student.followUp) ? formatDateTimeAuto(student?.followUp?.followUpDate || student.follow_up_date) : 'N/A',
    totalInterviewGiven: student.totalInterviewGiven || student.interviews_given || '0',
    placementRecieved: student.placementRecieved || student.placement_received || 'No',
    referals: student.referals || student.referrals || '0',
    // isAssigned will be determined by the set
    isAssigned: assignedStudentIds.has(student.id || student._id),
    assignmentDetails: null,
  })) || [];

  // Check if there's any data
  const hasData = studentData.length > 0;

  // Handle back navigation based on role
  const handleBack = () => {
    if (role === 'ADMIN') {
      navigate({
        to: '/admin/batch/batch-dashboard/$id',
        params: { id: batchId }
      });
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      navigate({
        to: '/faculty/batch/batch-dashboard/$id',
        params: { id: batchId }
      });
    } else {
      navigate({
        to: '/admin/batch/batch-dashboard/$id',
        params: { id: batchId }
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent"></div>
          <p className="text-text-charcoal">Loading student data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <FiAlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 font-semibold">Failed to load student data</p>
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

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 rounded-full bg-bg-light-mint p-4">
        <FiUsers className="h-16 w-16 text-gray-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-text-charcoal">
        No Students Available
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500">
        There are currently no students assigned to this batch.
        Students will appear here once they are added to the batch.
      </p>
      <GenericButton
        type="button"
        className="flex items-center gap-2 rounded-lg bg-primary-navy px-6 py-2.5 text-base font-semibold text-pure-white shadow-lg hover:bg-primary-navy/90"
        onClick={() => {
          console.log('Add students to batch:', batchId);
        }}
      >
        <FiPlus className="h-5 w-5" />
        Add Students
      </GenericButton>
      <p className="mt-4 text-xs text-gray-400">
        Batch ID: {batchId}
      </p>
    </div>
  );

  return (
    <div className="p-4 md:p-2 2xl:p-2" key={refreshKey}>
      <div>
        <div className="overflow-x-auto">
          <GenericTable
            columns={columns}
            data={hasData ? studentData : []}
            title="Student Interview Assign."
            emptyState={<EmptyState />}
            showSrNo={true}
            searchAble={true}
          />
        </div>
        {isInterviewFormOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-pure-white shadow-lg">
              <button
                className="absolute right-4 top-4 text-2xl font-bold text-red-500 hover:text-red-700"
                onClick={() => {
                  setIsInterviewFormOpen(false);
                  setSelectedStudent(null);
                }}
              >
                ×
              </button>

              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold">
                  {assignedStudentIds.has(selectedStudent.id) ? 'Edit Interview Assignment' : 'Assign Interview'}
                </h2>
                <div className="mb-4 rounded-lg bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Student:</span>
                      <span className="ml-2 font-medium">{selectedStudent.name}</span>
                    </div>
                  </div>
                </div>
                <FormForAssignInterview
                  batchId={batchId}
                  studentId={selectedStudent.id}
                  onSuccess={handleAssignmentSuccess}
                  onCancel={() => {
                    setIsInterviewFormOpen(false);
                    setSelectedStudent(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTableForInterview;