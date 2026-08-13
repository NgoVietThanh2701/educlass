import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCourse } from "../api/update-course";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import type { UpdateCourseRequest } from "../types/create-course.type";

/** Update a course's general metadata, then refresh list + detail caches. */
export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCourseRequest) => updateCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      // Invalidate all course-detail queries (key prefix ["courses","detail"]).
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
    },
  });
}