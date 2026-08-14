import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";

/**
 * Delete a section (TEACHER only). The backend cascades to its lessons,
 * assessments, contents, attachments and progress, best-effort removes linked
 * Cloudinary assets, then compacts the remaining sections' orders (1..n).
 *
 * Backend: DELETE /api/v1/courses/:courseId/sections/:sectionId
 */
export async function deleteSection(
  courseId: string,
  sectionId: string,
): Promise<void> {
  await axiosInstance.delete(
    `${API_ENDPOINT.COURSE_SECTIONS}/${courseId}/sections/${sectionId}`,
  );
}