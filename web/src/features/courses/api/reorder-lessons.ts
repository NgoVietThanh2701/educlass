import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/constants/api";

export interface ReorderLessonsInput {
  courseId: string;
  sectionId: string;
  orderedIds: string[];
}

/**
 * Reorder the lessons WITHIN a single section by supplying their ids in the new
 * display order. Lessons can only be reordered inside their own section.
 *
 * Backend: PATCH /api/v1/courses/:courseId/sections/:sectionId/lessons/reorder
 * Body: { orderedIds: string[] }
 */
export async function reorderLessons({
  courseId,
  sectionId,
  orderedIds,
}: ReorderLessonsInput): Promise<void> {
  await axiosInstance.patch(
    `${API_ENDPOINT.COURSE_LESSONS}/${courseId}/sections/${sectionId}/lessons/reorder`,
    { orderedIds },
  );
}