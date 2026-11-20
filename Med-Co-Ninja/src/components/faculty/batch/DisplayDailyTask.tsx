import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useGetDailyTasks,
  useDeleteDailyTaskMutation,
} from '@/lib/react-query/queriesAndMutations/dailytaskmutation';
import DailyTask from './DailyTask';
import GenericTable, { Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { Plus } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface DisplayDailyTaskProps {
  batchId: string;
}

interface DailyTaskType {
  id: string;
  date: string;
  topic: string;
  task: string;
  document?: string;
  video?: string;
  batchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const DisplayDailyTask = ({ batchId }: DisplayDailyTaskProps) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuthContext();
  const role = user?.role;
  // Fetch daily tasks
  const {
    data: tasksData,
    isLoading,
    isError,
    refetch,
  } = useGetDailyTasks(batchId, role);
  const deleteTask = useDeleteDailyTaskMutation();
  

  console.log('Tasks Data:', tasksData);

  const handleDelete = (task: DailyTaskType) => {
    if (
      window.confirm(`Are you sure you want to delete task: "${task.topic}"?`)
    ) {
      deleteTask.mutate(task.id);
    }
  };
  const handleRowClick = (task: DailyTaskType) => {
    if (role === "ADMIN") {
      navigate({
        to: '/admin/batch/daily-task-review/$id',
        params: { id: task.id }
      });
    } else {
      navigate({
        to: '/faculty/batch/daily-task-review/$id',
        params: { id: task.id }
      });
    }
  };
  const handleEdit = (task: DailyTaskType) => {
    // Navigate to edit page with task ID and batch ID
    if (role == "ADMIN") {
      navigate({
        to: '/admin/updatedailytask/$id',
        params: { id: task.id },
        state: { batchId: batchId },
      });
    }
    else {
      navigate({
        to: '/faculty/updatedailytask/$id',
        params: { id: task.id },
        state: { batchId: batchId },
      });
    }
  };

  const toggleForm = () => {
    setShowAddForm(!showAddForm);
    if (showAddForm) {
      refetch();
    }
  };

  // Format date in Indian dd/mm/yyyy format
  const formatDateUTC = (dateString: string) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  const hasDocument = (task: DailyTaskType) => {
    return task.document && task.document !== '';
  };

  const hasVideo = (task: DailyTaskType) => {
    return task.video && task.video !== '';
  };

  // Extract data correctly from response
  const tableData: DailyTaskType[] =
    tasksData?.data?.map((task: any) => ({
      id: task.id,
      date: task.date,
      topic: task.topic,
      task: task.task,
      document: task.document,
      video: task.video,
      batchId: task.batchId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })) || [];

  const columns: Column<DailyTaskType>[] = [
    {
      header: 'Date',
      accessor: 'date',
      render: (item) => formatDateUTC(item.date),
    },
    {
      header: 'Topic',
      accessor: 'topic',
    },
    {
      header: 'Task',
      accessor: 'task',
    },
    {
      header: 'Document',
      accessor: 'document',
      render: (item) =>
        hasDocument(item) ? (
          <a
            href={item.document}
            target="_blank"
            rel="noopener noreferrer"
            className=""
          >
            View
          </a>
        ) : (
          <span className="text-text-charcoal/40">—</span>
        ),
    },
    {
      header: 'Video',
      accessor: 'video',
      render: (item) =>
        hasVideo(item) ? (
          <a
            href={item.video}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-teal/80 text-accent-teal transition-colors"
          >
            View
          </a>
        ) : (
          <span className="text-text-charcoal/40">—</span>
        ),
    },
  ];

  return (
    <div className="p-1 md:p-2 2xl:p-2">
      {/* Add Task Form - Conditionally Rendered */}
      {showAddForm && (
        <div className="mb-6">
          <DailyTask
            batchId={batchId}
            onSuccess={() => {
              setShowAddForm(false);
              refetch();
            }}
          />
        </div>
      )}

      {/* Task List Table - Only show when form is closed */}
      {!showAddForm && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-5 md:py-8">
              <div className="text-text-charcoal">Loading tasks...</div>
            </div>
          ) : isError ? (
            <div className="flex justify-center py-5 md:py-8">
              <div className="text-red-500">
                Error loading tasks. Please try again.
              </div>
            </div>
          ) : (
            <GenericTable
              columns={columns}
              data={tableData}
              title="Daily Tasks"
              searchAble={true}
              action={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRowClick={handleRowClick}
              showSrNo={true}
              actionButton={
                <GenericButton
                  onClick={toggleForm}
                  variant="navy"
                  className="hover:bg-primary-navy/90 flex items-center gap-1.5  bg-primary-navy px-4 py-1.5 text-sm font-medium text-pure-white shadow-sm transition-colors"
                >

                  + Add Task
                </GenericButton>
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default DisplayDailyTask;