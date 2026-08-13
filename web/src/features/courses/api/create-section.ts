import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import { ApiResponse } from "@/types/api";
import type { CreateSectionRequest, SectionResponse } from "../types/section.type";

/**
 * Create a new section under a course for the current TEACHER.
 *
 * Backend: POST /api/v1/courses/:courseId/sections  (TEACHER only)
 * Body: `CreateSectionDto` = { title (required, <=200), description?, order? }
 *
 * `order` is omitted so the backend auto-assigns the next available position
 * (its service uses `(lastSection?.order ?? 0) + 1`).
 * Returns the created `SectionResponseDto`.
 */
export async function createSection(
  courseId: string,
  data: CreateSectionRequest,
): Promise<SectionResponse> {
  const response = await axiosInstance.post<ApiResponse<SectionResponse>>(
    `${API_ENDPOINT.COURSE_SECTIONS}/${courseId}/sections`,
    data,
  );

  return response.data.data;
}
