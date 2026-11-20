import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  bulkImportStudents,
  changeOwnPassword,
  getAdminDashboard,
  getFeeCollections,
} from '@/lib/api/admin/dashboardApi';

export const useAdminDashboard = () =>
  useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard });

export const useFeeCollectionReport = (page: number, limit: number, searchTerm: string) =>
  useQuery({
    queryKey: ['fee-collections-report', page, limit, searchTerm],
    queryFn: () => getFeeCollections({ page, limit, searchTerm }),
    placeholderData: keepPreviousData,
  });

/** No success toast here: the import screen shows a full result summary instead. */
export const useBulkImportStudents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkImportStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Import failed');
    },
  });
};

export const useChangeOwnPassword = () =>
  useMutation({
    mutationFn: changeOwnPassword,
    onSuccess: () => toast.success('Password changed successfully'),
    onError: (error: any) => {
      const body = error?.response?.data;
      toast.error(body?.errors?.[0]?.message || body?.message || 'Could not change password');
    },
  });
