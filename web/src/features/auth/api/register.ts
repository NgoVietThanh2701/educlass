import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { RegisterRequest } from "../types/register-request.type";
import type { User } from "@/types/user.type";

export async function register(data: RegisterRequest): Promise<User> {
  const response = await axiosInstance.post<ApiResponse<User>>(
    API_ENDPOINT.REGISTER,
    data,
  );

  return response.data.data;
}
