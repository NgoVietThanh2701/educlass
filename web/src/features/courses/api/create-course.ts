import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { CreateCoursePayload } from "../types/create-course.type";
import type { TeacherCourseDetail } from "../types/course.type";

/**
 * Create a new course for the current TEACHER.
 *
 * Backend: POST /api/v1/teacher/courses
 * - Multipart (`FormData`): the DTO fields as text parts + optional `file`
 *   (thumbnail) handled by `FileInterceptor('file')`.
 * - Numeric fields are sent as strings; the global `ValidationPipe` (with
 *   `enableImplicitConversion`) coerces them back to numbers on the backend.
 */
export async function createCourse({
  data,
  thumbnail,
}: CreateCoursePayload): Promise<TeacherCourseDetail> {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("shortDescription", data.shortDescription);
  formData.append("description", data.description);
  if (data.category) {
    formData.append("category", data.category);
  }
  formData.append("level", data.level ?? "ALL");
  formData.append("language", data.language ?? "vi");
  formData.append("price", String(data.price));
  formData.append("estimatedDuration", String(data.estimatedDuration));

  if (data.requirements) {
    formData.append("requirements", data.requirements);
  }
  if (data.learningOutcomes) {
    formData.append("learningOutcomes", data.learningOutcomes);
  }
  if (thumbnail) {
    formData.append("file", thumbnail);
  }

  const response = await axiosInstance.post<ApiResponse<TeacherCourseDetail>>(
    API_ENDPOINT.TEACHER_COURSES,
    formData,
  );

  return response.data.data;
}
