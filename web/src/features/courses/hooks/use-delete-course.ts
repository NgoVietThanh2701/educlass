import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteCourse } from "../api/delete-course";
import { getErrorMessage } from "@/lib/error-message";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      toast.success("Đã xóa khóa học.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}