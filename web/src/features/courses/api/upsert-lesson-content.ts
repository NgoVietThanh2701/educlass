import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type { LessonContentRequest } from "../types/lesson.type";

/**
 * Attach uploaded media to a lesson's content (e.g. the video `objectKey` +
 * duration captured on the frontend).
 *
 * Backend: POST /api/v1/courses/:courseId/sections/:sectionId/lessons/:lessonId/content
 * Body: `LessonContentDto` = { objectKey?, videoDuration?, textContent? }
 */
export async function upsertLessonContent(
  courseId: string,
  sectionId: string,
  lessonId: string,
  data: LessonContentRequest,
): Promise<void> {
  await axiosInstance.post<ApiResponse<unknown>>(
    `${API_ENDPOINT.COURSE_LESSONS}/${courseId}/sections/${sectionId}/lessons/${lessonId}/content`,
    data,
  );
}
