import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";

export default async function logout(): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>(API_ENDPOINT.LOGOUT);
}
