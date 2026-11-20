import { api } from '@/utils/axios';

export type InstituteAdmin = {
  id: string;
  userId: string;
  adminId: string;
  username: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  city: string;
  state: string;
  country: string;
  pincode: string;
  address: string;
  gst?: string | null;
  tagLine?: string | null;
  createdAt: string;
};

export type PaginatedAdmins = {
  data: InstituteAdmin[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  activeCount: number;
  totalCount: number;
};

export type CreateAdminPayload = {
  fullname: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  adminId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gst?: string;
  tagLine?: string;
};

// The axios response interceptor already unwraps res.data, so these return the ApiResponse body.
export const getAdmins = async (params: { page: number; limit: number; searchTerm?: string }) => {
  const res: any = await api.get('/superadmin/admin', {
    params: {
      page: String(params.page),
      limit: String(params.limit),
      ...(params.searchTerm ? { searchTerm: params.searchTerm } : {}),
    },
  });
  return res.data as PaginatedAdmins;
};

export const createAdmin = async (payload: CreateAdminPayload) => {
  const res: any = await api.post('/superadmin/admin', payload);
  return res.data;
};

export const deleteAdmin = async (id: string) => {
  await api.delete(`/superadmin/admin/${id}`);
};

export type UpdateAdminPayload = Partial<Omit<CreateAdminPayload, 'password'>> & {
  password?: string | null;
  isActive?: boolean;
};

export const updateAdmin = async (id: string, payload: UpdateAdminPayload) => {
  const res: any = await api.patch(`/superadmin/admin/${id}`, payload);
  return res.data as InstituteAdmin;
};
