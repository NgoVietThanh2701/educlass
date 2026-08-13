import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCourse } from "../api/create-course";
import { COURSE_QUERY_KEYS } from "./use-courses";

/** Create a course and refresh the teacher course list afterwards. */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
    },
  });
}