import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/error-message";
import { updateSection } from "../api/update-section";
import type { CourseTeacherDetail } from "../types/course-detail.type";
import type { UpdateSectionRequest } from "../types/section.type";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import { COURSE_QUERY_KEYS } from "./use-courses";

/**
 * Update a section's metadata.
 *
 * On success the cached course detail is patched optimistically with the exact
 * server response, so the curriculum tree updates in the same tick the toast
 * appears (no waiting for a background refetch of the heavy detail endpoint).
 */
export function useUpdateSection(courseId: string, sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSectionRequest) =>
      updateSection(courseId, sectionId, data),
    onSuccess: (updatedSection) => {
      // Optimistic cache patch → instant UI update. `updatedSection` carries
      // the authoritative title/description; lessons/assessments stay as-is
      // because they are not part of the section-update response.
      queryClient.setQueryData<CourseTeacherDetail>(
        [...COURSE_DETAIL_QUERY_KEY, courseId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            sections: old.sections.map((section) =>
              section.id === sectionId
                ? { ...section, ...updatedSection }
                : section,
            ),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã cập nhật phần học.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}