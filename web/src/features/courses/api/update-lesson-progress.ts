import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { StudentLessonProgress } from "../types/student-course.type";

/** Body for `PATCH .../lessons/:lessonId/progress` (`UpdateLessonProgressDto`). */
export interface UpdateLessonProgressRequest {
  completed?: boolean;
  lastPosition?: number;
}

/**
 * Backend: PATCH /api/v1/courses/:courseId/sections/:sectionId/lessons/:lessonId/progress
 *   (STUDENT only)
 * Saves/resumes lesson progress. `completed=true` marks the lesson done, and
 * the backend recomputes downstream lesson unlock state on the next detail fetch.
 */
export async function upsertLessonProgress(
  courseId: string,
  sectionId: string,
  lessonId: string,
  data: UpdateLessonProgressRequest,
): Promise<StudentLessonProgress> {
  const response = await axiosInstance.patch<ApiResponse<StudentLessonProgress>>(
    `${API_ENDPOINT.COURSE_SECTIONS}/${courseId}/sections/${sectionId}/lessons/${lessonId}/progress`,
    data,
  );
  return response.data.data;
}
