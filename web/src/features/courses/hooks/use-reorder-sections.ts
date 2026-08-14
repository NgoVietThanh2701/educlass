import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { reorderSections } from "../api/reorder-sections";
import { getErrorMessage } from "@/lib/error-message";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";

/**
 * Reorder a course's sections. On completion the teacher list and course detail
 * are refreshed; on failure the detail is refreshed too, which re-syncs the
 * optimistic UI ordering back to the server state.
 */
export function useReorderSections(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderSections(courseId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.error(`Không thể lưu thứ tự phần: ${getErrorMessage(error)}`);
    },
  });
}