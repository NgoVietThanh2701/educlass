import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import { DataAuthResponse } from "../types/auth-response.type";
import {
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../types/verify-otp-request.type";

export async function verifyOtp(data: VerifyOtpRequest) {
  const response = await axiosInstance.post<ApiResponse<DataAuthResponse>>(
    API_ENDPOINT.VERIFY_OTP,
    data,
  );

  return response.data;
}

export async function resendOtp(data: ResendOtpRequest) {
  const response = await axiosInstance.post<ApiResponse<null>>(
    API_ENDPOINT.RESEND_OTP,
    data,
  );

  return response.data;
}
