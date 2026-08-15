import { axiosInstance } from "@//lib/axios";
import { API_ENDPOINT } from "@//constants/api";

/**
 * Delete a course (TEACHER only). The backend revokes access, cleans up
 * Cloudinary assets, removes progress, and cascades to all content.
 *
 * Backend: DELETE /api/v1/teacher/courses/:courseId
 */
export async function deleteCourse(courseId: string): Promise<void> {
  await axiosInstance.delete(
    `${API_ENDPOINT.TEACHER_COURSES}/${courseId}`,
  );
}