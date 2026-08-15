import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { CreateLessonRequest, LessonResponse } from "../types/lesson.type";

/**
 * Update a lesson's metadata (title, type, order, durations, flags) for the
 * current TEACHER. Lesson *content* (video/text) is upserted separately via
 * `upsertLessonContent`.
 *
 * Backend: PATCH /api/v1/courses/:courseId/sections/:sectionId/lessons/:lessonId
 * Body: `UpdateLessonDto` = partial of `CreateLessonDto`
 */
export async function updateLesson(
  courseId: string,
  sectionId: string,
  lessonId: string,
  data: CreateLessonRequest,
): Promise<LessonResponse> {
  const response = await axiosInstance.patch<ApiResponse<LessonResponse>>(
    `${API_ENDPOINT.COURSE_LESSONS}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
    data,
  );

  return response.data.data;
}