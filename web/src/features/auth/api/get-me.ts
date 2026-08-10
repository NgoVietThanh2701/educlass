import { axiosInstance } from "@/lib/axios";

import type { User } from "../../../types/user.type";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";

export async function getMe() {
  const response = await axiosInstance.get<ApiResponse<User>>(API_ENDPOINT.ME);

  return response.data.data;
}
