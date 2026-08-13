import { useMutation, useQueryClient } from "@tanstack/react-query";

import { changeCourseStatus } from "../api/change-course-status";
import { COURSE_QUERY_KEYS } from "./use-courses";
import { COURSE_DETAIL_QUERY_KEY } from "./use-course-detail";
import type { ChangeCourseStatusRequest } from "../types/create-course.type";

/** Change a course's status, then refresh list + detail caches. */
export function useChangeCourseStatus(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangeCourseStatusRequest) =>
      changeCourseStatus(courseId, data),
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.teacher });
      queryClient.invalidateQueries({ queryKey: COURSE_DETAIL_QUERY_KEY });
      return updatedCourse;
    },
  });
}