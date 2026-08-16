import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { StudentCourseDetail } from "../types/student-course.type";

/**
 * Fetch a single enrolled course's full detail for the current STUDENT.
 *
 * Backend: GET /api/v1/student/courses/:courseId  (STUDENT only)
 * Returns `CourseStudentDetailDto`: course metadata + overall progress +
 * ordered sections (lessons carry `isUnlocked` + per-lesson `progress`,
 * assessments carry `questionCount`). Requires an active enrollment, otherwise
 * the `CourseAccessService` returns 403/404.
 */
export async function getStudentCourseDetail(
  courseId: string,
): Promise<StudentCourseDetail> {
  const response = await axiosInstance.get<ApiResponse<StudentCourseDetail>>(
    `${API_ENDPOINT.STUDENT_COURSES}/${courseId}`,
  );
  return response.data.data;
}
