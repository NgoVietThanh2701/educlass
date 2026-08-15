import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { LoginRequest } from "../types/login-request.type";
import type { ApiResponse } from "@/types/api";
import type { DataAuthResponse } from "../types/auth-response.type";

export async function login(data: LoginRequest): Promise<DataAuthResponse> {
  const response = await axiosInstance.post<ApiResponse<DataAuthResponse>>(
    API_ENDPOINT.LOGIN,
    data,
  );

  return response.data.data;
}
