import { useMutation, useQueryClient } from "@tanstack/react-query";

import { enrollCourse } from "../api/enrollments";
import { COURSE_QUERY_KEYS } from "@/features/courses/hooks/use-courses";

/**
 * Enroll the current student into a course. Refreshes the student course list
 * afterward so the newly-joined course appears in the dashboard immediately.
 */
export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === COURSE_QUERY_KEYS.student[0] &&
          query.queryKey[1] === COURSE_QUERY_KEYS.student[1],
      });
    },
  });
}
