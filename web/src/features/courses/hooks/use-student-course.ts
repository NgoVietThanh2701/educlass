import { useStudentCourses } from "./use-courses";
import { useStudentCourseDetail } from "./use-student-course-detail";

/**
 * Resolve a student course by `:slug`.
 *
 * The student-detail endpoint (`GET /student/courses/:courseId`) is keyed by the
 * DB `courseId`, not the slug — so we look the id up from the cached enrolled
 * courses list (`useStudentCourses`, shared with the course list page). The slug
 * is also matched there to grab `category`, which the detail DTO omits.
 *
 * Returns the cached query result plus the resolved `courseId` (and `category`)
 * so callers can fan out further queries (lesson content, etc.).
 */
export function useStudentCourse(slug: string | undefined) {
  const enrollments = useStudentCourses();
  const course = enrollments.data?.find((item) => item.slug === slug);

  const detail = useStudentCourseDetail(course?.id);

  return {
    ...detail,
    courseId: course?.id,
    category: course?.category,
    /** True while the slug→id lookup (enrolled-courses list) is still in flight. */
    isResolving: Boolean(
      enrollments.isLoading || (enrollments.isFetching && !course),
    ),
  };
}
