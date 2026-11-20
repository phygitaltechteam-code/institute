import { useMemo } from 'react';
import { useGetAssignedStudents } from '@/lib/react-query/queriesAndMutations/placementMutation';
import { getResponseArray } from './utils';

interface Props {
  placementId: string;
  role: string;
}

const AssignedStudentsCount = ({ placementId, role }: Props) => {
  const { data, isLoading, isError } = useGetAssignedStudents(placementId, role);

  const assignedStudents = useMemo(() => getResponseArray(data), [data]);

  if (isLoading) return <span className="text-xs">...</span>;
  if (isError) return <span className="text-xs">0</span>;

  return <span className="text-xs">{assignedStudents.length}</span>;
};

export default AssignedStudentsCount;
