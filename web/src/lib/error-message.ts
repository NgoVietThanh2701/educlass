import type { AxiosError } from "axios";

/**
 * Extract a human-readable message from an API error.
 *
 * Backend error bodies come in two shapes (via AppException / NestJS ValidationPipe):
 *   - { code, message: string }
 *   - { statusCode, message: string[] | string, error }   (validation)
 * Falls back to the raw axios message for anything unexpected.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }

  const axiosError = error as AxiosError<{
    message?: string | string[];
    code?: string;
    statusCode?: number;
  }>;

  const message = axiosError.response?.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim() !== "") {
    return message;
  }

  return (
    axiosError.message ||
    "Đã có lỗi xảy ra. Vui lòng thử lại."
  );
}