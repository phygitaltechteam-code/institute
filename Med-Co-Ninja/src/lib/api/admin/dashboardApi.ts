import { api } from '@/utils/axios';

// The axios response interceptor unwraps res.data, so these return the ApiResponse body.

export type AdminDashboard = {
  totals: {
    students: number;
    teachers: number;
    courses: number;
    batches: number;
    activeBatches: number;
    leads: number;
    newLeadsThisMonth: number;
  };
  fees: { totalFees: number; collected: number; collectedThisMonth: number; pending: number };
  followUpsDueThisWeek: { leads: number; fees: number };
  leadsByStatus: { status: string; count: number }[];
  monthly: { month: string; admissions: number; feeCollected: number }[];
  recentCollections: {
    id: string;
    amount: number;
    createdAt: string;
    account: string | null;
    studentName: string;
  }[];
};

export const getAdminDashboard = async () => {
  const res: any = await api.get('/admin/dashboard');
  return res.data as AdminDashboard;
};

export type FeeCollectionRow = {
  id: string;
  amount: number;
  pendingAmount?: number | null;
  createdAt: string;
  student?: { user?: { fullname?: string; phoneNumber?: string } };
  account?: { name?: string } | null;
  teacher?: { user?: { fullname?: string } } | null;
};

export const getFeeCollections = async (params: { page: number; limit: number; searchTerm?: string }) => {
  const res: any = await api.get('/admin/fees/collect', {
    params: {
      page: String(params.page),
      limit: String(params.limit),
      ...(params.searchTerm ? { searchTerm: params.searchTerm } : {}),
    },
  });
  return res.data;
};

export type BulkStudentRow = {
  fullname: string;
  phoneNumber: string;
  email: string;
  password?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  qualification?: string;
  collegeName?: string;
};

export type BulkImportResult = {
  total: number;
  created: { row: number; name: string; phoneNumber: string; username: string }[];
  failed: { row: number; name: string; phoneNumber: string; reason: string }[];
};

export const bulkImportStudents = async (payload: {
  batchId: string;
  feeOptionId: string;
  defaultPassword?: string;
  students: BulkStudentRow[];
}) => {
  const res: any = await api.post('/admin/students/bulk', payload);
  return res.data as BulkImportResult;
};

export const changeOwnPassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const res: any = await api.post('/users/change-password', payload);
  return res;
};
