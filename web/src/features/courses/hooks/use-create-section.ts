import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createSection } from "../api/create-section";
import { getErrorMessage } from "@/lib/error-message";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import type { CreateSectionRequest } from "../types/section.type";

/**
 * Create a section under a course. On success, refresh both the teacher
 * course list and the affected course detail (which carries the section tree
 * shown on the edit page).
 */
export function useCreateSection(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionRequest) => createSection(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã tạo phần học.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
