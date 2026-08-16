import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";

export interface EnrollmentResponse {
  courseId: string;
  studentId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  enrolledAt: string;
  joinedAt: string;
  completedAt?: string | null;
}

/**
 * Enroll the current (authenticated) student into a published course.
 * POST /enrollments/courses/:courseId — payment is intentionally skipped for
 * now and handled in a later iteration.
 */
export async function enrollCourse(
  courseId: string,
): Promise<EnrollmentResponse> {
  const response = await axiosInstance.post<ApiResponse<EnrollmentResponse>>(
    `${API_ENDPOINT.ENROLLMENTS}/courses/${courseId}`,
  );

  return response.data.data;
}
