import { useMemo } from 'react';
import { useGetAssignedStudents } from '@/lib/react-query/queriesAndMutations/placementMutation';
import { getResponseArray } from './utils';

interface Props {
  placementId: string;
  role: string;
}

const InterestedStudentsCount = ({ placementId, role }: Props) => {
  const { data, isLoading, isError } = useGetAssignedStudents(placementId, role);

  // Count all students assigned to this placement (isApplied may be false for newly assigned ones)
  const interestedStudents = useMemo(() => getResponseArray(data), [data]);

  if (isLoading) return <span className="text-xs">...</span>;
  if (isError) return <span className="text-xs">0</span>;

  return <span className="text-xs">{interestedStudents.length}</span>;
};

export default InterestedStudentsCount;
