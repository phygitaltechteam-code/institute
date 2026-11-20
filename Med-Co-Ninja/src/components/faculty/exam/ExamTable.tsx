import { useNavigate, useParams } from '@tanstack/react-router';
import { Column } from '../../Forms/Table/GenericGroupingTable';
import GenericTable from '../../Forms/Table/GenericTable';
import { useAuthContext } from '@/context/AuthContext';
import {
  useGetExams,
  useDeleteExamMutation,
  useGetAllExams,
  useBatchExams,
} from '@/lib/react-query/queriesAndMutations/examMutations';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { ExamAssignForm } from './ExamAssignForm';
import { useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';

const ExamTable = ({ batchId }: { batchId: string }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const role = user?.role;

  const { data: examsData, isLoading, isError, refetch } = batchId === "undefined" ? useGetAllExams(role) : useBatchExams(batchId, role);
  const deleteExamMutation = useDeleteExamMutation();
  console.log('Exams Data:', examsData);

  type examTable = {
    id: string;
    sno: number;
    examName: string;
    courseName: string;
    subject: string;
    duration: string;
    durationMinutes: number;
    marks: string;
    totalQuestions: number;
  };

  // Handle Edit
  const handleEdit = (exam: examTable) => {
    role == "ADMIN" ? navigate({
      to: '/admin/updateexam/$id',
      params: { id: exam.id },
      state: { batchId: batchId },
    }) : navigate({
      to: '/faculty/updateexam/$id',
      params: { id: exam.id },
      state: { batchId: batchId },
    });
  };

  // Handle Delete
  const handleDelete = (exam: examTable) => {
    confirmAlert({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the exam "${exam.examName}"? This action cannot be undone.`,
      buttons: [
        {
          label: 'Delete',
          onClick: async () => {
            try {
              await deleteExamMutation.mutateAsync(exam.id);
              refetch();
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
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border-l-4 border-red-600 bg-white p-4 md:p-8 shadow-2xl">
            <h1 className="mb-3 text-xl font-bold text-text-charcoal">
              Confirm Delete
            </h1>
            <p className="mb-6 text-base leading-relaxed text-text-charcoal">
              Are you sure you want to delete the exam "{exam.examName}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onClose()}
                className="bg-gray-300 hover:bg-gray-400 rounded-lg px-6 py-2 font-semibold text-text-charcoal transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteConfirm(exam.id);
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

  const handleDeleteConfirm = async (examId: string) => {
    try {
      await deleteExamMutation.mutateAsync(examId);
      refetch();
    } catch (error) {
      console.log('Delete error:', error);
    }
  };

  const columns: Column<examTable>[] = [
    {
      accessor: 'examName',
      header: 'Exam Name',
    },
    // {
    //   accessor: 'courseName',
    //   header: 'Course',
    // },
    {
      accessor: 'subject',
      header: 'Subject',
    },
    {
      accessor: 'duration',
      header: 'Duration',
    },
    {
      accessor: 'marks',
      header: 'Total Marks',
    },
    {
      accessor: 'totalQuestions',
      header: 'Questions',
    },
  ];

  // Transform API data to match table type
  const tableData = useMemo(() => {
    if (!examsData?.data) return [];

    const isBatchResponse = batchId !== "undefined" && examsData.data.length > 0 && examsData.data[0]?.exam;

    return examsData.data.map((item: any, index: number) => {
      const exam = isBatchResponse ? item.exam : item;

      const totalMinutes = (exam.hours || 0) * 60 + (exam.minutes || 0);

      let durationDisplay = '';
      if (exam.hours > 0 && exam.minutes > 0) {
        durationDisplay = `${exam.hours}h ${exam.minutes}m`;
      } else if (exam.hours > 0) {
        durationDisplay = `${exam.hours}h`;
      } else if (exam.minutes > 0) {
        durationDisplay = `${exam.minutes}m`;
      } else {
        durationDisplay = '0m';
      }

      return {
        id: isBatchResponse ? item.examId : exam.id,
        sno: index + 1,
        examName: exam.name || 'N/A',
        courseName: exam.course?.name || 'N/A',
        subject: exam.subjectt?.name || 'N/A',
        duration: durationDisplay,
        durationMinutes: totalMinutes,
        marks: exam.marks?.toString() || '0',
        totalQuestions: exam.examQuestions?.length || 0,
      };
    });
  }, [examsData, batchId]);

  console.log('Table Data:', tableData);

  // Custom Actions - MUST BE A FUNCTION
  const customActions = (item: examTable) => {
    // If you want to show actions per row, use item
    // For now, return null as we're using the action prop for edit/delete
    return null;
  };

  // Custom action button for the table footer
  const renderCustomActions = () => {
    return (
      <div className="flex items-center gap-2">
        {(batchId === "undefined" || !batchId) ? (
          <GenericButton
            {...(user?.role === "ADMIN"
              ? { onClick: () => navigate({ to: '/admin/examform/examform' }) }
              : { onClick: () => navigate({ to: '/faculty/examform/examform' }) }
            )}
            className="hover:bg-primary-navy/90 flex items-center gap-1.5 bg-primary-navy px-3 py-1.5 text-sm font-medium text-pure-white shadow-sm transition-colors"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Add Exam
          </GenericButton>
        ) : (
          <ExamAssignForm batchId={batchId} refetch={refetch} />
        )}
      </div>
    );
  };

  return (
    <div className="p-1 md:p-2 2xl:p-2">
      {isLoading ? (
        <div className="flex justify-center py-5 md:py-8">
          <div className="text-text-charcoal">Loading exams...</div>
        </div>
      ) : isError ? (
        <div className="flex justify-center py-5 md:py-8">
          <div className="text-red-500">
            Error loading exams. Please try again.
          </div>
        </div>
      ) : (
        <>
          <GenericTable
            columns={columns}
            data={tableData}
            title="Exams"
            itemsPerPage={10}
            searchAble={true}
            action={true}
            showSrNo={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            actionButton={renderCustomActions()}
            onRowClick={(row)=>navigate(role ==="ADMIN"?{to:`/admin/examform/exam-review/${row.id}`}:{to:`/faculty/examform/exam-review/${row.id}`})}
          />
        </>
      )}
    </div>
  );
};

export default ExamTable;