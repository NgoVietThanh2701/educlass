import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { reorderLessons } from "../api/reorder-lessons";
import { getErrorMessage } from "@/lib/error-message";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";

interface ReorderLessonsMutationInput {
  sectionId: string;
  orderedIds: string[];
}

/**
 * Reorder the lessons inside a single section (lesson reordering is scoped to
 * the section only — never moved across sections).
 */
export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, orderedIds }: ReorderLessonsMutationInput) =>
      reorderLessons({ courseId, sectionId, orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.error(`Không thể lưu thứ tự bài học: ${getErrorMessage(error)}`);
    },
  });
}