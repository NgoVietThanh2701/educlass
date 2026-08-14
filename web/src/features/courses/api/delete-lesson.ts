import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";

export interface DeleteLessonArgs {
  courseId: string;
  sectionId: string;
  lessonId: string;
}

/**
 * Delete a lesson (TEACHER only). The backend cascades the delete to the
 * lesson's content, attachments and progress, and best-effort removes the
 * linked Cloudinary assets.
 *
 * Backend: DELETE /api/v1/courses/:courseId/sections/:sectionId/lessons/:lessonId
 */
export async function deleteLesson({
  courseId,
  sectionId,
  lessonId,
}: DeleteLessonArgs): Promise<void> {
  await axiosInstance.delete(
    `${API_ENDPOINT.COURSE_LESSONS}/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
  );
}