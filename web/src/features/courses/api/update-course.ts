import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { UpdateCourseRequest } from "../types/create-course.type";
import type { TeacherCourseDetail } from "../types/course.type";

/**
 * Update a course's general metadata for the current TEACHER.
 *
 * Backend: PATCH /api/v1/teacher/courses/:courseId
 * Body: `UpdateCourseDto` (PartialType of CreateCourseDto — all fields optional).
 * Returns the updated course (`CourseResponseDto`).
 */
export async function updateCourse(
  courseId: string,
  data: UpdateCourseRequest,
): Promise<TeacherCourseDetail> {
  const response = await axiosInstance.patch<ApiResponse<TeacherCourseDetail>>(
    `${API_ENDPOINT.TEACHER_COURSES}/${courseId}`,
    data,
  );

  return response.data.data;
}