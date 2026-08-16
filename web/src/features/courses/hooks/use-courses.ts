import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { RoleUser } from "@/types/role.type";
import {
  getTeacherCourses,
  getStudentCourses,
  getPublicCourse,
  getPublicCourses,
} from "../api/courses";
import type { PublicCoursesParams } from "../api/courses";
import type { Course, TeacherCourse } from "../types/course.type";

export const COURSE_QUERY_KEYS = {
  all: ["courses"] as const,
  teacher: ["courses", "teacher"] as const,
  student: ["courses", "student"] as const,
  public: ["courses", "public"] as const,
  detail: ["courses", "detail"] as const,
};

/** Published courses for the public homepage/catalog — no auth required. */
export function usePublicCourses(params: PublicCoursesParams = {}) {
  const paramsKey = JSON.stringify([
    params.page ?? 1,
    params.limit ?? 10,
    params.category || null,
    params.price || null,
    params.level || null,
    params.search?.trim() || null,
    params.sortBy ?? "publishedAt",
    params.order ?? "desc",
  ]);

  return useQuery({
    queryKey: [...COURSE_QUERY_KEYS.public, paramsKey],
    queryFn: () => getPublicCourses(params),
  });
}

/** Single published course detail (public catalog). Disabled until a slug exists. */
export function usePublicCourse(slug: string | undefined) {
  return useQuery({
    queryKey: [...COURSE_QUERY_KEYS.detail, slug] as const,
    queryFn: () => getPublicCourse(slug as string),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

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
