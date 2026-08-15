import { useQuery } from "@tanstack/react-query";

import { getTeacherCourseDetail } from "../api/get-course-detail";

export const COURSE_DETAIL_QUERY_KEY = ["courses", "detail"] as const;

/**
 * Fetch the full teacher course detail. Disabled until a `courseId` is provided.
 * Transient network errors are retried via the global QueryClient defaults.
 */
export function useTeacherCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: [...COURSE_DETAIL_QUERY_KEY, courseId] as const,
    queryFn: () => getTeacherCourseDetail(courseId as string),
    enabled: !!courseId,
  });
}