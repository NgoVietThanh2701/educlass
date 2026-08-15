import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { RoleUser } from "@/types/role.type";
import { getTeacherCourses, getStudentCourses } from "../api/courses";
import type { Course, TeacherCourse } from "../types/course.type";

export const COURSE_QUERY_KEYS = {
  all: ["courses"] as const,
  teacher: ["courses", "teacher"] as const,
  student: ["courses", "student"] as const,
};

/** All courses created by the current teacher (includes teacher-only `status`). */
export function useTeacherCourses() {
  return useQuery({
    queryKey: COURSE_QUERY_KEYS.teacher,
    queryFn: getTeacherCourses,
  });
}

/** All courses the current student is enrolled in (no `status` field). */
export function useStudentCourses() {
  return useQuery({
    queryKey: COURSE_QUERY_KEYS.student,
    queryFn: getStudentCourses,
  });
}

/**
 * Role-aware course list query. Resolves the correct endpoint based on the
 * authenticated user's role so the same page can serve both TEACHER and STUDENT.
 * Returns teacher data (with `status`) for a TEACHER, otherwise student data.
 */
export function useCourses() {
  const role = useAuthStore((state) => state.user?.role);
  const isTeacher = role === RoleUser.TEACHER;

  const query = useQuery({
    queryKey: isTeacher ? COURSE_QUERY_KEYS.teacher : COURSE_QUERY_KEYS.student,
    queryFn: isTeacher ? getTeacherCourses : getStudentCourses,
    enabled: role != null,
  });

  return {
    ...query,
    data: query.data as Course[],
    teacherData: query.data as TeacherCourse[] | undefined,
    isTeacher,
    role,
  };
}
