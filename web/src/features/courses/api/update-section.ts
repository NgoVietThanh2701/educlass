import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type {
  SectionResponse,
  UpdateSectionRequest,
} from "../types/section.type";

/**
 * Update a section's metadata (title, description) for the current TEACHER.
 *
 * Backend: PATCH /api/v1/courses/:courseId/sections/:sectionId
 * Body: `UpdateSectionDto` (PartialType of CreateSectionDto — all fields optional).
 * Returns the updated `SectionResponseDto`.
 */
export async function updateSection(
  courseId: string,
  sectionId: string,
  data: UpdateSectionRequest,
): Promise<SectionResponse> {
  const response = await axiosInstance.patch<ApiResponse<SectionResponse>>(
    `${API_ENDPOINT.COURSE_SECTIONS}/${courseId}/sections/${sectionId}`,
    data,
  );

  return response.data.data;
}