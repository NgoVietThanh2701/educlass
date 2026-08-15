import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { ChangeCourseStatusRequest } from "../types/create-course.type";
import type { TeacherCourseDetail } from "../types/course.type";

/**
 * Change a course's status for the current TEACHER.
 *
 * Backend: PATCH /api/v1/teacher/courses/:courseId/status
 * Body: `ChangeCourseStatusDto` = `{ status: CourseStatus }`.
 * Backend enforces allowed transitions (e.g. DRAFT -> PUBLISHED/ARCHIVED).
 * Returns the updated course (`CourseResponseDto`).
 */
export async function changeCourseStatus(
  courseId: string,
  data: ChangeCourseStatusRequest,
): Promise<TeacherCourseDetail> {
  const response = await axiosInstance.patch<ApiResponse<TeacherCourseDetail>>(
    `${API_ENDPOINT.TEACHER_COURSES}/${courseId}/status`,
    data,
  );

  return response.data.data;
}