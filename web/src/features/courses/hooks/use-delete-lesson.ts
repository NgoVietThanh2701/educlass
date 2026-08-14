import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteLesson, type DeleteLessonArgs } from "../api/delete-lesson";
import { getErrorMessage } from "@/lib/error-message";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import { COURSE_QUERY_KEYS } from "./use-courses";

/** Delete a lesson and refresh both the teacher course list and the open detail. */
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: DeleteLessonArgs) => deleteLesson(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã xóa bài học.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}