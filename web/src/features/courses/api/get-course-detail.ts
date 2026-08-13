import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type { CourseTeacherDetail } from "../types/course-detail.type";

/**
 * Fetch a single course's full detail for the current TEACHER.
 *
 * Backend: GET /api/v1/teacher/courses/:courseId
 * Returns the `CourseTeacherDetailDto` (course metadata + sections with
 * lessons and assessments). A `CourseAccessService` check ensures the
 * teacher owns the course (otherwise 404/403).
 */
export async function getTeacherCourseDetail(
  courseId: string,
): Promise<CourseTeacherDetail> {
  const response = await axiosInstance.get<ApiResponse<CourseTeacherDetail>>(
    `${API_ENDPOINT.TEACHER_COURSES}/${courseId}`,
  );

  return response.data.data;
}