import { API_ENDPOINT } from "@/constants/api";
import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

interface RefreshResponse {
  accessToken: string;
}

export async function refreshAccessToken() {
  const response = await axiosInstance.post<ApiResponse<RefreshResponse>>(
    API_ENDPOINT.REFRESH,
  );

  return response.data.data.accessToken;
}
