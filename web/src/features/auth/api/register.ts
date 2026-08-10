import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import { RegisterRequest } from "../types/register-request.type";

export async function register(data: RegisterRequest) {
  const response = await axiosInstance.post<ApiResponse<null>>(
    API_ENDPOINT.REGISTER,
    data,
  );

  return response.data;
}
