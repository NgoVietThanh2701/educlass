import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { DataAuthResponse } from "../types/auth-response.type";
import type {
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../types/verify-otp-request.type";

export async function verifyOtp(data: VerifyOtpRequest): Promise<DataAuthResponse> {
  const response = await axiosInstance.post<ApiResponse<DataAuthResponse>>(
    API_ENDPOINT.VERIFY_OTP,
    data,
  );

  return response.data.data;
}

export async function resendOtp(data: ResendOtpRequest): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>(API_ENDPOINT.RESEND_OTP, data);
}
