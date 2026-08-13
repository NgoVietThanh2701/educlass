import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type { CreateLessonRequest, LessonResponse } from "../types/lesson.type";

/**
 * Create a new lesson under a section for the current TEACHER.
 *
 * Backend: POST /api/v1/courses/:courseId/sections/:sectionId/lessons  (TEACHER only)
 * Body: `CreateLessonDto` = { title (required, <=200), description?, type?, order?,
 *   durationSeconds?, isPreview?, unlockRule? }
 *
 * `order` is omitted so the backend auto-assigns the next available position
 * (`(lastLesson?.order ?? 0) + 1`). Returns the created `LessonResponseDto`.
 */
export async function createLesson(
  courseId: string,
  sectionId: string,
  data: CreateLessonRequest,
): Promise<LessonResponse> {
  const response = await axiosInstance.post<ApiResponse<LessonResponse>>(
    `${API_ENDPOINT.COURSE_LESSONS}/${courseId}/sections/${sectionId}/lessons`,
    data,
  );

  return response.data.data;
}
