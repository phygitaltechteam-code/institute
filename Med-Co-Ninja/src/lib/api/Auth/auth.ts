import { unAuthenticatedApi } from "@/utils/axios";

export const loginFaculty = async (credentials: {
  username?: string;
  // email?: string;
  password: string;
}) => {
  const response = await unAuthenticatedApi.post('/users/login', credentials);
  return response.data;
};