import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type { LessonAttachmentResponse } from "../types/lesson.type";

/**
 * Upload a single file as a lesson **attachment** (non-video files such as
 * PDF/DOC) — routed through the backend which pushes it to Cloudinary.
 *
 * NOTE: For VIDEO lessons the file is uploaded DIRECTLY from the browser to
 * Cloudinary (see `@/lib/cloudinary`), bypassing the backend entirely — that
 * path is handled in `use-create-lesson.ts`. This endpoint remains for general
 * lesson attachments (documents, etc.).
 *
 * Backend: POST /api/v1/courses/:courseId/sections/:sectionId/lessons/:lessonId/attachments
 *   - `multipart/form-data`, single file part named `file`.
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
