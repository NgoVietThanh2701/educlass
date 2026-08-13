import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type { LessonAttachmentResponse } from "../types/lesson.type";

/**
 * Upload a single file as a lesson attachment (frontend-driven upload step).
 *
 * Backend: POST /api/v1/courses/:courseId/sections/:sectionId/lessons/:lessonId/attachments
 *   - `multipart/form-data`, single file part named `file`.
 *   - The backend accepts all `UPLOAD_ALLOWED_MIME_TYPES` including `video/mp4`.
 *
 * NOTE: video processing/streaming is handled at the **frontend** side. We only
 * need the returned `objectKey` so we can attach the video to the lesson content
 * via `upsertLessonContent`. No transcoding happens here.
 */
export async function uploadLessonAttachment(
  courseId: string,
  sectionId: string,
  lessonId: string,
  file: File,
): Promise<LessonAttachmentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<ApiResponse<LessonAttachmentResponse>>(
    `${API_ENDPOINT.COURSE_LESSONS}/${courseId}/sections/${sectionId}/lessons/${lessonId}/attachments`,
    formData,
  );

  return response.data.data;
}
