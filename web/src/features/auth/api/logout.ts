import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";

export default async function logout() {
  const response = await axiosInstance.post<ApiResponse<null>>(
    API_ENDPOINT.LOGOUT,
  );

  return response.data;
}
