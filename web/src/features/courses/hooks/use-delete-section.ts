import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteSection } from "../api/delete-section";
import { getErrorMessage } from "@/lib/error-message";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";

/** Delete a section and refresh both the course list and the open detail. */
export function useDeleteSection(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: string) => deleteSection(courseId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã xóa phần học.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}