import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthContext } from '@/context/AuthContext';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetAssignmentsByBatch, useDeleteAssignment } from '@/lib/react-query/queriesAndMutations/assignmentMutation';
import { formatDate } from '@/utils/dateTimeUtils';
import { FiPlus } from 'react-icons/fi';
import { FiX } from 'react-icons/fi';
import Assignment from '@/components/student/assignment/Assignment';

interface AssignmentTableProps {
  batchId: string;
}

type AssignmentRow = {
  id: string;
  assignmentName: string;
  description: string;
  remark: string;
  deadline: string;
  createdAt: string;
};

const AssignmentTable = ({ batchId }: AssignmentTableProps) => {
  const { user } = useAuthContext();
  const role = user?.role;
  const navigate = useNavigate();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AssignmentRow | null>(null);

  const { data, isLoading, isError, refetch } = useGetAssignmentsByBatch(batchId, role);
  const { mutate: deleteAssignment, isPending: isDeleting } = useDeleteAssignment(role);

  const rawList: any[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

  const tableData: AssignmentRow[] = rawList.map((a: any) => ({
    id: a.id,
    assignmentName: a.assignmentName || a.name || 'N/A',
    description: a.description || 'N/A',
    remark: a.remark || '-',
    deadline: a.deadline ? formatDate(a.deadline) : 'N/A',
    createdAt: a.createdAt ? formatDateTimeAuto(a.createdAt) : 'N/A',
  }));

  const columns: Column<AssignmentRow>[] = [
    { header: 'Created At', accessor: 'createdAt' },
    { header: 'Assignment Name', accessor: 'assignmentName' },
    { header: 'Description', accessor: 'description' },
    { header: 'Remark', accessor: 'remark' },
    { header: 'Deadline', accessor: 'deadline' },
  ];

  const handleEdit = (row: AssignmentRow) => {
    setEditingId(row.id);
    setShowAddForm(true);
  };

  const handleDelete = (row: AssignmentRow) => {
    setDeleteItem(row);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteItem) {
      deleteAssignment(
        { id: deleteItem.id, role },
        {
          onSuccess: () => {
            setShowDeleteModal(false);
            setDeleteItem(null);
            refetch();
          },
          onError: () => {
            setShowDeleteModal(false);
            setDeleteItem(null);
          }
        }
      );
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingId(null);
    refetch();
  };

  if (isLoading) {
    return <div className="py-5 md:py-8 text-center">Loading assignments...</div>;
  }

  if (isError) {
    return (
      <div className="py-5 md:py-8 text-center text-red-500">
        Failed to load assignments. Please try again.
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div>
        <Assignment
          batchId={batchId}
          assignmentId={editingId || undefined}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <>
      <GenericTable
        columns={columns}
        data={tableData}
        title="Assignments"
        itemsPerPage={5}
        searchAble={true}
        action={true}
        showSrNo={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        actionButton={
          <GenericButton
            onClick={() => {
              setEditingId(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 bg-primary-navy px-4 py-1.5 text-sm font-medium text-pure-white shadow-sm transition-colors hover:bg-primary-navy/90"
          >
            + Add Assignment
          </GenericButton>
        }
        onRowClick={(row) => navigate({
          to: role === 'ADMIN' ? `/admin/review-assignment/${row.id}` : `/faculty/review-assignment/${row.id}`
        })}
      />

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg bg-white max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl">
            {/* Close button */}
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteItem(null);
              }}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>

            {/* Modal content */}
            <div className="mt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Assignment</h3>
              </div>

              <p className="mt-4 text-gray-600">
                Are you sure you want to delete the assignment{' '}
                <span className="font-semibold text-gray-900">"{deleteItem.assignmentName}"</span>?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <GenericButton
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteItem(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  disabled={isDeleting}
                >
                  Cancel
                </GenericButton>
                <GenericButton
                  onClick={confirmDelete}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </GenericButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentTable;