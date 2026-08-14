import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";

/**
 * Reorder the sections of a course by supplying their ids in the new display
 * order. The backend rewrites `order` to 1..n inside a transaction.
 *
 * Backend: PATCH /api/v1/courses/:courseId/sections/reorder
 * Body: { orderedIds: string[] }
 */
export async function reorderSections(
  courseId: string,
  orderedIds: string[],
): Promise<void> {
  await axiosInstance.patch(
    `${API_ENDPOINT.COURSE_SECTIONS}/${courseId}/sections/reorder`,
    { orderedIds },
  );
}