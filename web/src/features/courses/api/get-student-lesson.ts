import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { LessonResponse } from "../types/lesson.type";

/**
 * Fetch a lesson's full content for the current STUDENT (video/text + attachments).
 *
 * Backend: GET /api/v1/courses/:courseId/sections/:sectionId/lessons/student/:lessonId
 *   (STUDENT only — `@Get('student/:lessonId')`)
 * Returns `LessonResponseDto`. Requires an active enrollment.
 */
export async function getStudentLesson(
  courseId: string,
  sectionId: string,
  lessonId: string,
): Promise<LessonResponse> {
  const response = await axiosInstance.get<ApiResponse<LessonResponse>>(
    `${API_ENDPOINT.COURSE_SECTIONS}/${courseId}/sections/${sectionId}/lessons/student/${lessonId}`,
  );
  return response.data.data;
}
