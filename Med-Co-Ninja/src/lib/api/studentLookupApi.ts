import { api } from '@/utils/axios';

/** The axios instance already unwraps `res.data`; the backend wraps payloads in { data }. */
const unwrap = <T,>(res: any): T => (res?.data ?? res) as T;
const base = (role?: string) => (role === 'TEACHER' || role === 'FACULTY' ? '/teacher' : '/admin');

export type StudentHit = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  batches: { id: string; name: string; batchType: string }[];
};

export type Payment = {
  id: string;
  amount: number;
  pendingAmount?: number;
  createdAt: string;
  account?: { name: string } | null;
  teacher?: { user?: { fullname?: string } } | null;
};

export type StudentProfile = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  username?: string;
  joinedAt?: string;
  address?: string;
  collegeName?: string;
  qualification?: string;
  placementReceived?: string;
  internship?: string;
  certificate?: string;
  referrals: number;
  batches: {
    id: string;
    name: string;
    batchType: string;
    startDate: string;
    endDate: string;
    course?: string;
    teacher?: string;
    attendance: { present: number; classes: number; percentage: number };
    dailyTasks: number;
    assignments: number;
  }[];
  fees: {
    totalFees: number;
    discount: number;
    paidFees: number;
    pendingFees: number;
    followUp: { amount: number; followUpDate?: string; notes?: string } | null;
    payments: Payment[];
  };
  tasksCompleted: number;
  assignmentsCompleted: number;
  exams: { id: string; marks: number; percentage?: number; createdAt: string; exam: { name: string } }[];
  interviews: {
    id: string;
    interviewDate: string;
    interviewMode: string;
    location?: string;
    status: string;
    placement: { companyName: string; jobRole: string };
  }[];
};

export type PaymentLink = {
  id: string;
  studentId: string;
  linkId: string;
  shortUrl: string;
  amount: number;
  status: string;
  createdBy?: string;
  createdAt: string;
};

export type StudentNotification = {
  id: string;
  type: 'CLASS' | 'INTERVIEW' | 'TASK' | 'ASSIGNMENT' | 'EXAM' | 'FEE' | 'PAYMENT';
  title: string;
  message: string;
  date: string;
  tab?: number;
  url?: string;
};

export const searchStudents = async (role: string | undefined, q: string, limit = 15) =>
  unwrap<StudentHit[]>(await api.get(`${base(role)}/lookup/students`, { params: { q, limit } }));

export const getStudentProfile = async (role: string | undefined, id: string) =>
  unwrap<StudentProfile>(await api.get(`${base(role)}/lookup/students/${id}`));

export const getGatewayStatus = async (role?: string) =>
  unwrap<{ configured: boolean }>(await api.get(`${base(role)}/payment-links/status`));

export const listPaymentLinks = async (role: string | undefined, studentId: string) =>
  unwrap<PaymentLink[]>(await api.get(`${base(role)}/payment-links`, { params: { studentId } }));

export const createPaymentLink = async (role: string | undefined, studentId: string, amount?: number) =>
  unwrap<PaymentLink>(await api.post(`${base(role)}/payment-links`, { studentId, amount }));

export const syncPaymentLink = async (role: string | undefined, id: string) =>
  unwrap<PaymentLink>(await api.post(`${base(role)}/payment-links/${id}/sync`));

export const cancelPaymentLink = async (role: string | undefined, id: string) =>
  unwrap<PaymentLink>(await api.post(`${base(role)}/payment-links/${id}/cancel`));

export const getStudentNotifications = async () => unwrap<StudentNotification[]>(await api.get('/student/notifications'));

/** Shape the receipt popup expects (same as a row of the batch Fees table). */
export const toReceiptStudent = (p: StudentProfile, batchId?: string) => {
  const b = p.batches.find((x) => x.id === batchId) || p.batches[0];
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    totalFees: p.fees.totalFees,
    discount: p.fees.discount,
    paidFees: p.fees.paidFees,
    pendingFees: p.fees.pendingFees,
    followUp: p.fees.followUp,
    payments: p.fees.payments,
    batch: b ? { name: b.name, batchType: b.batchType, startDate: b.startDate, endDate: b.endDate } : {},
  };
};
