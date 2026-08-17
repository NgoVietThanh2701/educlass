import { useMutation, useQueryClient } from "@tanstack/react-query";

import { enrollCourse } from "../api/enrollments";
import { COURSE_QUERY_KEYS } from "@/features/courses/hooks/use-courses";
import { CONVERSATION_QUERY_KEYS } from "@/features/chat/hooks/use-conversations";

/**
 * Enroll the current student into a course. Refreshes both the student course
 * list and the conversation list afterward: enrolling may add the student to the
 * course's existing group conversation (or seed them when the teacher later
 * opens it), so the group should appear in the message inbox.
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
      queryClient.invalidateQueries({
        queryKey: CONVERSATION_QUERY_KEYS.all,
      });
    },
  });
}
