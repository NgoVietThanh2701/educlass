import { API_ENDPOINT } from "@/constants/api";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { DataAuthResponse } from "../types/auth-response.type";

/**
 * POST /auth/refresh (httpOnly refresh-token cookie, sent automatically).
 *
 * Returns BOTH a fresh access token AND the current user profile, so a hard
 * reload only needs this single round-trip to restore the whole session.
 */
export async function refreshAccessToken(): Promise<DataAuthResponse> {
  const response = await axiosInstance.post<ApiResponse<DataAuthResponse>>(
    API_ENDPOINT.REFRESH,
  );

  return response.data.data;
}
