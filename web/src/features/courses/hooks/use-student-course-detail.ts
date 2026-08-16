import { useQuery } from "@tanstack/react-query";

import { getStudentCourseDetail } from "../api/get-student-course-detail";

export const STUDENT_COURSE_DETAIL_QUERY_KEY = [
  "courses",
  "student-detail",
] as const;

/**
 * Fetch the full student course detail (overall progress + per-lesson
 * `isUnlocked`/`progress` + assessments).
 *
 * The endpoint is keyed by the DB `courseId`, which the caller resolves from the
 * route `:slug` via `useStudentCourse`. Disabled until a `courseId` exists.
 */
export function useStudentCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: [...STUDENT_COURSE_DETAIL_QUERY_KEY, courseId] as const,
    queryFn: () => getStudentCourseDetail(courseId as string),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}
